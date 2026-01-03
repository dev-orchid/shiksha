import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Check if user is a parent
  if (session.user.role !== 'parent') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
