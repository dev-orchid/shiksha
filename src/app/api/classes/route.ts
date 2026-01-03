import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List classes
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const schoolId = searchParams.get('school_id')
    const isActive = searchParams.get('is_active')

    let query = supabase
      .from('classes')
      .select(`
        *,
        sections (id, name, capacity, is_active)
      `)

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query.order('grade_level')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create class
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // Validate required fields
    if (!body.name || body.grade_level === undefined) {
      return NextResponse.json(
        { error: 'name and grade_level are required' },
        { status: 400 }
      )
    }

    // Get school_id if not provided
    let schoolId = body.school_id
    if (!schoolId) {
      const { data: schools } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .single()
      schoolId = schools?.id
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: 'Could not determine school_id' },
        { status: 400 }
      )
    }

    const classData = {
      school_id: schoolId,
      name: body.name,
      grade_level: body.grade_level,
      description: body.description || null,
      is_active: body.is_active ?? true,
    }

    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A class with this name already exists' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
