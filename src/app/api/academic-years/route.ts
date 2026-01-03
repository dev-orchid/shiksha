import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List academic years
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const currentOnly = searchParams.get('current') === 'true'

    let query = supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false })

    if (currentOnly) {
      query = query.eq('is_current', true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching academic years:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create academic year
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

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

    const academicYearData = {
      school_id: schoolId,
      name: body.name,
      start_date: body.start_date,
      end_date: body.end_date,
      is_current: body.is_current || false,
    }

    // If this is set as current, unset others
    if (academicYearData.is_current) {
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('school_id', schoolId)
    }

    const { data, error } = await supabase
      .from('academic_years')
      .insert(academicYearData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error creating academic year:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
