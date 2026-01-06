import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { z } from 'zod'

const generateSchema = z.object({
  academic_year_id: z.string().uuid().optional(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  working_days: z.number().int().min(1).max(31).default(26),
  staff_ids: z.array(z.string().uuid()).optional(), // Optional: generate for specific staff only
})

// POST - Generate payroll for all staff with salary assignments
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = generateSchema.parse(body)
    const { month, year, working_days, staff_ids, academic_year_id } = validatedData
    const school_id = authUser.schoolId

    console.log('Generate Payroll - Request:', { school_id, month, year })

    // First, get ALL staff for debugging
    const { data: allStaffDebug, error: debugError } = await supabase
      .from('staff')
      .select('id, school_id, status, first_name')

    console.log('All staff in DB:', allStaffDebug)
    console.log('Debug error:', debugError)

    // Get staff for this school - simple query with just eq
    const { data: staffList, error: staffError } = await supabase
      .from('staff')
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        designation,
        department_id,
        status,
        school_id
      `)
      .eq('school_id', school_id)

    console.log('Staff for school:', staffList)
    console.log('Staff error:', staffError)

    if (staffError) {
      console.error('Error fetching staff:', staffError)
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    // Filter active staff in code instead of query
    const activeStaff = (staffList || []).filter(s =>
      s.status === 'active' || s.status === 'Active' || !s.status
    )

    console.log('Active staff count:', activeStaff.length)

    if (activeStaff.length === 0) {
      return NextResponse.json({
        error: 'No active staff found',
        debug: {
          school_id,
          totalStaffInDb: allStaffDebug?.length || 0,
          staffForSchool: staffList?.length || 0,
          staffSchoolIds: allStaffDebug?.map(s => s.school_id)
        }
      }, { status: 400 })
    }

    // Now get salary assignments for these staff
    const staffIds = activeStaff.map(s => s.id)
    const { data: assignments } = await supabase
      .from('staff_salary_assignments')
      .select('id, staff_id, basic_salary, salary_structure_id, is_current')
      .in('staff_id', staffIds)
      .eq('is_current', true)

    console.log('Assignments found:', assignments?.length || 0)

    // Get unique structure IDs
    const structureIds = [...new Set(assignments?.filter(a => a.salary_structure_id).map(a => a.salary_structure_id) || [])]
    console.log('Structure IDs:', structureIds)

    // Fetch structures with their details
    let structuresMap: Record<string, any> = {}
    if (structureIds.length > 0) {
      const { data: structures } = await supabase
        .from('salary_structures')
        .select('id, name')
        .in('id', structureIds)

      // Fetch structure details separately
      const { data: structureDetails } = await supabase
        .from('salary_structure_details')
        .select('id, salary_structure_id, amount, percentage, salary_component_id')
        .in('salary_structure_id', structureIds)

      // Fetch salary components
      const componentIds = [...new Set(structureDetails?.map(d => d.salary_component_id) || [])]
      let componentsMap: Record<string, any> = {}
      if (componentIds.length > 0) {
        const { data: salaryComponents } = await supabase
          .from('salary_components')
          .select('id, name, component_type, is_percentage, percentage_of, default_value')
          .in('id', componentIds)

        componentsMap = (salaryComponents || []).reduce((acc, c) => {
          acc[c.id] = c
          return acc
        }, {} as Record<string, any>)
      }

      // Build structures map with details
      for (const structure of structures || []) {
        const details = (structureDetails || [])
          .filter(d => d.salary_structure_id === structure.id)
          .map(d => ({
            ...d,
            salary_components: componentsMap[d.salary_component_id] || null
          }))
        structuresMap[structure.id] = {
          ...structure,
          salary_structure_details: details
        }
      }
    }

    console.log('Structures map:', Object.keys(structuresMap).length, 'structures loaded')

    // Build assignments with structure data
    const assignmentsWithStructures = (assignments || []).map(a => ({
      ...a,
      salary_structures: a.salary_structure_id ? structuresMap[a.salary_structure_id] : null
    }))

    // Merge assignments with staff
    const staffWithAssignments = activeStaff.map(staff => ({
      ...staff,
      staff_salary_assignments: assignmentsWithStructures.filter(a => a.staff_id === staff.id) || []
    }))

    // Check for existing payroll records for this month
    const { data: existingPayroll } = await supabase
      .from('salary_payroll')
      .select('staff_id')
      .eq('school_id', school_id)
      .eq('month', month)
      .eq('year', year)

    const existingStaffIds = new Set(existingPayroll?.map(p => p.staff_id) || [])

    // Calculate payroll for each staff member
    const payrollRecords: any[] = []
    const payrollComponentDetails: Map<string, any[]> = new Map() // staff_id -> components
    const skippedStaff = []

    for (const staff of staffWithAssignments) {
      // Skip if already has payroll for this month
      if (existingStaffIds.has(staff.id)) {
        skippedStaff.push({
          id: staff.id,
          name: `${staff.first_name} ${staff.last_name}`,
          reason: 'Already has payroll for this month'
        })
        continue
      }

      // Get current salary assignment
      const assignments = staff.staff_salary_assignments as any[]
      const currentAssignment = assignments?.find((a: any) => a.is_current)

      if (!currentAssignment) {
        skippedStaff.push({
          id: staff.id,
          name: `${staff.first_name} ${staff.last_name}`,
          reason: 'No salary assignment'
        })
        continue
      }

      const basicSalary = parseFloat(currentAssignment.basic_salary) || 0
      let totalEarnings = basicSalary
      let totalDeductions = 0

      // Track component details for this staff
      const componentDetails: any[] = []

      // Add Basic Salary as a component
      componentDetails.push({
        salary_component_id: null,
        component_name: 'Basic Salary',
        component_type: 'earning',
        amount: Math.round(basicSalary * 100) / 100,
      })

      // Calculate earnings and deductions from structure components
      const structure = currentAssignment.salary_structures
      console.log('Staff:', staff.first_name, 'Structure:', structure?.name, 'Details count:', structure?.salary_structure_details?.length || 0)
      if (structure?.salary_structure_details) {
        for (const detail of structure.salary_structure_details) {
          const component = detail.salary_components
          if (!component) continue

          // Skip "Basic Salary" component as it's already added above
          if (component.name.toLowerCase() === 'basic salary' || component.name.toLowerCase() === 'basic') {
            continue
          }

          let amount = 0

          // Calculate amount based on component settings
          if (component.is_percentage && detail.percentage) {
            // Percentage of basic salary
            amount = (basicSalary * detail.percentage) / 100
          } else if (detail.amount) {
            amount = parseFloat(detail.amount)
          } else if (component.default_value) {
            amount = parseFloat(component.default_value)
          }

          // Round to 2 decimal places
          amount = Math.round(amount * 100) / 100

          if (amount > 0) {
            componentDetails.push({
              salary_component_id: component.id,
              component_name: component.name,
              component_type: component.component_type,
              amount: amount,
            })
          }

          if (component.component_type === 'earning') {
            totalEarnings += amount
          } else if (component.component_type === 'deduction') {
            totalDeductions += amount
          }
        }
      }

      const grossSalary = totalEarnings
      const netSalary = grossSalary - totalDeductions

      payrollRecords.push({
        school_id,
        staff_id: staff.id,
        month,
        year,
        working_days,
        present_days: working_days, // Default to full attendance
        leave_days: 0,
        gross_salary: Math.round(grossSalary * 100) / 100,
        total_deductions: Math.round(totalDeductions * 100) / 100,
        net_salary: Math.round(netSalary * 100) / 100,
        status: 'pending',
      })

      // Store component details for this staff
      payrollComponentDetails.set(staff.id, componentDetails)
    }

    if (payrollRecords.length === 0) {
      return NextResponse.json({
        message: 'No payroll records to generate',
        skipped: skippedStaff,
        generated: 0,
      })
    }

    // Insert payroll records
    const { data: insertedPayroll, error: insertError } = await supabase
      .from('salary_payroll')
      .insert(payrollRecords)
      .select()

    if (insertError) {
      console.error('Error inserting payroll:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Insert payroll component details
    if (insertedPayroll && insertedPayroll.length > 0) {
      const allComponentDetails: any[] = []

      for (const payroll of insertedPayroll) {
        const components = payrollComponentDetails.get(payroll.staff_id) || []
        for (const comp of components) {
          allComponentDetails.push({
            payroll_id: payroll.id,
            salary_component_id: comp.salary_component_id,
            component_name: comp.component_name,
            component_type: comp.component_type,
            amount: comp.amount,
          })
        }
      }

      console.log('Total component details to insert:', allComponentDetails.length)
      console.log('Component details sample:', allComponentDetails.slice(0, 3))

      if (allComponentDetails.length > 0) {
        const { data: insertedDetails, error: detailsError } = await supabase
          .from('salary_payroll_details')
          .insert(allComponentDetails)
          .select()

        if (detailsError) {
          console.error('Error inserting payroll details:', detailsError)
          // Don't fail the whole operation, just log the error
        } else {
          console.log('Successfully inserted details:', insertedDetails?.length || 0)
        }
      }
    }

    return NextResponse.json({
      message: `Payroll generated for ${payrollRecords.length} staff members`,
      generated: payrollRecords.length,
      skipped: skippedStaff,
      data: insertedPayroll,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error generating payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
