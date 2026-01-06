import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { z } from 'zod'

const payrollSchema = z.object({
  academic_year_id: z.string().uuid(),
  staff_id: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  basic_salary: z.number().min(0),
  allowances: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  gross_salary: z.number().min(0),
  net_salary: z.number().min(0),
  working_days: z.number().int().min(0),
  present_days: z.number().int().min(0),
  leave_days: z.number().int().min(0).default(0),
  remarks: z.string().optional(),
})

const bulkPayrollSchema = z.object({
  academic_year_id: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  working_days: z.number().int().min(0),
  payroll: z.array(z.object({
    staff_id: z.string().uuid(),
    basic_salary: z.number().min(0),
    allowances: z.number().min(0).default(0),
    deductions: z.number().min(0).default(0),
    gross_salary: z.number().min(0),
    net_salary: z.number().min(0),
    present_days: z.number().int().min(0),
    leave_days: z.number().int().min(0).default(0),
    remarks: z.string().optional(),
  })),
})

// GET - Get payroll records
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const staffId = searchParams.get('staff_id')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')

    console.log('Payroll GET - Params:', { schoolId: authUser.schoolId, month, year, staffId, status })

    const offset = (page - 1) * limit

    // Query payroll for user's school
    let query = supabase
      .from('salary_payroll')
      .select('*', { count: 'exact' })
      .eq('school_id', authUser.schoolId)

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    if (month) {
      query = query.eq('month', parseInt(month))
    }

    if (year) {
      query = query.eq('year', parseInt(year))
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: payrollData, error: payrollError, count } = await query
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .range(offset, offset + limit - 1)

    console.log('Payroll GET - Result:', { count, dataLength: payrollData?.length, error: payrollError })

    if (payrollError) {
      console.error('Payroll GET - Error:', payrollError)
      return NextResponse.json({ error: payrollError.message }, { status: 500 })
    }

    // Now get staff details separately
    const staffIds = [...new Set(payrollData?.map(p => p.staff_id) || [])]
    let staffMap: Record<string, any> = {}

    if (staffIds.length > 0) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, first_name, last_name, employee_id, designation, department_id')
        .in('id', staffIds)

      staffMap = (staffData || []).reduce((acc, s) => {
        acc[s.id] = s
        return acc
      }, {} as Record<string, any>)
    }

    // Combine payroll with staff data
    const data = payrollData?.map(p => ({
      ...p,
      staff: staffMap[p.staff_id] || null
    }))

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create payroll (single or bulk)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    // Check if bulk payroll
    if (body.payroll && Array.isArray(body.payroll)) {
      const validatedData = bulkPayrollSchema.parse(body)

      const records = validatedData.payroll.map(item => ({
        school_id: authUser.schoolId,
        academic_year_id: validatedData.academic_year_id,
        month: validatedData.month,
        year: validatedData.year,
        working_days: validatedData.working_days,
        staff_id: item.staff_id,
        basic_salary: item.basic_salary,
        allowances: item.allowances,
        deductions: item.deductions,
        gross_salary: item.gross_salary,
        net_salary: item.net_salary,
        present_days: item.present_days,
        leave_days: item.leave_days,
        remarks: item.remarks,
        status: 'pending',
      }))

      const { data, error } = await supabase
        .from('salary_payroll')
        .upsert(records, {
          onConflict: 'staff_id,month,year',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        data,
        message: `Payroll processed for ${records.length} staff members`
      }, { status: 201 })
    }

    // Single payroll
    const validatedData = payrollSchema.parse(body)

    const { data, error } = await supabase
      .from('salary_payroll')
      .upsert({
        ...validatedData,
        school_id: authUser.schoolId,
        status: 'pending',
      }, {
        onConflict: 'staff_id,month,year',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
