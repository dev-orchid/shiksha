import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'

// GET - Get staff salaries for a specific month
export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { searchParams } = new URL(request.url)

    const schoolId = searchParams.get('school_id')
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const departmentId = searchParams.get('department_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    if (!schoolId) {
      return NextResponse.json({ error: 'school_id is required' }, { status: 400 })
    }

    // First, get payroll records
    const { data: payrollData, error: payrollError, count } = await supabase
      .from('salary_payroll')
      .select('*', { count: 'exact' })
      .eq('school_id', schoolId)
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (payrollError) {
      console.error('Error fetching payroll:', payrollError)
      return NextResponse.json({ error: payrollError.message }, { status: 500 })
    }

    if (!payrollData || payrollData.length === 0) {
      return NextResponse.json({
        data: [],
        summary: { totalStaff: 0, totalMonthlySalary: 0, averageSalary: 0 },
        pagination: { page, limit, total: 0, totalPages: 0 },
      })
    }

    // Get staff IDs and fetch staff details
    const staffIds = [...new Set(payrollData.map(p => p.staff_id))]

    const { data: staffData } = await supabase
      .from('staff')
      .select('id, employee_id, first_name, last_name, designation, department_id')
      .in('id', staffIds)

    // Get current salary assignments for basic salary
    const { data: assignmentsData } = await supabase
      .from('staff_salary_assignments')
      .select('staff_id, basic_salary')
      .in('staff_id', staffIds)
      .eq('is_current', true)

    // Create lookup maps
    const staffMap = (staffData || []).reduce((acc, s) => {
      acc[s.id] = s
      return acc
    }, {} as Record<string, any>)

    const assignmentMap = (assignmentsData || []).reduce((acc, a) => {
      acc[a.staff_id] = a
      return acc
    }, {} as Record<string, any>)

    // Format the response
    const staffSalaries = payrollData.map(record => {
      const staff = staffMap[record.staff_id]
      const assignment = assignmentMap[record.staff_id]
      return {
        id: record.id,
        staffId: staff?.id,
        employeeId: staff?.employee_id,
        name: `${staff?.first_name || ''} ${staff?.last_name || ''}`.trim(),
        designation: staff?.designation,
        departmentId: staff?.department_id,
        basicSalary: assignment?.basic_salary || record.gross_salary,
        grossSalary: record.gross_salary,
        deductions: record.total_deductions,
        netSalary: record.net_salary,
        workingDays: record.working_days,
        presentDays: record.present_days,
        leaveDays: record.leave_days,
        status: record.status,
      }
    })

    // Filter by department if provided
    let filteredSalaries = staffSalaries
    if (departmentId) {
      filteredSalaries = filteredSalaries.filter(s => s.departmentId === departmentId)
    }

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase()
      filteredSalaries = filteredSalaries.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.employeeId?.toLowerCase().includes(searchLower) ||
        s.designation?.toLowerCase().includes(searchLower)
      )
    }

    // Calculate summary stats
    const totalMonthly = filteredSalaries.reduce((sum, s) => sum + (parseFloat(String(s.netSalary)) || 0), 0)
    const averageSalary = filteredSalaries.length > 0 ? totalMonthly / filteredSalaries.length : 0

    return NextResponse.json({
      data: filteredSalaries,
      summary: {
        totalStaff: filteredSalaries.length,
        totalMonthlySalary: totalMonthly,
        averageSalary: Math.round(averageSalary),
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching staff salaries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create/update staff salary assignment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const body = await request.json()

    const { staff_id, salary_structure_id, basic_salary, effective_from } = body

    if (!staff_id || !basic_salary) {
      return NextResponse.json({ error: 'staff_id and basic_salary are required' }, { status: 400 })
    }

    // Deactivate current assignment if exists
    await supabase
      .from('staff_salary_assignments')
      .update({ is_current: false, effective_to: effective_from || new Date().toISOString().split('T')[0] })
      .eq('staff_id', staff_id)
      .eq('is_current', true)

    // Create new assignment
    const { data, error } = await supabase
      .from('staff_salary_assignments')
      .insert({
        staff_id,
        salary_structure_id,
        basic_salary,
        effective_from: effective_from || new Date().toISOString().split('T')[0],
        is_current: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error creating salary assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
