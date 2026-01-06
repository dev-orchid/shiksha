import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { z } from 'zod'

const examSchema = z.object({
  academic_year_id: z.string().uuid().optional(),
  exam_type_id: z.string().uuid(),
  name: z.string().min(1),
  start_date: z.string(),
  end_date: z.string(),
  description: z.string().optional(),
  schedules: z.array(z.object({
    class_id: z.string().uuid(),
    subject_id: z.string().uuid(),
    exam_date: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    max_marks: z.number(),
    passing_marks: z.number(),
  })).optional(),
})

// GET - List exams
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const academicYearId = searchParams.get('academic_year_id')
    const examTypeId = searchParams.get('exam_type_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabase
      .from('exams')
      .select(`
        *,
        exam_types (id, name),
        academic_years (id, name, start_date, end_date),
        exam_schedules (
          id,
          subject_id,
          class_id,
          exam_date,
          start_time,
          end_time,
          max_marks,
          passing_marks,
          subjects (id, name),
          classes (id, name)
        )
      `)
      .eq('school_id', authUser.schoolId)

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    if (examTypeId) {
      query = query.eq('exam_type_id', examTypeId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query.order('start_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate stats
    const total = data?.length || 0
    const completed = data?.filter(e => e.status === 'completed').length || 0
    const upcoming = data?.filter(e => e.status === 'scheduled' || e.status === 'upcoming').length || 0
    const ongoing = data?.filter(e => e.status === 'ongoing').length || 0

    return NextResponse.json({
      data,
      stats: {
        total,
        completed,
        upcoming,
        ongoing,
        resultsPublished: 0, // TODO: Calculate from exam_results
      }
    })
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create exam with schedules
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = examSchema.parse(body)

    const { schedules, ...examData } = validatedData

    // Use authenticated user's school_id
    const schoolId = authUser.schoolId

    // Get academic_year_id if not provided
    let academicYearId = examData.academic_year_id
    if (!academicYearId) {
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', authUser.schoolId)
        .eq('is_current', true)
        .limit(1)
        .single()
      academicYearId = academicYear?.id
    }

    // Determine status based on dates
    const today = new Date().toISOString().split('T')[0]
    let status = 'scheduled'
    if (examData.start_date <= today && examData.end_date >= today) {
      status = 'ongoing'
    } else if (examData.end_date < today) {
      status = 'completed'
    }

    // Create exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert({
        school_id: schoolId,
        academic_year_id: academicYearId,
        exam_type_id: examData.exam_type_id,
        name: examData.name,
        start_date: examData.start_date,
        end_date: examData.end_date,
        description: examData.description,
        status,
      })
      .select()
      .single()

    if (examError) {
      return NextResponse.json({ error: examError.message }, { status: 500 })
    }

    // Create exam schedules if provided
    if (schedules && schedules.length > 0) {
      const scheduleRecords = schedules.map(schedule => ({
        exam_id: exam.id,
        class_id: schedule.class_id,
        subject_id: schedule.subject_id,
        exam_date: schedule.exam_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        max_marks: schedule.max_marks,
        passing_marks: schedule.passing_marks,
      }))

      const { error: scheduleError } = await supabase
        .from('exam_schedules')
        .insert(scheduleRecords)

      if (scheduleError) {
        // Rollback exam creation
        await supabase.from('exams').delete().eq('id', exam.id)
        return NextResponse.json({ error: scheduleError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ data: exam }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating exam:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
