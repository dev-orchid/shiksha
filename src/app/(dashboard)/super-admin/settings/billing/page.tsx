'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, CreditCard, Check, Save, Loader2, X, Pencil, Eye, EyeOff, TestTube, CheckCircle, XCircle } from 'lucide-react'
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
  key_id: string
  key_secret: string
  webhook_secret: string
  mode: 'test' | 'live'
  is_enabled: boolean
  is_configured: boolean
  display_name: string
  theme_color: string
}

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)

  // Payment gateway state
  const [showSecret, setShowSecret] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [hasExistingConfig, setHasExistingConfig] = useState(false)

  const [pricingPlans, setPricingPlans] = useState<PricingPlans>({
    starter: {
      name: 'Starter',
      price: 50,
      currency: 'INR',
      period: 'per student',
      student_limit: 300,
      admin_limit: 5,
      features: ['Basic reports', 'Email support','Telegram Integration'],
    },
    professional: {
      name: 'Professional',
      price: 15000,
      currency: 'INR',
      period: 'per student',
      student_limit: 1000,
      admin_limit: 15,
      features: ['Advanced reports', 'WhatsApp integration', 'Priority support','Online Fee Payment'],
    },
    enterprise: {
      name: 'Enterprise',
      price: null,
      currency: 'INR',
      period: 'per student',
      student_limit: null,
      admin_limit: null,
      features: ['Unlimited students', 'Online Fee Payment', 'Custom features', 'Dedicated support', 'SLA guarantee'],
    },
  })

  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>({
    provider: 'razorpay',
    key_id: '',
    key_secret: '',
    webhook_secret: '',
    mode: 'test',
    is_enabled: false,
    is_configured: false,
    display_name: '',
    theme_color: '#f97316',
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
          const pg = data.payment_gateway
          setHasExistingConfig(!!pg.is_configured)
          setPaymentGateway({
            provider: pg.provider || 'razorpay',
            key_id: pg.key_id || '',
            key_secret: pg.key_secret || '',
            webhook_secret: pg.webhook_secret || '',
            mode: pg.mode || 'test',
            is_enabled: pg.is_enabled || false,
            is_configured: pg.is_configured || false,
            display_name: pg.display_name || '',
            theme_color: pg.theme_color || '#f97316',
          })
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

  const handleTestConnection = async () => {
    if (!paymentGateway.key_id || !paymentGateway.key_secret) {
      setTestResult({
        success: false,
        message: 'Please enter Key ID and Key Secret first',
      })
      return
    }

    // Don't test with masked values
    if (paymentGateway.key_secret === '••••••••••••••••') {
      setTestResult({
        success: false,
        message: 'Please enter a new Key Secret to test',
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/super-admin/settings/razorpay/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key_id: paymentGateway.key_id,
          key_secret: paymentGateway.key_secret,
        }),
      })

      const data = await response.json()
      setTestResult({
        success: data.success,
        message: data.message,
      })
    } catch {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      })
    } finally {
      setTesting(false)
    }
  }

  const handlePaymentGatewayChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setPaymentGateway((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear test result when credentials change
    if (name === 'key_id' || name === 'key_secret') {
      setTestResult(null)
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
            is_configured: !!(paymentGateway.key_id && paymentGateway.key_secret && paymentGateway.key_secret !== '••••••••••••••••'),
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setHasExistingConfig(true)
        // Update with masked values from response
        if (data.payment_gateway) {
          setPaymentGateway(prev => ({
            ...prev,
            key_secret: data.payment_gateway.key_secret || prev.key_secret,
            webhook_secret: data.payment_gateway.webhook_secret || prev.webhook_secret,
          }))
        }
        setMessage({ type: 'success', text: 'Payment settings saved successfully!' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save payment settings' })
      }
    } catch {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Razorpay Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Gateway
              </label>
              <select
                name="provider"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={paymentGateway.provider}
                onChange={handlePaymentGatewayChange}
              >
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe (Coming Soon)</option>
              </select>
            </div>

            <Input
              label="Key ID"
              name="key_id"
              value={paymentGateway.key_id}
              onChange={handlePaymentGatewayChange}
              placeholder="rzp_test_xxxxxxxxxxxxx"
            />

            <div className="relative">
              <Input
                label="Key Secret"
                name="key_secret"
                type={showSecret ? 'text' : 'password'}
                value={paymentGateway.key_secret}
                onChange={handlePaymentGatewayChange}
                placeholder={hasExistingConfig ? 'Enter new secret to change' : 'Enter Key Secret'}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Webhook Secret (Optional)"
                name="webhook_secret"
                type={showWebhookSecret ? 'text' : 'password'}
                value={paymentGateway.webhook_secret}
                onChange={handlePaymentGatewayChange}
                placeholder="For webhook signature verification"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
                icon={
                  testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )
                }
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>

              {testResult && (
                <div
                  className={`mt-3 flex items-center gap-2 text-sm ${
                    testResult.success ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {testResult.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode
              </label>
              <select
                name="mode"
                value={paymentGateway.mode}
                onChange={handlePaymentGatewayChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="test">Test Mode</option>
                <option value="live">Live Mode</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {paymentGateway.mode === 'test'
                  ? 'Use test mode for development and testing'
                  : 'Live mode processes real payments'}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="font-medium text-gray-700">
                  Enable Payment Gateway
                </label>
                <p className="text-sm text-gray-500">
                  Allow subscription payments on landing page
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_enabled"
                  checked={paymentGateway.is_enabled}
                  onChange={handlePaymentGatewayChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <Input
              label="Display Name (Optional)"
              name="display_name"
              value={paymentGateway.display_name}
              onChange={handlePaymentGatewayChange}
              placeholder="Shown on checkout (e.g., Shiksha SMS)"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme Color (Optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="theme_color"
                  value={paymentGateway.theme_color}
                  onChange={handlePaymentGatewayChange}
                  className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  name="theme_color"
                  value={paymentGateway.theme_color}
                  onChange={handlePaymentGatewayChange}
                  placeholder="#f97316"
                  className="flex-1"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Customize the checkout popup color
              </p>
            </div>

            <div className="flex items-center gap-4 pt-2">
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
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>
                Create a Razorpay account at{' '}
                <a
                  href="https://dashboard.razorpay.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  dashboard.razorpay.com
                </a>
              </li>
              <li>
                Go to Settings → API Keys and generate your Key ID and Key Secret
              </li>
              <li>
                Copy the credentials and paste them above
              </li>
              <li>
                Click &quot;Test Connection&quot; to verify your credentials
              </li>
              <li>
                For webhooks, go to Settings → Webhooks and add:{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/api/platform/payments/webhook`
                    : '/api/platform/payments/webhook'}
                </code>
              </li>
              <li>
                Select &quot;payment.captured&quot; and &quot;payment.failed&quot; events
              </li>
              <li>
                Copy the Webhook Secret and paste it above
              </li>
              <li>
                Toggle &quot;Enable Payment Gateway&quot; when ready to accept payments
              </li>
            </ol>
          </CardContent>
        </Card>
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
    </div>
  )
}
