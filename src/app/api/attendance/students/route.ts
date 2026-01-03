import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const attendanceSchema = z.object({
  school_id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  class_id: z.string().uuid(),
  section_id: z.string().uuid(),
  date: z.string(),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'leave']),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  remarks: z.string().optional(),
})

const bulkAttendanceSchema = z.object({
  bulk: z.array(z.object({
    student_id: z.string().uuid(),
    class_id: z.string().uuid(),
    section_id: z.string().uuid(),
    date: z.string(),
    status: z.enum(['present', 'absent', 'late', 'half_day', 'leave']),
    check_in_time: z.string().optional(),
    check_out_time: z.string().optional(),
    remarks: z.string().optional(),
  })),
})

// GET - Get student attendance
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const studentId = searchParams.get('student_id')
    const classId = searchParams.get('class_id')
    const sectionId = searchParams.get('section_id')
    const date = searchParams.get('date')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const schoolId = searchParams.get('school_id')

    let query = supabase
      .from('student_attendance')
      .select(`
        *,
        students (id, first_name, last_name, admission_number, roll_number),
        classes (id, name),
        sections (id, name)
      `)

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (classId) {
      query = query.eq('class_id', classId)
    }

    if (sectionId) {
      query = query.eq('section_id', sectionId)
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

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Mark attendance (single or bulk)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // Check if bulk attendance
    if (body.bulk && Array.isArray(body.bulk)) {
      const validatedData = bulkAttendanceSchema.parse(body)

      // Get school_id from first student if not provided
      const { data: studentData } = await supabase
        .from('students')
        .select('school_id')
        .eq('id', validatedData.bulk[0].student_id)
        .single()

      const schoolId = studentData?.school_id

      const records = validatedData.bulk.map(item => ({
        school_id: schoolId,
        class_id: item.class_id,
        section_id: item.section_id,
        date: item.date,
        student_id: item.student_id,
        status: item.status,
        check_in_time: item.check_in_time,
        check_out_time: item.check_out_time,
        remarks: item.remarks,
      }))

      // Upsert to handle re-marking attendance
      const { data, error } = await supabase
        .from('student_attendance')
        .upsert(records, {
          onConflict: 'student_id,date',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        data,
        message: `Attendance marked for ${records.length} students`
      }, { status: 201 })
    }

    // Single attendance
    const validatedData = attendanceSchema.parse(body)

    // Get school_id from student if not provided
    let schoolId = validatedData.school_id
    if (!schoolId) {
      const { data: studentData } = await supabase
        .from('students')
        .select('school_id')
        .eq('id', validatedData.student_id)
        .single()
      schoolId = studentData?.school_id
    }

    const { data, error } = await supabase
      .from('student_attendance')
      .upsert({
        ...validatedData,
        school_id: schoolId,
      }, {
        onConflict: 'student_id,date',
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
    console.error('Error marking attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
