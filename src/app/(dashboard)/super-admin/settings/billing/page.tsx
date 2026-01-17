'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, CreditCard, Check, Save, Loader2, X, Pencil } from 'lucide-react'
import Link from 'next/link'

interface PlanConfig {
  name: string
  price: number | null
  currency: string
  period: string
  student_limit: number | null
  admin_limit: number | null
  features: string[]
}

interface PricingPlans {
  starter: PlanConfig
  professional: PlanConfig
  enterprise: PlanConfig
}

interface PaymentGateway {
  provider: string
  api_key?: string
  is_configured: boolean
}

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)

  const [pricingPlans, setPricingPlans] = useState<PricingPlans>({
    starter: {
      name: 'Starter',
      price: 50,
      currency: 'INR',
      period: 'per student',
      student_limit: 300,
      admin_limit: 5,
      features: ['Basic reports', 'Email support'],
    },
    professional: {
      name: 'Professional',
      price: 15000,
      currency: 'INR',
      period: 'per student',
      student_limit: 1000,
      admin_limit: 15,
      features: ['Advanced reports', 'WhatsApp integration', 'Priority support'],
    },
    enterprise: {
      name: 'Enterprise',
      price: null,
      currency: 'INR',
      period: 'per student',
      student_limit: null,
      admin_limit: null,
      features: ['Unlimited students', 'Unlimited admin users', 'Custom features', 'Dedicated support', 'SLA guarantee'],
    },
  })

  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>({
    provider: 'razorpay',
    api_key: '',
    is_configured: false,
  })

  const [editForm, setEditForm] = useState<PlanConfig | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/super-admin/settings/billing')
      if (response.ok) {
        const data = await response.json()
        if (data.pricing_plans) {
          setPricingPlans(data.pricing_plans)
        }
        if (data.payment_gateway) {
          setPaymentGateway(data.payment_gateway)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditPlan = (planKey: string) => {
    setEditingPlan(planKey)
    setEditForm({ ...pricingPlans[planKey as keyof PricingPlans] })
  }

  const handleSavePlan = async () => {
    if (!editingPlan || !editForm) return

    setSaving(true)
    setMessage(null)

    const updatedPlans = {
      ...pricingPlans,
      [editingPlan]: editForm,
    }

    try {
      const response = await fetch('/api/super-admin/settings/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing_plans: updatedPlans }),
      })

      if (response.ok) {
        setPricingPlans(updatedPlans)
        setEditingPlan(null)
        setEditForm(null)
        setMessage({ type: 'success', text: 'Plan updated successfully!' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to update plan' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePaymentGateway = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/super-admin/settings/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_gateway: {
            ...paymentGateway,
            is_configured: !!paymentGateway.api_key,
          },
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment settings saved successfully!' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save payment settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' })
    } finally {
      setSaving(false)
    }
  }

  const getPlanColor = (planKey: string) => {
    switch (planKey) {
      case 'starter':
        return 'border-blue-500'
      case 'professional':
        return 'border-green-500'
      case 'enterprise':
        return 'border-purple-500'
      default:
        return 'border-gray-300'
    }
  }

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Custom'
    const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
    return `${symbols[currency] || currency}${price.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
          <p className="text-gray-500 mt-1">Manage pricing plans and billing configuration</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Pricing Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pricing Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(pricingPlans).map(([planKey, plan]) => (
              <div
                key={planKey}
                className={`relative border-2 ${getPlanColor(planKey)} rounded-lg p-6 ${
                  planKey === 'professional' ? 'ring-2 ring-green-500 ring-offset-2' : ''
                }`}
              >
                {planKey === 'professional' && (
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                  {plan.price !== null && (
                    <span className="text-gray-500">/{plan.period}</span>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {plan.student_limit ? `Up to ${plan.student_limit} students` : 'Unlimited students'}
                  <br />
                  {plan.admin_limit ? `${plan.admin_limit} admin users` : 'Unlimited admin users'}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature: string) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6"
                  variant="outline"
                  onClick={() => handleEditPlan(planKey)}
                  icon={<Pencil className="h-4 w-4" />}
                >
                  Edit Plan
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Plan Modal */}
      {editingPlan && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit {editForm.name} Plan</h3>
              <button
                onClick={() => {
                  setEditingPlan(null)
                  setEditForm(null)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={editForm.price || ''}
                    placeholder="Custom"
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        price: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={editForm.currency}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Limit</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={editForm.student_limit || ''}
                    placeholder="Unlimited"
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        student_limit: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Limit</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={editForm.admin_limit || ''}
                    placeholder="Unlimited"
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        admin_limit: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features (one per line)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  value={editForm.features.join('\n')}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      features: e.target.value.split('\n').filter((f) => f.trim()),
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSavePlan} loading={saving} className="flex-1">
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingPlan(null)
                  setEditForm(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateway Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Gateway
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={paymentGateway.provider}
                onChange={(e) =>
                  setPaymentGateway({ ...paymentGateway, provider: e.target.value })
                }
              >
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter API key"
                value={paymentGateway.api_key || ''}
                onChange={(e) =>
                  setPaymentGateway({ ...paymentGateway, api_key: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  paymentGateway.is_configured
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {paymentGateway.is_configured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSavePaymentGateway}
              loading={saving}
              icon={<Save className="h-4 w-4" />}
            >
              Save Payment Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
