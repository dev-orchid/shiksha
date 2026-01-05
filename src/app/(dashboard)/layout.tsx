import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check user role and redirect parents/students to their portals
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = (userData as { role: string } | null)?.role

  if (userRole === 'parent') {
    redirect('/parent')
  }

  if (userRole === 'student') {
    redirect('/student')
  }

  return (
    <SessionProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </SessionProvider>
  )
}
