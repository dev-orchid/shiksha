'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

// TrackMate global type
declare global {
  interface Window {
    TM?: {
      init: (companyId: string, listId: string) => void
      identify: (data: { name: string; email: string; phone: string }) => void
    }
  }
}

// Razorpay types - local to this file to avoid global conflicts
interface LocalRazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill: {
    name: string
    email: string
    contact: string
  }
  notes: Record<string, string>
  theme?: {
    color: string
  }
  handler: (response: LocalRazorpayResponse) => void
  modal?: {
    ondismiss: () => void
  }
}

interface LocalRazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface PlanConfig {
  name: string
  price: number | null
  currency: string
  period: string
  student_limit: number | null
  admin_limit: number | null
  features: string[]
}

interface PaymentConfig {
  is_enabled: boolean
  key_id: string | null
  display_name: string
  theme_color: string
  mode: string
  pricing_plans: {
    starter: PlanConfig
    professional: PlanConfig
    enterprise: PlanConfig
  }
}

interface PlanCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  planType: 'starter' | 'professional' | null
  paymentConfig: PaymentConfig | null
}

export function PlanCheckoutModal({ isOpen, onClose, planType, paymentConfig }: PlanCheckoutModalProps) {
  const [formData, setFormData] = useState({
    school_name: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    student_count: 100,
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  // Load Razorpay script
  useEffect(() => {
    if (isOpen && !razorpayLoaded) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => setRazorpayLoaded(true)
      script.onerror = () => setError('Failed to load payment gateway')
      document.body.appendChild(script)

      return () => {
        // Don't remove script on cleanup as it might be needed later
      }
    }
  }, [isOpen, razorpayLoaded])

  if (!isOpen || !planType || !paymentConfig) return null

  const selectedPlan = paymentConfig.pricing_plans[planType]
  if (!selectedPlan || selectedPlan.price === null) return null

  const totalAmount = selectedPlan.price * formData.student_count
  const currencySymbol = selectedPlan.currency === 'INR' ? '₹' : selectedPlan.currency

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }))
    setError(null)
  }

  const validateForm = () => {
    if (!formData.school_name.trim()) {
      setError('Please enter school name')
      return false
    }
    if (!formData.customer_name.trim()) {
      setError('Please enter contact person name')
      return false
    }
    if (!formData.customer_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      setError('Please enter a valid email address')
      return false
    }
    if (!formData.customer_phone.trim() || !/^\d{10}$/.test(formData.customer_phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number')
      return false
    }
    if (formData.student_count < 1) {
      setError('Student count must be at least 1')
      return false
    }
    if (selectedPlan.student_limit && formData.student_count > selectedPlan.student_limit) {
      setError(`Student count exceeds plan limit of ${selectedPlan.student_limit}`)
      return false
    }
    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions')
      return false
    }
    return true
  }

  const handlePayNow = async () => {
    if (!validateForm()) return
    if (!razorpayLoaded) {
      setError('Payment gateway is still loading. Please wait.')
      return
    }

    setLoading(true)
    setError(null)

    // Identify user in TrackMate
    if (typeof window !== 'undefined' && window.TM?.identify) {
      window.TM.identify({
        name: formData.customer_name,
        email: formData.customer_email,
        phone: formData.customer_phone,
      })
    }

    try {
      // Initiate payment order
      const initiateResponse = await fetch('/api/platform/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_type: planType,
          ...formData,
        }),
      })

      if (!initiateResponse.ok) {
        const errorData = await initiateResponse.json()
        throw new Error(errorData.error || 'Failed to initiate payment')
      }

      const { checkout_options, plan_details } = await initiateResponse.json()

      // Open Razorpay checkout
      const options: LocalRazorpayOptions = {
        ...checkout_options,
        handler: async (response: LocalRazorpayResponse) => {
          // Verify payment
          try {
            const verifyResponse = await fetch('/api/platform/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                customer_info: {
                  plan_type: planType,
                  school_name: formData.school_name,
                  customer_name: formData.customer_name,
                  customer_email: formData.customer_email,
                  customer_phone: formData.customer_phone,
                  student_count: formData.student_count,
                },
              }),
            })

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json()
              throw new Error(errorData.error || 'Payment verification failed')
            }

            const verifyData = await verifyResponse.json()

            // Redirect to signup with payment info
            window.location.href = verifyData.redirect_url
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError)
            setError('Payment was processed but verification failed. Please contact support.')
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      console.error('Payment initiation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to initiate payment')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-orange-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-500/20">
          <div>
            <h2 className="text-xl font-bold text-white">Subscribe to {selectedPlan.name}</h2>
            <p className="text-gray-400 text-sm mt-1">Complete your purchase to get started</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Plan Summary */}
        <div className="p-6 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-b border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">{selectedPlan.name} Plan</h3>
              <p className="text-orange-400 text-sm">
                {currencySymbol}{selectedPlan.price} per student/year
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-orange-400" />
              <span className="text-sm text-gray-300">Annual subscription</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              School Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="school_name"
              value={formData.school_name}
              onChange={handleInputChange}
              placeholder="Enter your school name"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Contact Person Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleInputChange}
              placeholder="Full name"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleInputChange}
                placeholder="email@school.com"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleInputChange}
                placeholder="10-digit number"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Number of Students <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="student_count"
              value={formData.student_count}
              onChange={handleInputChange}
              min={1}
              max={selectedPlan.student_limit || 10000}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {selectedPlan.student_limit && (
              <p className="mt-1 text-xs text-gray-500">
                Maximum {selectedPlan.student_limit} students for this plan
              </p>
            )}
          </div>

          {/* Total */}
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Price per student</span>
              <span className="text-white">{currencySymbol}{selectedPlan.price}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Number of students</span>
              <span className="text-white">{formData.student_count}</span>
            </div>
            <div className="h-px bg-slate-700 my-2"></div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Total Amount</span>
              <span className="text-2xl font-bold text-orange-400">
                {currencySymbol}{totalAmount.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">per year</p>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked)
                setError(null)
              }}
              className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900"
            />
            <span className="text-sm text-gray-400">
              I agree to the{' '}
              <a href="/terms" target="_blank" className="text-orange-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" className="text-orange-400 hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-orange-500/20">
          <button
            onClick={handlePayNow}
            disabled={loading || !razorpayLoaded}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : !razorpayLoaded ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Pay {currencySymbol}{totalAmount.toLocaleString()}
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">
            Secure payment powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  )
}
