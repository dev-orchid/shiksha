'use client'

import { usePlanFeatures } from '@/hooks/usePlanFeatures'
import { UpgradePrompt } from './UpgradePrompt'
import type { PlanFeature } from '@/lib/constants/plans'

interface FeatureGateProps {
  feature: PlanFeature
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * FeatureGate component to restrict access to features based on plan
 *
 * @param feature - The feature to check access for
 * @param children - Content to show if user has access
 * @param fallback - Optional custom fallback instead of UpgradePrompt
 */
export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeatureAccess } = usePlanFeatures()

  if (!hasFeatureAccess(feature)) {
    return fallback || <UpgradePrompt feature={feature} />
  }

  return <>{children}</>
}
