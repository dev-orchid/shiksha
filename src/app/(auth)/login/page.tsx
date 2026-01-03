'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, FileText } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoginError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setLoginError('Invalid email or password')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setLoginError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image Background */}
      <div
        className="hidden lg:block lg:w-[48%] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop')`,
        }}
      />

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[52%] flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-semibold text-gray-900">Welcome back!</h1>
            <p className="text-gray-500 mt-2 text-[15px]">Sign in to continue to your account</p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {(error || loginError) && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">
                    {loginError || 'Authentication failed. Please try again.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-gray-900 placeholder:text-gray-400 text-[15px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-gray-900 placeholder:text-gray-400 text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-[15px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link
                href="/forgot-password"
                className="text-emerald-700 hover:text-emerald-800 font-medium text-[15px] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-[15px]">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-700" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
}
