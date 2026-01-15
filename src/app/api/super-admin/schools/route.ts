import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/super-admin/schools
 * List all schools with plan and usage information
 * Only accessible by super_admin
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (authUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Fetch all schools
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
      .order('name')

    if (schoolsError) {
      return NextResponse.json({ error: schoolsError.message }, { status: 500 })
    }

    // Fetch usage stats for each school
    const schoolsWithUsage = await Promise.all(
      (schools || []).map(async (school) => {
        const { data: usageData } = await supabase
          .rpc('get_school_current_usage', { p_school_id: school.id })
          .single()

        return {
          ...school,
          active_students: usageData?.active_students || 0,
          admin_users: usageData?.admin_users || 0,
        }
      })
    )

    return NextResponse.json({ schools: schoolsWithUsage })
  } catch (error) {
    console.error('Error fetching schools:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
