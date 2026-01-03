'use client'

import { useSession } from 'next-auth/react'
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/utils/permissions'
import type { Permission } from '@/lib/constants/roles'

export function usePermissions() {
  const { data: session } = useSession()
  const userRole = session?.user?.role

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
    isAuthenticated: !!session,
  }
}
