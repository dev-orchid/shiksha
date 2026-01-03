'use client'

import { useSession } from '@/components/providers/SessionProvider'
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/utils/permissions'
import type { Permission } from '@/lib/constants/roles'

export function usePermissions() {
  const { profile, user } = useSession()
  const userRole = profile?.role

  const can = (permission: Permission): boolean => {
    if (!userRole) return false
    return hasPermission(userRole, permission)
  }

  const canAny = (permissions: Permission[]): boolean => {
    if (!userRole) return false
    return hasAnyPermission(userRole, permissions)
  }

  const canAll = (permissions: Permission[]): boolean => {
    if (!userRole) return false
    return hasAllPermissions(userRole, permissions)
  }

  return {
    can,
    canAny,
    canAll,
    role: userRole,
    isAuthenticated: !!user,
  }
}
