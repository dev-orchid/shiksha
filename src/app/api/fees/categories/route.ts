import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List fee categories
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('is_active')

    let query = supabase
      .from('fee_categories')
      .select('*')
      .order('name')

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching fee categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create fee category
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
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

    const categoryData = {
      school_id: schoolId,
      name: body.name,
      description: body.description || null,
      is_recurring: body.is_recurring ?? true,
      is_active: body.is_active ?? true,
    }

    const { data, error } = await supabase
      .from('fee_categories')
      .insert(categoryData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error creating fee category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
