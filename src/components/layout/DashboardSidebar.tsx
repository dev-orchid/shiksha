'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { usePermissions } from '@/hooks/usePermissions'
import { usePlanFeatures } from '@/hooks/usePlanFeatures'
import { PERMISSIONS } from '@/lib/constants/roles'
import { Badge } from '@/components/ui/Badge'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Calendar,
  FileText,
  IndianRupee,
  Wallet,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  Crown,
  Lock,
} from 'lucide-react'

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  permission?: string
  requiredFeature?: string
  isPremium?: boolean
  children?: { label: string; href: string; permission?: string; requiredFeature?: string; isPremium?: boolean }[]
}

// Super Admin Navigation
const superAdminNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/super-admin',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    children: [
      { label: 'Profile', href: '/settings' },
    ],
  },
]

const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    label: 'Students',
    icon: <Users className="h-5 w-5" />,
    permission: PERMISSIONS.STUDENTS_VIEW,
    children: [
      { label: 'All Students', href: '/students' },
      { label: 'Add Student', href: '/students/new', permission: PERMISSIONS.STUDENTS_CREATE },
      { label: 'Bulk Import', href: '/students/import', permission: PERMISSIONS.STUDENTS_CREATE },
    ],
  },
  {
    label: 'Staff',
    icon: <GraduationCap className="h-5 w-5" />,
    permission: PERMISSIONS.TEACHERS_VIEW,
    children: [
      { label: 'All Staff', href: '/teachers' },
      { label: 'Add Staff', href: '/teachers/new', permission: PERMISSIONS.TEACHERS_CREATE },
      { label: 'Assignments', href: '/teachers/assignments' },
    ],
  },
  {
    label: 'Attendance',
    icon: <UserCheck className="h-5 w-5" />,
    permission: PERMISSIONS.ATTENDANCE_VIEW,
    children: [
      { label: 'Student Attendance', href: '/attendance/students' },
      { label: 'Staff Attendance', href: '/attendance/staff' },
      { label: 'Reports', href: '/attendance/reports', permission: PERMISSIONS.ATTENDANCE_REPORTS },
    ],
  },
  {
    label: 'Examinations',
    icon: <FileText className="h-5 w-5" />,
    permission: PERMISSIONS.EXAMS_VIEW,
    children: [
      { label: 'All Exams', href: '/exams' },
      { label: 'Create Exam', href: '/exams/new', permission: PERMISSIONS.EXAMS_CREATE },
      { label: 'Results', href: '/exams/results' },
      { label: 'Grade Settings', href: '/exams/grades' },
    ],
  },
  {
    label: 'Fees',
    icon: <IndianRupee className="h-5 w-5" />,
    permission: PERMISSIONS.FEES_VIEW,
    children: [
      { label: 'Fee Collection', href: '/fees' },
      { label: 'Fee Structure', href: '/fees/structure', permission: PERMISSIONS.FEES_MANAGE },
      { label: 'Generate Invoices', href: '/fees/invoices', permission: PERMISSIONS.FEES_MANAGE },
      { label: 'Pending Dues', href: '/fees/dues' },
      { label: 'Reports', href: '/fees/reports', permission: PERMISSIONS.FEES_REPORTS },
    ],
  },
  {
    label: 'Salary',
    icon: <Wallet className="h-5 w-5" />,
    permission: PERMISSIONS.SALARY_VIEW_ALL,
    children: [
      { label: 'Payroll', href: '/salary' },
      { label: 'Salary Structure', href: '/salary/structure', permission: PERMISSIONS.SALARY_MANAGE },
      { label: 'Process Payroll', href: '/salary/process', permission: PERMISSIONS.SALARY_PROCESS },
      { label: 'Reports', href: '/salary/reports' },
    ],
  },
  {
    label: 'WhatsApp',
    icon: <MessageSquare className="h-5 w-5" />,
    permission: PERMISSIONS.WHATSAPP_VIEW,
    children: [
      { label: 'Dashboard', href: '/whatsapp' },
      { label: 'Send Message', href: '/whatsapp/send', permission: PERMISSIONS.WHATSAPP_SEND },
      { label: 'Groups', href: '/whatsapp/groups' },
      { label: 'Templates', href: '/whatsapp/templates', permission: PERMISSIONS.WHATSAPP_MANAGE },
      { label: 'Message Logs', href: '/whatsapp/logs' },
    ],
  },
  {
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    permission: PERMISSIONS.SETTINGS_VIEW,
    children: [
      { label: 'School Settings', href: '/settings' },
      { label: 'Academic Year', href: '/settings/academic' },
      { label: 'Classes & Sections', href: '/settings/classes' },
      { label: 'Departments', href: '/settings/departments' },
      { label: 'Events', href: '/events' },
      { label: 'Event Types', href: '/settings/event-types' },
      { label: 'Users', href: '/settings/users', permission: PERMISSIONS.USERS_MANAGE },
      { label: 'Plan & Billing', href: '/settings/plan' },
    ],
  },
]

interface DashboardSidebarProps {
  open: boolean
  onClose: () => void
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { can, profile } = usePermissions()
  const { hasFeatureAccess } = usePlanFeatures()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Check if user is super admin
  const isSuperAdmin = profile?.role === 'super_admin' && !profile?.schoolId

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    )
  }

  const isActive = (href: string) => pathname === href
  const isParentActive = (children?: { href: string }[]) =>
    children?.some((child) => pathname === child.href)

  // Use super admin navigation if user is super admin
  const navItems = isSuperAdmin ? superAdminNavigation : navigation

  const filteredNavigation = navItems.filter((item) => {
    // Super admin navigation has no permissions
    if (isSuperAdmin) return true
    if (item.permission && !can(item.permission as any)) return false
    return true
  })

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <Link href={isSuperAdmin ? '/super-admin' : '/dashboard'} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SMS</span>
          </div>
          <span className="font-semibold text-gray-900">
            {isSuperAdmin ? 'Super Admin' : 'School MS'}
          </span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredNavigation.map((item) => {
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.includes(item.label) || isParentActive(item.children)

          if (hasChildren) {
            const visibleChildren = item.children!.filter(
              (child) => isSuperAdmin || !child.permission || can(child.permission as any)
            )

            if (visibleChildren.length === 0) return null

            const hasAccess = item.requiredFeature
              ? hasFeatureAccess(item.requiredFeature as any)
              : true

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isParentActive(item.children)
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                    {item.isPremium && !hasAccess && (
                      <Badge variant="warning" className="text-xs px-1.5 py-0">
                        <Crown className="h-3 w-3 inline mr-0.5" />
                        Pro
                      </Badge>
                    )}
                    {item.isPremium && hasAccess && (
                      <Crown className="h-3.5 w-3.5 text-yellow-500" />
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                    {visibleChildren.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          'block px-3 py-2 rounded-lg text-sm transition-colors',
                          isActive(child.href)
                            ? 'bg-primary text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          const hasAccess = item.requiredFeature
            ? hasFeatureAccess(item.requiredFeature as any)
            : true

          return (
            <Link
              key={item.label}
              href={item.href!}
              onClick={onClose}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(item.href!)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.isPremium && !hasAccess && (
                <Badge variant="warning" className="text-xs px-1.5 py-0">
                  <Crown className="h-3 w-3 inline mr-0.5" />
                  Pro
                </Badge>
              )}
              {item.isPremium && hasAccess && (
                <Crown className="h-3.5 w-3.5 text-yellow-500" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
