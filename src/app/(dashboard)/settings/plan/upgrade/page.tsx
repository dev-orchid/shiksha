'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react'
import { useSession } from '@/components/providers/SessionProvider'
import { PLANS } from '@/lib/constants/plans'
import Link from 'next/link'

export default function PlanUpgradeRequestPage() {
  const router = useRouter()
  const { profile } = useSession()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const [formData, setFormData] = useState({
    requested_plan: 'professional',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    additional_notes: '',
  })

  const currentPlan = profile?.planType || 'starter'
  const availableUpgrades = Object.entries(PLANS).filter(([key, plan]) => {
    const currentPlanData = PLANS[currentPlan as keyof typeof PLANS]
    return plan.price > currentPlanData.price || (plan.price === 0 && currentPlanData.price > 0)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/plan-upgrade-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Upgrade request submitted successfully! We will contact you soon.',
        })
        // Reset form
        setFormData({
          requested_plan: 'professional',
          contact_person: '',
          contact_phone: '',
          contact_email: '',
          additional_notes: '',
        })
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/settings/plan')
        }, 2000)
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to submit upgrade request. Please try again.',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred. Please try again later.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings/plan">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Plan Upgrade</h1>
          <p className="text-gray-500 mt-1">Submit a request to upgrade your subscription plan</p>
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${
            result.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {result.message}
            </p>
          </div>
        </div>
      )}

      {/* Upgrade Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Details</CardTitle>
          <CardDescription>
            Fill out the form below to request a plan upgrade. Our team will review your request and
            contact you within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Plan Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                {currentPlan}
              </p>
            </div>

            {/* Requested Plan */}
            <Select
              label="Requested Plan"
              value={formData.requested_plan}
              onChange={(e) =>
                setFormData({ ...formData, requested_plan: e.target.value })
              }
              options={availableUpgrades.map(([key, plan]) => ({
                value: key,
                label: `${plan.name} - ${
                  plan.price === 0 ? 'Custom Pricing' : `₹${plan.price}/student/month`
                }`,
              }))}
              required
            />

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Contact Information</h3>

              <Input
                label="Contact Person Name"
                value={formData.contact_person}
                onChange={(e) =>
                  setFormData({ ...formData, contact_person: e.target.value })
                }
                placeholder="John Doe"
                required
              />

              <Input
                label="Contact Phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) =>
                  setFormData({ ...formData, contact_phone: e.target.value })
                }
                placeholder="+91 9876543210"
                required
              />

              <Input
                label="Contact Email"
                type="email"
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
                placeholder="john@example.com"
                required
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.additional_notes}
                onChange={(e) =>
                  setFormData({ ...formData, additional_notes: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Any specific requirements or questions..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                icon={<Send className="h-4 w-4" />}
                className="flex-1"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Link href="/settings/plan">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">What happens next?</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• Our team will review your upgrade request</li>
                <li>• You'll receive a call or email within 24 hours</li>
                <li>• We'll discuss pricing and implementation timeline</li>
                <li>• Once approved, your plan will be upgraded immediately</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
