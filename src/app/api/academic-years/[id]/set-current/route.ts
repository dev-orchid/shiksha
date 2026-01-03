import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST - Set academic year as current
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Get the school_id for this academic year
    const { data: year } = await supabase
      .from('academic_years')
      .select('school_id')
      .eq('id', id)
      .single()

    if (!year) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 })
    }

    // Unset all other current academic years for this school
    await supabase
      .from('academic_years')
      .update({ is_current: false })
      .eq('school_id', year.school_id)

    // Set this one as current
    const { data, error } = await supabase
      .from('academic_years')
      .update({ is_current: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error setting current academic year:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
