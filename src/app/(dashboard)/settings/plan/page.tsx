'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Crown,
  Check,
  X,
  TrendingUp,
  Users,
  UserCog,
  MessageSquare,
  FileText,
  Clock,
} from 'lucide-react'
import { useSession } from '@/components/providers/SessionProvider'
import { PLANS, FEATURES, type PlanType, type PlanFeature } from '@/lib/constants/plans'
import { PlanBadge } from '@/components/plans/PlanBadge'
import { PlanUsageIndicator } from '@/components/plans/PlanUsageIndicator'
import { hasFeature, getPlanDisplayName } from '@/lib/utils/plan-features'
import Link from 'next/link'

export default function PlanSettingsPage() {
  const { profile } = useSession()
  const [showUpgradeForm, setShowUpgradeForm] = useState(false)

  const currentPlanType = profile?.planType || 'starter'
  const currentPlan = PLANS[currentPlanType as PlanType]

  // Group features by category for display
  const featureCategories = {
    'Core Features': [
      'student_management',
      'attendance_tracking',
      'fee_management',
      'exam_management',
    ],
    'Communication': [
      'whatsapp_integration',
      'email_support',
      'priority_support',
      'dedicated_support',
    ],
    'Reports & Analytics': [
      'basic_reports',
      'custom_reports',
    ],
    'Advanced Features': [
      'api_access',
      'multi_branch_support',
      'custom_development',
      'daily_backups',
      'weekly_backups',
    ],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plan & Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and view usage</p>
      </div>

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Current Plan
              </CardTitle>
              <CardDescription>Your active subscription plan</CardDescription>
            </div>
            <PlanBadge planType={currentPlanType as PlanType} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Plan Name</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {getPlanDisplayName(currentPlanType as PlanType)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Rate</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {currentPlan.price === 0 ? 'Custom Pricing' : `₹${currentPlan.price}/student`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Billing Status</p>
              <Badge variant="success" className="mt-1">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlanUsageIndicator
              current={profile?.currentStudents || 0}
              limit={profile?.studentLimit || 0}
              label="Students"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Admin User Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlanUsageIndicator
              current={profile?.currentAdminUsers || 0}
              limit={profile?.adminUserLimit || 0}
              label="Admin Users"
            />
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Compare features across all plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(PLANS).map(([planKey, plan]) => {
              const isCurrentPlan = planKey === currentPlanType
              const isBetterPlan = plan.price > currentPlan.price || (plan.price === 0 && currentPlan.price > 0)

              return (
                <div
                  key={planKey}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    isCurrentPlan
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-2">
                      {plan.price === 0 ? (
                        <p className="text-2xl font-bold text-gray-900">Custom</p>
                      ) : (
                        <div>
                          <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                          <span className="text-gray-500">/student/month</span>
                        </div>
                      )}
                    </div>
                    {isCurrentPlan && (
                      <Badge variant="success" className="mt-2">Current Plan</Badge>
                    )}
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Max Students</span>
                      <span className="font-medium">
                        {plan.maxStudents === null ? 'Unlimited' : plan.maxStudents.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Admin Users</span>
                      <span className="font-medium">
                        {plan.maxAdminUsers === null ? 'Unlimited' : plan.maxAdminUsers}
                      </span>
                    </div>
                  </div>

                  {!isCurrentPlan && isBetterPlan && (
                    <Button
                      className="w-full"
                      onClick={() => setShowUpgradeForm(true)}
                      icon={<TrendingUp className="h-4 w-4" />}
                    >
                      Upgrade to {plan.name}
                    </Button>
                  )}
                  {isCurrentPlan && (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feature Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(featureCategories).map(([category, featureKeys]) => (
              <div key={category}>
                <h4 className="font-semibold text-gray-900 mb-3">{category}</h4>
                <div className="space-y-2">
                  {featureKeys.map((featureKey) => {
                    const feature = FEATURES[featureKey as PlanFeature]
                    if (!feature) return null

                    return (
                      <div
                        key={featureKey}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 py-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="md:col-span-1">
                          <p className="font-medium text-gray-900">{feature.name}</p>
                          <p className="text-xs text-gray-500">{feature.description}</p>
                        </div>
                        <div className="md:col-span-3 flex items-center gap-8">
                          {Object.keys(PLANS).map((planKey) => (
                            <div key={planKey} className="flex items-center gap-2 flex-1">
                              {hasFeature(planKey as PlanType, featureKey as keyof typeof FEATURES) ? (
                                <Check className="h-5 w-5 text-green-500" />
                              ) : (
                                <X className="h-5 w-5 text-gray-300" />
                              )}
                              <span className="text-sm text-gray-600 hidden md:inline">
                                {PLANS[planKey as PlanType].name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Form Modal */}
      {showUpgradeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Request Plan Upgrade</CardTitle>
              <CardDescription>
                Submit a request to upgrade your plan. Our team will contact you shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                To upgrade your plan, please contact our sales team or submit an upgrade request.
                We'll get back to you within 24 hours.
              </p>
              <div className="flex gap-2">
                <Link href="/settings/plan/upgrade" className="flex-1">
                  <Button className="w-full">
                    Submit Upgrade Request
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
