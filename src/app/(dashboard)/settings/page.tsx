'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  School,
  Calendar,
  BookOpen,
  Users,
  Bell,
  Shield,
  Database,
  Palette,
  Building2,
} from 'lucide-react'

interface SchoolData {
  id: string
  name: string
  code: string
}

interface AcademicYear {
  id: string
  name: string
  is_current: boolean
}

interface Stats {
  totalStudents: number
  totalStaff: number
  activeUsers: number
}

const settingsSections = [
  {
    title: 'School Profile',
    description: 'Update school information, logo, and contact details',
    icon: School,
    href: '/settings/school',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Academic Year',
    description: 'Manage academic years and set current session',
    icon: Calendar,
    href: '/settings/academic',
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Classes & Sections',
    description: 'Configure classes, sections, and subjects',
    icon: BookOpen,
    href: '/settings/classes',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Departments',
    description: 'Manage school departments',
    icon: Building2,
    href: '/settings/departments',
    color: 'bg-teal-100 text-teal-600',
  },
  {
    title: 'User Management',
    description: 'Manage users, roles, and permissions',
    icon: Users,
    href: '/settings/users',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    title: 'Notifications',
    description: 'Configure email, SMS, and WhatsApp notifications',
    icon: Bell,
    href: '/settings/notifications',
    color: 'bg-red-100 text-red-600',
  },
  {
    title: 'Security',
    description: 'Password policies and session settings',
    icon: Shield,
    href: '/settings/security',
    color: 'bg-gray-100 text-gray-600',
  },
  {
    title: 'Backup & Data',
    description: 'Database backup and data management',
    icon: Database,
    href: '/settings/backup',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    title: 'Appearance',
    description: 'Customize theme and branding',
    icon: Palette,
    href: '/settings/appearance',
    color: 'bg-pink-100 text-pink-600',
  },
]

export default function SettingsPage() {
  const [school, setSchool] = useState<SchoolData | null>(null)
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalStaff: 0,
    activeUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [schoolRes, academicRes, studentsRes, staffRes] = await Promise.all([
        fetch('/api/settings/school'),
        fetch('/api/academic-years?current=true'),
        fetch('/api/students?limit=1'),
        fetch('/api/staff?limit=1'),
      ])

      if (schoolRes.ok) {
        const schoolData = await schoolRes.json()
        setSchool(schoolData.data)
      }

      if (academicRes.ok) {
        const academicData = await academicRes.json()
        const current = academicData.data?.find((y: AcademicYear) => y.is_current)
        setAcademicYear(current || academicData.data?.[0])
      }

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStats(prev => ({ ...prev, totalStudents: studentsData.pagination?.total || 0 }))
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json()
        setStats(prev => ({ ...prev, totalStaff: staffData.pagination?.total || 0 }))
      }
    } catch (error) {
      console.error('Failed to fetch settings data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your school settings and preferences</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${section.color}`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">School Code</p>
                <p className="font-medium text-gray-900">{school?.code || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Academic Year</p>
                <p className="font-medium text-gray-900">{academicYear?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">School Name</p>
                <p className="font-medium text-gray-900">{school?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="font-medium text-gray-900">{stats.totalStudents.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="font-medium text-gray-900">{stats.totalStaff.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">System Status</p>
                <p className="font-medium text-green-600">Active</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
