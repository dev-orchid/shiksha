import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - List all teacher assignments for the authenticated user's school
export async function GET() {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('teacher_assignments')
      .select(`
        id,
        staff_id,
        class_id,
        section_id,
        subject_id,
        is_class_teacher,
        academic_year_id,
        created_at,
        staff:staff!staff_id (id, employee_id, first_name, last_name, designation),
        class:classes!class_id (id, name),
        section:sections!section_id (id, name),
        subject:subjects!subject_id (id, name)
      `)
      .eq('staff.school_id', authUser.schoolId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching teacher assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to match frontend expectations (teacher_id instead of staff_id)
    const transformedData = (data || [])
      .filter(item => item.staff !== null)
      .map(item => ({
        id: item.id,
        teacher_id: item.staff_id,
        class_id: item.class_id,
        section_id: item.section_id,
        subject_id: item.subject_id,
        is_class_teacher: item.is_class_teacher,
        teacher: item.staff,
        class: item.class,
        section: item.section,
        subject: item.subject,
      }))

    return NextResponse.json({ data: transformedData })
  } catch (error) {
    console.error('Error fetching teacher assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new teacher assignment
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    // Validate required fields (frontend sends teacher_id, we map to staff_id)
    const { teacher_id, class_id, section_id, subject_id } = body

    if (!teacher_id || !class_id || !section_id || !subject_id) {
      return NextResponse.json(
        { error: 'Missing required fields: teacher_id, class_id, section_id, and subject_id are required' },
        { status: 400 }
      )
    }

    // Verify the teacher belongs to the authenticated user's school
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, school_id')
      .eq('id', teacher_id)
      .single()

    if (staffError || !staffData) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    if (staffData.school_id !== authUser.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check for duplicate assignment
    const { data: existingAssignment } = await supabase
      .from('teacher_assignments')
      .select('id')
      .eq('staff_id', teacher_id)
      .eq('class_id', class_id)
      .eq('section_id', section_id)
      .eq('subject_id', subject_id)
      .maybeSingle()

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'This assignment already exists' },
        { status: 400 }
      )
    }

    // Create the assignment (map teacher_id to staff_id)
    const { data, error } = await supabase
      .from('teacher_assignments')
      .insert({
        staff_id: teacher_id,
        class_id,
        section_id,
        subject_id,
      })
      .select(`
        id,
        staff_id,
        class_id,
        section_id,
        subject_id,
        is_class_teacher,
        created_at
      `)
      .single()

    if (error) {
      console.error('Error creating teacher assignment:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This assignment already exists' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return data with teacher_id for frontend compatibility
    return NextResponse.json({
      data: {
        id: data.id,
        teacher_id: data.staff_id,
        class_id: data.class_id,
        section_id: data.section_id,
        subject_id: data.subject_id,
        is_class_teacher: data.is_class_teacher,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating teacher assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
