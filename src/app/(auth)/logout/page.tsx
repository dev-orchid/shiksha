'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      try {
        const supabase = getSupabaseClient()
        await supabase.auth.signOut()

        // Clear all storage
        localStorage.clear()
        sessionStorage.clear()

        // Redirect to login
        router.push('/login')
        router.refresh()
      } catch (error) {
        console.error('Logout error:', error)
        router.push('/login')
      }
    }

    logout()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-700 mx-auto mb-4" />
        <p className="text-gray-600">Logging out...</p>
      </div>
    </div>
  )
}
