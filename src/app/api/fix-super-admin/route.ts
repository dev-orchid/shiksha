import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/fix-super-admin
 * Fix super admin users by setting their school_id to NULL
 * This is a one-time fix endpoint
 */
export async function POST() {
  try {
    const supabase = createAdminClient()

    // Update all super_admin users to have NULL school_id
    const { data, error } = await supabase
      .from('users')
      .update({ school_id: null })
      .eq('role', 'super_admin')
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Super admin users updated successfully',
      updatedUsers: data,
    })
  } catch (error) {
    console.error('Error fixing super admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
