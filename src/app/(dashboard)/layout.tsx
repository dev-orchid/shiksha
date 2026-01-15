import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  // Use admin client to bypass RLS - super_admin users have school_id = NULL
  // which may cause RLS policies to block them from reading their own record
  const adminClient = createAdminClient()

  // First try by ID
  let { data: userData } = await adminClient
    .from('users')
    .select('role, school_id')
    .eq('id', user.id)
    .single()

  // If not found by ID, try by email (in case IDs don't match)
  if (!userData && user.email) {
    const { data: userByEmail } = await adminClient
      .from('users')
      .select('role, school_id')
      .eq('email', user.email)
      .single()
    userData = userByEmail
  }

  const userRole = (userData as { role: string; school_id: string | null } | null)?.role

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
