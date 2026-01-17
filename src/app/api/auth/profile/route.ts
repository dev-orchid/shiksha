import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get the authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to bypass RLS - super_admin users have school_id = NULL
    // which may cause RLS policies to block them from reading their own record
    const adminClient = createAdminClient()

    // Define the user data type
    type UserData = { id: string; email: string; role: string; school_id: string | null }

    // First try to fetch user profile by ID
    let userData: UserData | null = null
    const { data: userById, error: userError } = await adminClient
      .from('users')
      .select('id, email, role, school_id')
      .eq('id', user.id)
      .single()

    if (userError) {
      // If not found by ID, try by email (in case IDs don't match between auth and users table)
      const { data: userByEmail, error: emailError } = await adminClient
        .from('users')
        .select('id, email, role, school_id')
        .eq('email', user.email)
        .single()

      if (emailError) {
        console.error('Error fetching user profile:', emailError)
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
      }

      userData = userByEmail as unknown as UserData
    } else {
      userData = userById as unknown as UserData
    }

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is super_admin
    const isSuperAdmin = userData?.role === 'super_admin'
    const schoolId = isSuperAdmin ? null : (userData?.school_id || user.user_metadata?.school_id || null)

    // Get display name from user metadata
    const displayName = user.user_metadata?.display_name
      || user.user_metadata?.full_name
      || user.user_metadata?.name
      || user.email?.split('@')[0]
      || 'User'

    // Get phone and address from user metadata
    const phone = user.user_metadata?.phone || null
    const address = user.user_metadata?.address || null
    const avatarUrl = user.user_metadata?.avatar_url || null

    // Fetch school info and plan details if we have a school_id
    let schoolName: string | null = null
    let planType: string | undefined
    let studentLimit: number | undefined
    let adminUserLimit: number | undefined
    let currentStudents: number | undefined
    let currentAdminUsers: number | undefined

    if (schoolId) {
      // Fetch school name and plan info
      const { data: schoolData } = await adminClient
        .from('schools')
        .select('name, plan_type, student_limit, admin_user_limit')
        .eq('id', schoolId)
        .single()

      schoolName = (schoolData as any)?.name ?? null
      planType = (schoolData as any)?.plan_type
      studentLimit = (schoolData as any)?.student_limit
      adminUserLimit = (schoolData as any)?.admin_user_limit

      // Fetch current usage stats - use type assertion for custom RPC function
      const rpcClient = adminClient as unknown as { rpc: (fn: string, params: { p_school_id: string }) => { single: () => Promise<{ data: { active_students: number; admin_users: number } | null }> } }
      const { data: usageData } = await rpcClient.rpc('get_school_current_usage', { p_school_id: schoolId }).single()

      currentStudents = (usageData as any)?.active_students || 0
      currentAdminUsers = (usageData as any)?.admin_users || 0
    }

    const profile = {
      id: userData.id,
      email: userData.email,
      displayName,
      phone,
      address,
      avatarUrl,
      role: userData.role,
      schoolId,
      schoolName,
      planType,
      studentLimit,
      adminUserLimit,
      currentStudents,
      currentAdminUsers,
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in profile API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    // Get the authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { display_name, phone, address } = body

    // Update user metadata in Supabase auth
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        display_name: display_name,
        phone: phone,
        address: address,
      },
    })

    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
