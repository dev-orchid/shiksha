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

  return (
    <SessionProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </SessionProvider>
  )
}
