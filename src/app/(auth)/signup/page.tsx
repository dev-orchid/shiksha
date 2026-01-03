'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, UserPlus, Check } from 'lucide-react'

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    schoolName: '',
    password: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateForm = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setApiError('')
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.phone) newErrors.phone = 'Phone number is required'
    if (!formData.schoolName) newErrors.schoolName = 'School name is required'
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setApiError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setApiError(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (error) {
      setApiError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-emerald-700" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-500 mb-8">
            Your account has been created successfully. You can now sign in with your email and password.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image Background */}
      <div
        className="hidden lg:block lg:w-[48%] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2071&auto=format&fit=crop')`,
        }}
      />

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-[52%] flex items-center justify-center px-6 py-12 bg-white overflow-auto">
        <div className="w-full max-w-[400px]">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-semibold text-gray-900">Create Account</h1>
            <p className="text-gray-500 mt-2 text-[15px]">Sign up to get started</p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {apiError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{apiError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-gray-900 placeholder:text-gray-400 text-[15px]`}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-gray-900 placeholder:text-gray-400 text-[15px]`}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-gray-900 placeholder:text-gray-400 text-[15px]`}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">School Name</label>
                <input
                  type="text"
                  placeholder="ABC International School"
                  value={formData.schoolName}
                  onChange={(e) => updateForm('schoolName', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.schoolName ? 'border-red-300' : 'border-gray-300'
                  } focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-gray-900 placeholder:text-gray-400 text-[15px]`}
                />
                {errors.schoolName && <p className="text-sm text-red-500 mt-1">{errors.schoolName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min 8 characters)"
                    value={formData.password}
                    onChange={(e) => updateForm('password', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-gray-900 placeholder:text-gray-400 text-[15px]`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-[15px] mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>
          </div>

          {/* Login link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-[15px]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
