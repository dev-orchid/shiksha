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

    // Build query for payroll with staff details
    let query = supabase
      .from('salary_payroll')
      .select(`
        id,
        month,
        year,
        gross_salary,
        total_deductions,
        net_salary,
        working_days,
        present_days,
        leave_days,
        status,
        staff!inner (
          id,
          employee_id,
          first_name,
          last_name,
          designation,
          department_id,
          departments (id, name)
        ),
        staff_salary_assignments!left (
          basic_salary
        )
      `, { count: 'exact' })
      .eq('school_id', schoolId)
      .eq('month', month)
      .eq('year', year)

    if (departmentId) {
      query = query.eq('staff.department_id', departmentId)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching staff salaries:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response
    const staffSalaries = data?.map(record => {
      const staff = record.staff as any
      const assignment = record.staff_salary_assignments as any
      return {
        id: record.id,
        staffId: staff?.id,
        employeeId: staff?.employee_id,
        name: `${staff?.first_name || ''} ${staff?.last_name || ''}`.trim(),
        designation: staff?.designation,
        department: staff?.departments?.name,
        departmentId: staff?.department_id,
        basicSalary: assignment?.[0]?.basic_salary || 0,
        grossSalary: record.gross_salary,
        deductions: record.total_deductions,
        netSalary: record.net_salary,
        workingDays: record.working_days,
        presentDays: record.present_days,
        leaveDays: record.leave_days,
        status: record.status,
      }
    }) || []

    // Filter by search if provided
    let filteredSalaries = staffSalaries
    if (search) {
      const searchLower = search.toLowerCase()
      filteredSalaries = staffSalaries.filter(s =>
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
