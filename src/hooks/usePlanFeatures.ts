'use client'

import { useSession } from '@/components/providers/SessionProvider'
import {
  hasFeature,
  getStudentLimitWarning,
  getAdminUserLimitWarning,
  getStudentUsagePercent,
  getAdminUserUsagePercent,
} from '@/lib/utils/plan-features'
import type { PlanType, PlanFeature } from '@/lib/constants/plans'

export function usePlanFeatures() {
  const { profile } = useSession()

  const hasFeatureAccess = (feature: PlanFeature): boolean => {
    if (!profile?.planType) return false

    // Super admin has access to all features
    if (profile.role === 'super_admin') return true

    return hasFeature(profile.planType as PlanType, feature)
  }

  const studentWarning = profile
    ? getStudentLimitWarning({
        planType: profile.planType as PlanType,
        studentLimit: profile.studentLimit || 300,
        adminUserLimit: profile.adminUserLimit || 5,
        currentStudents: profile.currentStudents || 0,
        currentAdminUsers: profile.currentAdminUsers || 0,
      })
    : null

  const adminUserWarning = profile
    ? getAdminUserLimitWarning({
        planType: profile.planType as PlanType,
        studentLimit: profile.studentLimit || 300,
        adminUserLimit: profile.adminUserLimit || 5,
        currentStudents: profile.currentStudents || 0,
        currentAdminUsers: profile.currentAdminUsers || 0,
      })
    : null

  const studentUsagePercent = profile
    ? getStudentUsagePercent({
        planType: profile.planType as PlanType,
        studentLimit: profile.studentLimit || 300,
        adminUserLimit: profile.adminUserLimit || 5,
        currentStudents: profile.currentStudents || 0,
        currentAdminUsers: profile.currentAdminUsers || 0,
      })
    : 0

  const adminUserUsagePercent = profile
    ? getAdminUserUsagePercent({
        planType: profile.planType as PlanType,
        studentLimit: profile.studentLimit || 300,
        adminUserLimit: profile.adminUserLimit || 5,
        currentStudents: profile.currentStudents || 0,
        currentAdminUsers: profile.currentAdminUsers || 0,
      })
    : 0

  return {
    hasFeatureAccess,
    studentWarning,
    adminUserWarning,
    studentUsagePercent,
    adminUserUsagePercent,
    planType: profile?.planType,
    currentUsage: {
      students: profile?.currentStudents || 0,
      adminUsers: profile?.currentAdminUsers || 0,
    },
    limits: {
      students: profile?.studentLimit || 300,
      adminUsers: profile?.adminUserLimit || 5,
    },
  }
}
