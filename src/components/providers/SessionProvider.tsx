'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  role: string
  schoolId: string | null
  schoolName: string | null
}

interface SessionContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
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

    const fetchProfile = async (authUser: User) => {
      // Fetch user profile with school info
      const { data } = await supabase
        .from('users')
        .select('id, email, role, school_id, schools(name)')
        .eq('id', authUser.id)
        .single()

      interface UserData {
        id: string
        email: string
        role: string
        school_id: string | null
        schools: { name: string } | null
      }

      const userData = data as UserData | null

      if (userData) {
        setProfile({
          id: userData.id,
          email: userData.email,
          role: userData.role,
          schoolId: userData.school_id,
          schoolName: userData.schools?.name ?? null,
        })
      } else {
        // Fallback to user_metadata if user record doesn't exist yet
        setProfile({
          id: authUser.id,
          email: authUser.email || '',
          role: authUser.user_metadata?.role || 'user',
          schoolId: authUser.user_metadata?.school_id || null,
          schoolName: null,
        })
      }
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

  return (
    <SessionContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </SessionContext.Provider>
  )
}
