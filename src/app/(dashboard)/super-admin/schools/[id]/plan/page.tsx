'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PLAN_TYPES, PLANS } from '@/lib/constants/plans'
import { getPlanBadgeColor, getPlanDisplayName } from '@/lib/utils/plan-features'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'

interface School {
  id: string
  name: string
  code: string
  plan_type: 'starter' | 'professional' | 'enterprise'
  student_limit: number
  admin_user_limit: number
  is_active: boolean
  plan_start_date: string
  plan_end_date: string | null
  price_per_student: number
}

export default function EditSchoolPlanPage() {
  const params = useParams()
  const router = useRouter()
  const schoolId = params.id as string

  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    plan_type: 'starter' as 'starter' | 'professional' | 'enterprise',
    student_limit: 300,
    admin_user_limit: 5,
    price_per_student: 50,
    is_active: true,
    plan_start_date: new Date().toISOString().split('T')[0],
    plan_end_date: '',
  })

  useEffect(() => {
    if (schoolId) {
      fetchSchool()
    }
  }, [schoolId])

  const fetchSchool = async () => {
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}`)
      if (response.ok) {
        const data = await response.json()
        setSchool(data)
        setFormData({
          plan_type: data.plan_type,
          student_limit: data.student_limit,
          admin_user_limit: data.admin_user_limit,
          price_per_student: data.price_per_student,
          is_active: data.is_active,
          plan_start_date: data.plan_start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          plan_end_date: data.plan_end_date?.split('T')[0] || '',
        })
      }
    } catch (error) {
      console.error('Error fetching school:', error)
      setError('Failed to load school details')
    } finally {
      setLoading(false)
    }
  }

  const handlePlanTypeChange = (planType: 'starter' | 'professional' | 'enterprise') => {
    const plan = PLANS[planType]
    setFormData({
      ...formData,
      plan_type: planType,
      student_limit: plan.studentLimit,
      admin_user_limit: plan.adminUserLimit,
      price_per_student: plan.pricePerStudent,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/super-admin/schools/${schoolId}`)
        }, 1500)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update plan')
      }
    } catch (error) {
      setError('Failed to update plan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">School not found</p>
        <Link href="/super-admin">
          <Button variant="outline" className="mt-4" icon={<ArrowLeft className="h-4 w-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/super-admin/schools/${schoolId}`}>
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Plan</h1>
          <p className="text-muted-foreground">{school.name}</p>
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-green-800">Plan updated successfully! Redirecting...</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Current Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge className={getPlanBadgeColor(school.plan_type)}>
              {getPlanDisplayName(school.plan_type)}
            </Badge>
            <div className="text-sm text-gray-600">
              {school.student_limit} students • {school.admin_user_limit} admin users • ₹
              {school.price_per_student}/student
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update Plan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plan Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Plan Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { type: 'starter', label: 'Starter', color: 'border-blue-200 bg-blue-50' },
                  { type: 'professional', label: 'Professional', color: 'border-purple-200 bg-purple-50' },
                  { type: 'enterprise', label: 'Enterprise', color: 'border-yellow-200 bg-yellow-50' },
                ].map((plan) => (
                  <button
                    key={plan.type}
                    type="button"
                    onClick={() => handlePlanTypeChange(plan.type as any)}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      formData.plan_type === plan.type
                        ? plan.color + ' font-semibold'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium">{plan.label}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {PLANS[plan.type as keyof typeof PLANS].studentLimit} students
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="number"
                label="Student Limit"
                value={formData.student_limit}
                onChange={(e) => setFormData({ ...formData, student_limit: parseInt(e.target.value) })}
                required
                min={1}
              />
              <Input
                type="number"
                label="Admin User Limit"
                value={formData.admin_user_limit}
                onChange={(e) => setFormData({ ...formData, admin_user_limit: parseInt(e.target.value) })}
                required
                min={1}
              />
              <Input
                type="number"
                label="Price per Student (₹)"
                value={formData.price_per_student}
                onChange={(e) => setFormData({ ...formData, price_per_student: parseInt(e.target.value) })}
                required
                min={0}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Plan Start Date"
                value={formData.plan_start_date}
                onChange={(e) => setFormData({ ...formData, plan_start_date: e.target.value })}
                required
              />
              <Input
                type="date"
                label="Plan End Date (Optional)"
                value={formData.plan_end_date}
                onChange={(e) => setFormData({ ...formData, plan_end_date: e.target.value })}
              />
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">School is Active</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">Inactive schools cannot access the system</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={saving} disabled={saving} icon={<Save className="h-4 w-4" />}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href={`/super-admin/schools/${schoolId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Feature</th>
                  <th className="text-center py-2 px-4">Starter</th>
                  <th className="text-center py-2 px-4">Professional</th>
                  <th className="text-center py-2 px-4">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-4">Student Limit</td>
                  <td className="text-center py-2 px-4">{PLANS.starter.studentLimit}</td>
                  <td className="text-center py-2 px-4">{PLANS.professional.studentLimit}</td>
                  <td className="text-center py-2 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">Admin Users</td>
                  <td className="text-center py-2 px-4">{PLANS.starter.adminUserLimit}</td>
                  <td className="text-center py-2 px-4">{PLANS.professional.adminUserLimit}</td>
                  <td className="text-center py-2 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">Price per Student</td>
                  <td className="text-center py-2 px-4">₹{PLANS.starter.pricePerStudent}</td>
                  <td className="text-center py-2 px-4">₹{PLANS.professional.pricePerStudent}</td>
                  <td className="text-center py-2 px-4">Custom</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
