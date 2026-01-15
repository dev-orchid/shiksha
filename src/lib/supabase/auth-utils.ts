import { createClient } from './server'
import { createAdminClient } from './admin'

export interface AuthenticatedUser {
  userId: string
  schoolId: string | null  // Can be null for super_admin
  email: string
  role?: string
}

/**
 * Get the authenticated user's school_id from the session.
 * This should be used in API routes to enforce multi-tenant isolation.
 *
 * Returns the user info with their school_id, or null if not authenticated.
 * Note: super_admin users will have schoolId = null
 */
export async function getAuthenticatedUserSchool(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient()

    // Get the authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Look up the user record to get the school_id and role
    const adminClient = createAdminClient()

    // First try by ID
    let { data: userData, error: userError } = await adminClient
      .from('users')
      .select('school_id, role')
      .eq('id', user.id)
      .single()

    if (userError) {
      // If not found by ID, try by email (in case IDs don't match between auth and users table)
      const { data: userByEmail } = await adminClient
        .from('users')
        .select('id, school_id, role')
        .eq('email', user.email)
        .single()

      if (userByEmail) {
        userData = userByEmail
      }
    }

    // Check if user is super_admin
    if (userData?.role === 'super_admin') {
      return {
        userId: user.id,
        schoolId: null, // Super admin has no school restriction
        email: user.email || '',
        role: 'super_admin'
      }
    }

    // For regular users, get school_id
    const metadataSchoolId = user.user_metadata?.school_id
    const schoolId = userData?.school_id || metadataSchoolId

    if (!schoolId) {
      console.error('User has no associated school_id:', user.id)
      return null
    }

    return {
      userId: user.id,
      schoolId,
      email: user.email || '',
      role: userData?.role
    }
  } catch (error) {
    console.error('Error getting authenticated user school:', error)
    return null
  }
}

/**
 * Helper to require authentication and return school_id.
 * Throws an error response if not authenticated.
 */
export async function requireAuthenticatedSchool(): Promise<AuthenticatedUser> {
  const authUser = await getAuthenticatedUserSchool()

  if (!authUser) {
    throw new Error('Unauthorized: User not authenticated or has no associated school')
  }

  return authUser
}

/**
 * Check if the authenticated user is a super admin.
 * Super admins have no school_id restriction and can access all schools.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const authUser = await getAuthenticatedUserSchool()
  return authUser?.role === 'super_admin' && authUser?.schoolId === null
}
