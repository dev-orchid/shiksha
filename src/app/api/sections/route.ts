import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - List sections for the authenticated user's school
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')

    let query = supabase
      .from('sections')
      .select(`
        *,
        classes (id, name, grade_level)
      `)
      .eq('school_id', authUser.schoolId) // Always filter by authenticated user's school

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data, error } = await query.order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create section for the authenticated user's school
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    // Validate required fields
    if (!body.class_id || !body.name) {
      return NextResponse.json(
        { error: 'class_id and name are required' },
        { status: 400 }
      )
    }

    // Verify the class belongs to the user's school
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('school_id')
      .eq('id', body.class_id)
      .eq('school_id', authUser.schoolId)
      .single()

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Invalid class or class does not belong to your school' },
        { status: 400 }
      )
    }

    const sectionData = {
      school_id: authUser.schoolId, // Always use authenticated user's school
      class_id: body.class_id,
      name: body.name,
      capacity: body.capacity || 40,
      is_active: body.is_active ?? true,
    }

    const { data, error } = await supabase
      .from('sections')
      .insert(sectionData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This section already exists for the class' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
