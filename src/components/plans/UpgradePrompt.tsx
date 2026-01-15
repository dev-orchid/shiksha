'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { FEATURE_NAMES, FEATURE_DESCRIPTIONS, PLANS, type PlanFeature } from '@/lib/constants/plans'

interface UpgradePromptProps {
  feature: PlanFeature
}

export function UpgradePrompt({ feature }: UpgradePromptProps) {
  const featureName = FEATURE_NAMES[feature]
  const featureDescription = FEATURE_DESCRIPTIONS[feature]

  // Find which plans have this feature
  const plansWithFeature = Object.values(PLANS)
    .filter((plan) => plan.features.includes(feature))
    .map((plan) => plan.name)

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-amber-100 rounded-full dark:bg-amber-900">
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-xl">Feature Locked</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{featureName}</h3>
            <p className="text-sm text-muted-foreground">{featureDescription}</p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Available in:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {plansWithFeature.map((planName) => (
                <li key={planName}>• {planName} Plan</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Link
              href="/settings/plan"
              className="flex-1 inline-flex items-center justify-center font-medium rounded-lg transition-colors bg-primary text-white hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary px-4 py-2 text-sm"
            >
              View Plans & Upgrade
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center font-medium rounded-lg transition-colors border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary px-4 py-2 text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
