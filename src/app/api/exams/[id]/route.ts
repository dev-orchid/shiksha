import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - Get single exam
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
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
          room_number,
          subjects (id, name, code),
          classes (id, name)
        )
      `)
      .eq('id', id)
      .eq('school_id', authUser.schoolId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update exam
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()
    const body = await request.json()

    const { schedules, ...examData } = body

    // Update exam - ensure it belongs to user's school
    const { data, error } = await supabase
      .from('exams')
      .update(examData)
      .eq('id', id)
      .eq('school_id', authUser.schoolId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update schedules if provided
    if (schedules && Array.isArray(schedules)) {
      // Delete existing schedules
      await supabase.from('exam_schedules').delete().eq('exam_id', id)

      // Insert new schedules
      if (schedules.length > 0) {
        const scheduleRecords = schedules.map((schedule: any) => ({
          exam_id: id,
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
          return NextResponse.json({ error: scheduleError.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating exam:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    // Delete exam schedules first (cascade)
    await supabase.from('exam_schedules').delete().eq('exam_id', id)

    // Delete exam - ensure it belongs to user's school
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id)
      .eq('school_id', authUser.schoolId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Exam deleted successfully' })
  } catch (error) {
    console.error('Error deleting exam:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
