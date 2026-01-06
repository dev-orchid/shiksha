import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - List academic years for the authenticated user's school
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const currentOnly = searchParams.get('current') === 'true'

    let query = supabase
      .from('academic_years')
      .select('*')
      .eq('school_id', authUser.schoolId) // Always filter by authenticated user's school
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

// POST - Create academic year for the authenticated user's school
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    const academicYearData = {
      school_id: authUser.schoolId, // Always use authenticated user's school
      name: body.name,
      start_date: body.start_date,
      end_date: body.end_date,
      is_current: body.is_current || false,
    }

    // If this is set as current, unset others for this school only
    if (academicYearData.is_current) {
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('school_id', authUser.schoolId)
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
