import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// Generate a random password
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/parents/[id]/portal-access
 * Enable portal access for an existing parent
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthenticatedUserSchool()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: parentId } = await params
    const supabase = createAdminClient()

    // Get parent details
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id, first_name, last_name, email, user_id, school_id')
      .eq('id', parentId)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Verify parent belongs to user's school (unless super admin)
    if (authUser.role !== 'super_admin' && parent.school_id !== authUser.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if parent already has portal access
    if (parent.user_id) {
      return NextResponse.json({
        success: true,
        message: 'Parent already has portal access.',
        alreadyExists: true,
      })
    }

    // Email is required
    if (!parent.email) {
      return NextResponse.json(
        { error: 'Parent must have an email address to enable portal access' },
        { status: 400 }
      )
    }

    // Check if user with this email already exists in auth
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingAuthUser = authUsers?.users?.find(
      u => u.email?.toLowerCase() === parent.email!.toLowerCase()
    )

    if (existingAuthUser) {
      // Link existing user to parent
      await supabase
        .from('parents')
        .update({ user_id: existingAuthUser.id })
        .eq('id', parentId)

      // Make sure user exists in users table with parent role
      const { data: existingUserRecord } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', existingAuthUser.id)
        .single()

      if (!existingUserRecord) {
        await supabase.from('users').insert({
          id: existingAuthUser.id,
          email: parent.email,
          role: 'parent',
          school_id: parent.school_id,
          is_active: true,
          email_verified: true,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'A user with this email already exists. The parent has been linked to the existing account.',
        alreadyExists: true,
      })
    }

    // Generate password and create new user
    const password = generatePassword()
    const displayName = `${parent.first_name} ${parent.last_name || ''}`.trim()

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: parent.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        school_id: parent.school_id,
        role: 'parent',
      },
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user for parent:', authError)
      return NextResponse.json(
        { error: `Failed to create portal account: ${authError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Create user record in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: parent.email,
        role: 'parent',
        school_id: parent.school_id,
        is_active: true,
        email_verified: true,
      })

    if (userError) {
      console.error('Error creating user record for parent:', userError)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Failed to create user record: ${userError.message}` },
        { status: 500 }
      )
    }

    // Link user to parent record
    await supabase
      .from('parents')
      .update({ user_id: authData.user.id })
      .eq('id', parentId)

    return NextResponse.json({
      success: true,
      credentials: { email: parent.email, password },
      message: 'Portal access created successfully',
    })
  } catch (error) {
    console.error('Error enabling portal access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/parents/[id]/portal-access
 * Disable portal access for a parent (removes user link, doesn't delete auth user)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthenticatedUserSchool()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: parentId } = await params
    const supabase = createAdminClient()

    // Get parent details
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id, user_id, school_id')
      .eq('id', parentId)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Verify parent belongs to user's school
    if (authUser.role !== 'super_admin' && parent.school_id !== authUser.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!parent.user_id) {
      return NextResponse.json({ error: 'Parent does not have portal access' }, { status: 400 })
    }

    // Unlink user from parent (but don't delete the auth user)
    await supabase
      .from('parents')
      .update({ user_id: null })
      .eq('id', parentId)

    return NextResponse.json({
      success: true,
      message: 'Portal access disabled for parent',
    })
  } catch (error) {
    console.error('Error disabling portal access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
