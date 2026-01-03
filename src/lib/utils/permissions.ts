'use client'

import { ROLE_PERMISSIONS, type Role, type Permission } from '@/lib/constants/roles'

export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole as Role]
  if (!rolePermissions) return false

  return rolePermissions.includes(permission)
}

export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission))
}

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}
