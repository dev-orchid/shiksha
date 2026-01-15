import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_TYPES } from '@/lib/constants/plans'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/super-admin/schools/[id]/plan
 * Update a school's pricing plan
 * Only accessible by super_admin
 */
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (authUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: schoolId } = await params
    const { plan_type, student_limit, admin_user_limit, plan_notes } = await req.json()

    // Validate plan_type
    const validPlanTypes = Object.values(PLAN_TYPES)
    if (plan_type && !validPlanTypes.includes(plan_type)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Update school plan
    const updateData: any = {}
    if (plan_type) updateData.plan_type = plan_type
    if (student_limit !== undefined) updateData.student_limit = student_limit
    if (admin_user_limit !== undefined) updateData.admin_user_limit = admin_user_limit
    if (plan_notes !== undefined) updateData.plan_notes = plan_notes

    const { data, error } = await supabase
      .from('schools')
      .update(updateData)
      .eq('id', schoolId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating school plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/super-admin/schools/[id]/plan
 * Full update of a school's pricing plan
 * Only accessible by super_admin
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (authUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: schoolId } = await params
    const body = await req.json()
    const {
      plan_type,
      student_limit,
      admin_user_limit,
      price_per_student,
      is_active,
      plan_start_date,
      plan_end_date,
    } = body

    // Validate plan_type
    const validPlanTypes = Object.values(PLAN_TYPES)
    if (plan_type && !validPlanTypes.includes(plan_type)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Build update object
    const updateData: any = {}
    if (plan_type !== undefined) updateData.plan_type = plan_type
    if (student_limit !== undefined) updateData.student_limit = student_limit
    if (admin_user_limit !== undefined) updateData.admin_user_limit = admin_user_limit
    if (price_per_student !== undefined) updateData.price_per_student = price_per_student
    if (is_active !== undefined) updateData.is_active = is_active
    if (plan_start_date !== undefined) updateData.plan_start_date = plan_start_date
    if (plan_end_date !== undefined) updateData.plan_end_date = plan_end_date || null

    const { data, error } = await supabase
      .from('schools')
      .update(updateData)
      .eq('id', schoolId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating school plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/super-admin/schools/[id]/plan
 * Get a school's plan details
 * Only accessible by super_admin
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (authUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: schoolId } = await params
    const supabase = createAdminClient()

    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single()

    if (schoolError) {
      return NextResponse.json({ error: schoolError.message }, { status: 404 })
    }

    // Get usage stats - type cast for untyped RPC
    type UsageData = { active_students: number; admin_users: number }
    const { data: usageData } = await (supabase as any)
      .rpc('get_school_current_usage', { p_school_id: schoolId })
      .single() as { data: UsageData | null }

    return NextResponse.json({
      ...school,
      active_students: usageData?.active_students || 0,
      admin_users: usageData?.admin_users || 0,
    })
  } catch (error) {
    console.error('Error fetching school plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
