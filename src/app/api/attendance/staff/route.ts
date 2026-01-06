import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { z } from 'zod'

const staffAttendanceSchema = z.object({
  staff_id: z.string().uuid(),
  date: z.string(),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday']),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  remarks: z.string().optional(),
})

const bulkStaffAttendanceSchema = z.object({
  bulk: z.array(z.object({
    staff_id: z.string().uuid(),
    date: z.string(),
    status: z.enum(['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday']),
    check_in_time: z.string().optional(),
    check_out_time: z.string().optional(),
    remarks: z.string().optional(),
  })),
})

// GET - Get staff attendance
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const staffId = searchParams.get('staff_id')
    const departmentId = searchParams.get('department_id')
    const date = searchParams.get('date')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabase
      .from('staff_attendance')
      .select(`
        *,
        staff (id, first_name, last_name, employee_id, designation, department_id, departments(id, name))
      `)
      .eq('school_id', authUser.schoolId)

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    if (date) {
      query = query.eq('date', date)
    }

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter by department if specified (since it's in the nested staff table)
    let filteredData = data
    if (departmentId && data) {
      filteredData = data.filter((item: any) => item.staff?.department_id === departmentId)
    }

    return NextResponse.json({ data: filteredData })
  } catch (error) {
    console.error('Error fetching staff attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Mark staff attendance (single or bulk)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    // Check if bulk attendance
    if (body.bulk && Array.isArray(body.bulk)) {
      const validatedData = bulkStaffAttendanceSchema.parse(body)

      // Use authenticated user's school_id
      const schoolId = authUser.schoolId

      const records = validatedData.bulk.map(item => ({
        school_id: schoolId,
        date: item.date,
        staff_id: item.staff_id,
        status: item.status,
        check_in_time: item.check_in_time,
        check_out_time: item.check_out_time,
        remarks: item.remarks,
      }))

      const { data, error } = await supabase
        .from('staff_attendance')
        .upsert(records, {
          onConflict: 'staff_id,date',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        data,
        message: `Attendance marked for ${records.length} staff members`
      }, { status: 201 })
    }

    // Single attendance
    const validatedData = staffAttendanceSchema.parse(body)

    // Use authenticated user's school_id
    const schoolId = authUser.schoolId

    const { data, error } = await supabase
      .from('staff_attendance')
      .upsert({
        ...validatedData,
        school_id: schoolId,
      }, {
        onConflict: 'staff_id,date',
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
    console.error('Error marking staff attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
