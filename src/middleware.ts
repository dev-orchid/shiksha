import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Static files and API routes
  const isApiRoute = pathname.startsWith('/api')

  // Skip middleware for public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Update session and get user
  const { user, supabaseResponse } = await updateSession(request)

  // If no user and trying to access protected route, redirect to login
  if (!user && !isApiRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and trying to access login, redirect to dashboard
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
