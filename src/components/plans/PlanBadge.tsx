'use client'

import { Badge } from '@/components/ui/Badge'
import { getPlanBadgeColor, getPlanDisplayName } from '@/lib/utils/plan-features'
import type { PlanType } from '@/lib/constants/plans'

interface PlanBadgeProps {
  planType: PlanType
  className?: string
}

export function PlanBadge({ planType, className }: PlanBadgeProps) {
  return (
    <Badge className={`${getPlanBadgeColor(planType)} ${className || ''}`}>
      {getPlanDisplayName(planType)}
    </Badge>
  )
}
