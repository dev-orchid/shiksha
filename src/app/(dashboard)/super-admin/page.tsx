'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PLANS } from '@/lib/constants/plans'
import { getPlanBadgeColor, getPlanDisplayName } from '@/lib/utils/plan-features'
import { Eye, Edit, MoreVertical } from 'lucide-react'

interface SchoolWithUsage {
  id: string
  name: string
  code: string
  plan_type: 'starter' | 'professional' | 'enterprise'
  student_limit: number
  admin_user_limit: number
  is_active: boolean
  plan_start_date: string
  active_students: number
  admin_users: number
}

export default function SuperAdminDashboard() {
  const [schools, setSchools] = useState<SchoolWithUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/super-admin/schools')
      if (response.ok) {
        const data = await response.json()
        setSchools(data.schools || [])
      }
    } catch (error) {
      console.error('Error fetching schools:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const totalSchools = schools.length
  const activeSchools = schools.filter((s) => s.is_active).length
  const totalStudents = schools.reduce((sum, s) => sum + s.active_students, 0)
  const planCounts = {
    starter: schools.filter((s) => s.plan_type === 'starter').length,
    professional: schools.filter((s) => s.plan_type === 'professional').length,
    enterprise: schools.filter((s) => s.plan_type === 'enterprise').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage all schools and their pricing plans</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchools}</div>
            <p className="text-xs text-muted-foreground">{activeSchools} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Starter Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planCounts.starter}</div>
            <p className="text-xs text-muted-foreground">Schools on Starter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professional Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planCounts.professional}</div>
            <p className="text-xs text-muted-foreground">Schools on Professional</p>
          </CardContent>
        </Card>
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Schools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">School Name</th>
                  <th className="text-left py-3 px-4">Code</th>
                  <th className="text-left py-3 px-4">Plan</th>
                  <th className="text-right py-3 px-4">Students</th>
                  <th className="text-right py-3 px-4">Admin Users</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Started</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => {
                  const studentPercent = (school.active_students / school.student_limit) * 100
                  const userPercent = (school.admin_users / school.admin_user_limit) * 100

                  return (
                    <tr key={school.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{school.name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{school.code}</td>
                      <td className="py-3 px-4">
                        <Badge className={getPlanBadgeColor(school.plan_type)}>
                          {getPlanDisplayName(school.plan_type)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm">
                          {school.active_students} / {school.student_limit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {studentPercent.toFixed(0)}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm">
                          {school.admin_users} / {school.admin_user_limit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {userPercent.toFixed(0)}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={school.is_active ? 'success' : 'secondary'}>
                          {school.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {school.plan_start_date
                          ? new Date(school.plan_start_date).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/super-admin/schools/${school.id}`}>
                            <Button variant="outline" size="sm" icon={<Eye className="h-4 w-4" />}>
                              View
                            </Button>
                          </Link>
                          <Link href={`/super-admin/schools/${school.id}/plan`}>
                            <Button variant="outline" size="sm" icon={<Edit className="h-4 w-4" />}>
                              Edit Plan
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
