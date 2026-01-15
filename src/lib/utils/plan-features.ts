import { PLAN_TYPES, PLANS, PLAN_FEATURES, type PlanType, type PlanFeature } from '@/lib/constants/plans'

export interface SchoolPlan {
  planType: PlanType
  studentLimit: number
  adminUserLimit: number
  currentStudents: number
  currentAdminUsers: number
}

/**
 * Check if a plan has access to a specific feature
 */
export function hasFeature(planType: PlanType, feature: PlanFeature): boolean {
  const plan = PLANS[planType]
  if (!plan) return false
  return plan.features.includes(feature)
}

/**
 * Check if school is within student limit
 */
export function isWithinStudentLimit(schoolPlan: SchoolPlan): boolean {
  return schoolPlan.currentStudents <= schoolPlan.studentLimit
}

/**
 * Check if school is within admin user limit
 */
export function isWithinAdminUserLimit(schoolPlan: SchoolPlan): boolean {
  return schoolPlan.currentAdminUsers <= schoolPlan.adminUserLimit
}

/**
 * Get student limit warning if approaching or exceeding limit
 */
export function getStudentLimitWarning(schoolPlan: SchoolPlan): {
  show: boolean
  severity: 'warning' | 'critical' | 'error'
  message: string
} | null {
  const usagePercent = (schoolPlan.currentStudents / schoolPlan.studentLimit) * 100

  if (usagePercent >= 100) {
    return {
      show: true,
      severity: 'error',
      message: `You've reached your student limit (${schoolPlan.studentLimit}). Please upgrade your plan to add more students.`,
    }
  } else if (usagePercent >= 95) {
    return {
      show: true,
      severity: 'critical',
      message: `You're almost at your student limit (${schoolPlan.currentStudents}/${schoolPlan.studentLimit}). Upgrade soon.`,
    }
  } else if (usagePercent >= 90) {
    return {
      show: true,
      severity: 'warning',
      message: `You're approaching your student limit (${schoolPlan.currentStudents}/${schoolPlan.studentLimit}). Consider upgrading your plan.`,
    }
  }

  return null
}

/**
 * Get admin user limit warning if approaching or exceeding limit
 */
export function getAdminUserLimitWarning(schoolPlan: SchoolPlan): {
  show: boolean
  severity: 'warning' | 'critical' | 'error'
  message: string
} | null {
  const usagePercent = (schoolPlan.currentAdminUsers / schoolPlan.adminUserLimit) * 100

  if (usagePercent >= 100) {
    return {
      show: true,
      severity: 'error',
      message: `You've reached your admin user limit (${schoolPlan.adminUserLimit}). Please upgrade your plan to add more users.`,
    }
  } else if (usagePercent >= 90) {
    return {
      show: true,
      severity: 'critical',
      message: `You're almost at your admin user limit (${schoolPlan.currentAdminUsers}/${schoolPlan.adminUserLimit}). Upgrade soon.`,
    }
  } else if (usagePercent >= 80) {
    return {
      show: true,
      severity: 'warning',
      message: `You're approaching your admin user limit (${schoolPlan.currentAdminUsers}/${schoolPlan.adminUserLimit}). Consider upgrading your plan.`,
    }
  }

  return null
}

/**
 * Get percentage of student limit used
 */
export function getStudentUsagePercent(schoolPlan: SchoolPlan): number {
  if (schoolPlan.studentLimit === 0) return 0
  return Math.min(100, (schoolPlan.currentStudents / schoolPlan.studentLimit) * 100)
}

/**
 * Get percentage of admin user limit used
 */
export function getAdminUserUsagePercent(schoolPlan: SchoolPlan): number {
  if (schoolPlan.adminUserLimit === 0) return 0
  return Math.min(100, (schoolPlan.currentAdminUsers / schoolPlan.adminUserLimit) * 100)
}

/**
 * Get the display name for a plan
 */
export function getPlanDisplayName(planType: PlanType): string {
  const plan = PLANS[planType]
  return plan ? plan.name : planType
}

/**
 * Get the color class for a plan badge
 */
export function getPlanBadgeColor(planType: PlanType): string {
  switch (planType) {
    case PLAN_TYPES.STARTER:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case PLAN_TYPES.PROFESSIONAL:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case PLAN_TYPES.ENTERPRISE:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

/**
 * Get the progress bar color based on usage percentage
 */
export function getUsageColor(usagePercent: number): string {
  if (usagePercent >= 100) {
    return 'bg-red-600'
  } else if (usagePercent >= 90) {
    return 'bg-yellow-600'
  } else if (usagePercent >= 80) {
    return 'bg-orange-600'
  } else {
    return 'bg-green-600'
  }
}
