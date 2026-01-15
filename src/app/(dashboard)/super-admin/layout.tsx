import { redirect } from 'next/navigation'
import { isSuperAdmin } from '@/lib/supabase/auth-utils'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isSuper = await isSuperAdmin()

  if (!isSuper) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
