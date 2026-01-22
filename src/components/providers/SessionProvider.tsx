'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
  role: string
  schoolId: string | null
  schoolName: string | null
  // Plan information
  planType?: string
  studentLimit?: number
  adminUserLimit?: number
  currentStudents?: number
  currentAdminUsers?: number
}

interface SessionContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function useSession() {
  return useContext(SessionContext)
}

interface SessionProviderProps {
  children: React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Fetch profile via API endpoint to bypass RLS issues
    // (super_admin users have school_id = NULL which may block RLS queries)
    const fetchProfile = async (authUser: User) => {
      try {
        const response = await fetch('/api/auth/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.profile) {
            setProfile(data.profile)
            return
          }
        }
      } catch (error) {
        console.error('Error fetching profile via API:', error)
      }

      // Fallback to user_metadata if API fails
      const displayName = authUser.user_metadata?.display_name
        || authUser.user_metadata?.full_name
        || authUser.user_metadata?.name
        || authUser.email?.split('@')[0]
        || 'User'

      setProfile({
        id: authUser.id,
        email: authUser.email || '',
        displayName: displayName,
        role: authUser.user_metadata?.role || 'user',
        schoolId: authUser.user_metadata?.school_id || null,
        schoolName: null,
      })
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user ?? null
      setUser(authUser)
      if (authUser) {
        fetchProfile(authUser)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null
      setUser(authUser)
      if (authUser) {
        fetchProfile(authUser)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setProfile(data.profile)
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  return (
    <SessionContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </SessionContext.Provider>
  )
}
