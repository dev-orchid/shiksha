import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// DELETE - Remove a teacher assignment
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

    // First, verify the assignment belongs to a staff member in the user's school
    const { data: assignment, error: fetchError } = await supabase
      .from('teacher_assignments')
      .select(`
        id,
        staff:staff!staff_id (id, school_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check school ownership
    const staff = assignment.staff as { id: string; school_id: string } | null
    if (!staff || staff.school_id !== authUser.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the assignment
    const { error } = await supabase
      .from('teacher_assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting teacher assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting teacher assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
