import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - Get single academic year
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Academic year not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching academic year:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update academic year
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const body = await request.json()

    // If setting as current, unset others first
    if (body.is_current) {
      const { data: currentYear } = await supabase
        .from('academic_years')
        .select('school_id')
        .eq('id', id)
        .single()

      if (currentYear) {
        await supabase
          .from('academic_years')
          .update({ is_current: false })
          .eq('school_id', currentYear.school_id)
      }
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.start_date !== undefined) updateData.start_date = body.start_date
    if (body.end_date !== undefined) updateData.end_date = body.end_date
    if (body.is_current !== undefined) updateData.is_current = body.is_current

    const { data, error } = await supabase
      .from('academic_years')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Academic year not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating academic year:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete academic year
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Check if it's the current academic year
    const { data: year } = await supabase
      .from('academic_years')
      .select('is_current')
      .eq('id', id)
      .single()

    if (year?.is_current) {
      return NextResponse.json(
        { error: 'Cannot delete the current academic year' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('academic_years')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Academic year deleted successfully' })
  } catch (error) {
    console.error('Error deleting academic year:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
