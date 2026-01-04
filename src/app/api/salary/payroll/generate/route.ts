import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { z } from 'zod'

const generateSchema = z.object({
  school_id: z.string().uuid(),
  academic_year_id: z.string().uuid().optional(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  working_days: z.number().int().min(1).max(31).default(26),
  staff_ids: z.array(z.string().uuid()).optional(), // Optional: generate for specific staff only
})

// POST - Generate payroll for all staff with salary assignments
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const body = await request.json()

    const validatedData = generateSchema.parse(body)
    const { school_id, month, year, working_days, staff_ids, academic_year_id } = validatedData

    // First, get all active staff for the school
    let staffQuery = supabase
      .from('staff')
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        designation,
        department_id,
        status
      `)
      .eq('school_id', school_id)
      .in('status', ['active', 'Active'])

    if (staff_ids && staff_ids.length > 0) {
      staffQuery = staffQuery.in('id', staff_ids)
    }

    const { data: staffList, error: staffError } = await staffQuery

    if (staffError) {
      console.error('Error fetching staff:', staffError)
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    if (!staffList || staffList.length === 0) {
      // Debug: Check if any staff exist for this school
      const { data: allStaff } = await supabase
        .from('staff')
        .select('id, school_id, status')
        .limit(10)
      console.log('Debug - School ID:', school_id)
      console.log('Debug - All staff in DB:', allStaff)
      return NextResponse.json({
        error: 'No active staff found',
        debug: { school_id, staffCount: allStaff?.length || 0 }
      }, { status: 400 })
    }

    // Now get salary assignments for these staff
    const staffIds = staffList.map(s => s.id)
    const { data: assignments } = await supabase
      .from('staff_salary_assignments')
      .select(`
        id,
        staff_id,
        basic_salary,
        salary_structure_id,
        is_current,
        salary_structures (
          id,
          name,
          salary_structure_details (
            id,
            amount,
            percentage,
            salary_components (
              id,
              name,
              component_type,
              is_percentage,
              percentage_of,
              default_value
            )
          )
        )
      `)
      .in('staff_id', staffIds)
      .eq('is_current', true)

    // Merge assignments with staff
    const staffWithAssignments = staffList.map(staff => ({
      ...staff,
      staff_salary_assignments: assignments?.filter(a => a.staff_id === staff.id) || []
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
    const payrollRecords = []
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

      // Calculate earnings and deductions from structure components
      const structure = currentAssignment.salary_structures
      if (structure?.salary_structure_details) {
        for (const detail of structure.salary_structure_details) {
          const component = detail.salary_components
          if (!component) continue

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
        academic_year_id,
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
