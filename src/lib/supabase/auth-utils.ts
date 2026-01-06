import { createClient } from './server'
import { createAdminClient } from './admin'

export interface AuthenticatedUser {
  userId: string
  schoolId: string
  email: string
  role?: string
}

/**
 * Get the authenticated user's school_id from the session.
 * This should be used in API routes to enforce multi-tenant isolation.
 *
 * Returns the user info with their school_id, or null if not authenticated.
 */
export async function getAuthenticatedUserSchool(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient()

    // Get the authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // First try to get school_id from user_metadata (set during signup)
    const metadataSchoolId = user.user_metadata?.school_id

    // Also look up the user record to get the school_id (more reliable)
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('school_id, role')
      .eq('auth_id', user.id)
      .single()

    // Use the school_id from the users table if available, fallback to metadata
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
