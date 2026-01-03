import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Validation is done manually to allow school_id to be optional

// GET - List sections
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const schoolId = searchParams.get('school_id')
    const classId = searchParams.get('class_id')

    let query = supabase
      .from('sections')
      .select(`
        *,
        classes (id, name, grade_level)
      `)

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

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

// POST - Create section
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // Validate required fields
    if (!body.class_id || !body.name) {
      return NextResponse.json(
        { error: 'class_id and name are required' },
        { status: 400 }
      )
    }

    // Get school_id from the class if not provided
    let schoolId = body.school_id
    if (!schoolId) {
      const { data: classData } = await supabase
        .from('classes')
        .select('school_id')
        .eq('id', body.class_id)
        .single()
      schoolId = classData?.school_id
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: 'Could not determine school_id' },
        { status: 400 }
      )
    }

    const sectionData = {
      school_id: schoolId,
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
