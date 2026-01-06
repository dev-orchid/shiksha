import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { z } from 'zod'

const examResultSchema = z.object({
  exam_schedule_id: z.string().uuid(),
  student_id: z.string().uuid(),
  marks_obtained: z.number().min(0),
  grade: z.string().optional(),
  remarks: z.string().optional(),
  is_absent: z.boolean().optional(),
})

const bulkExamResultsSchema = z.object({
  results: z.array(examResultSchema),
})

// GET - Get exam results
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const examId = searchParams.get('exam_id')
    const examScheduleId = searchParams.get('exam_schedule_id')
    const studentId = searchParams.get('student_id')
    const classId = searchParams.get('class_id')

    // Get exam schedules for exams in this school first
    const { data: schoolExams } = await supabase
      .from('exams')
      .select('id')
      .eq('school_id', authUser.schoolId)

    const schoolExamIds = schoolExams?.map(e => e.id) || []

    // Get exam schedules for these exams
    const { data: schedules } = await supabase
      .from('exam_schedules')
      .select('id')
      .in('exam_id', schoolExamIds)

    const scheduleIds = schedules?.map(s => s.id) || []

    let query = supabase
      .from('exam_results')
      .select(`
        *,
        exam_schedules (
          id,
          exam_id,
          class_id,
          subject_id,
          max_marks,
          passing_marks,
          exams (id, name),
          subjects (id, name),
          classes (id, name)
        ),
        students (id, first_name, last_name, admission_number, roll_number)
      `)
      .in('exam_schedule_id', scheduleIds)

    if (examScheduleId) {
      query = query.eq('exam_schedule_id', examScheduleId)
    }

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    // Filter by exam_id through exam_schedules
    if (examId) {
      const { data: schedules } = await supabase
        .from('exam_schedules')
        .select('id')
        .eq('exam_id', examId)

      if (schedules && schedules.length > 0) {
        const scheduleIds = schedules.map(s => s.id)
        query = query.in('exam_schedule_id', scheduleIds)
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter by class if specified (through students)
    let filteredData = data
    if (classId && data) {
      // Get students in this class
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('current_class_id', classId)

      if (students) {
        const studentIds = students.map(s => s.id)
        filteredData = data.filter(r => studentIds.includes(r.student_id))
      }
    }

    return NextResponse.json({ data: filteredData })
  } catch (error) {
    console.error('Error fetching exam results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save exam results (bulk)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = bulkExamResultsSchema.parse(body)

    // Upsert results (update if exists, insert if not)
    const records = validatedData.results.map(result => ({
      exam_schedule_id: result.exam_schedule_id,
      student_id: result.student_id,
      marks_obtained: result.marks_obtained,
      grade: result.grade,
      remarks: result.remarks,
      is_absent: result.is_absent || false,
    }))

    const { data, error } = await supabase
      .from('exam_results')
      .upsert(records, {
        onConflict: 'exam_schedule_id,student_id',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      message: `Results saved for ${records.length} students`
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error saving exam results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
