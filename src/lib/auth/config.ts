import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'

interface UserRow {
  id: string
  school_id: string | null
  email: string
  password_hash: string | null
  role: string
  is_active: boolean
  avatar_url: string | null
  schools: { name: string } | null
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const supabase = createAdminClient()

        const { data, error } = await supabase
          .from('users')
          .select('*, schools(*)')
          .eq('email', credentials.email as string)
          .eq('is_active', true)
          .single()

        if (error || !data) {
          return null
        }

        const user = data as unknown as UserRow

        if (!user.password_hash) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        )

        if (!isValidPassword) {
          return null
        }

        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id)

        return {
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0],
          role: user.role,
          schoolId: user.school_id,
          schoolName: user.schools?.name ?? null,
          avatar: user.avatar_url,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as any).role as string
        token.schoolId = (user as any).schoolId as string | null
        token.schoolName = (user as any).schoolName as string | null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.schoolId = token.schoolId as string | null
        session.user.schoolName = token.schoolName as string | null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}
