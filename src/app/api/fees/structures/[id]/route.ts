import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - Get single fee structure
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
      .from('fee_structures')
      .select(`
        *,
        classes (id, name),
        fee_categories (id, name)
      `)
      .eq('id', id)
      .eq('school_id', authUser.schoolId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching fee structure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update fee structure
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

    const updateData: Record<string, unknown> = {}
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.frequency !== undefined) updateData.frequency = body.frequency
    if (body.due_day !== undefined) updateData.due_day = body.due_day
    if (body.late_fee_per_day !== undefined) updateData.late_fee_per_day = body.late_fee_per_day
    if (body.max_late_fee !== undefined) updateData.max_late_fee = body.max_late_fee
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabase
      .from('fee_structures')
      .update(updateData)
      .eq('id', id)
      .eq('school_id', authUser.schoolId)
      .select(`
        *,
        classes (id, name),
        fee_categories (id, name)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating fee structure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete fee structure
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

    const { error } = await supabase
      .from('fee_structures')
      .delete()
      .eq('id', id)
      .eq('school_id', authUser.schoolId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Fee structure deleted successfully' })
  } catch (error) {
    console.error('Error deleting fee structure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
