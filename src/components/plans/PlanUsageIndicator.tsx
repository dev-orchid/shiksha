'use client'

import { getUsageColor } from '@/lib/utils/plan-features'

interface PlanUsageIndicatorProps {
  current: number
  limit: number
  label: string
  className?: string
}

export function PlanUsageIndicator({
  current,
  limit,
  label,
  className,
}: PlanUsageIndicatorProps) {
  const percent = limit > 0 ? Math.min(100, (current / limit) * 100) : 0
  const colorClass = getUsageColor(percent)

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {current} / {limit === 999999 ? 'Unlimited' : limit}
        </span>
      </div>
      {limit !== 999999 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className={`h-2.5 rounded-full ${colorClass}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  )
}
