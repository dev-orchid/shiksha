import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is a parent by fetching their role from the users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = (userData as { role: string } | null)?.role
  if (userRole !== 'parent') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
