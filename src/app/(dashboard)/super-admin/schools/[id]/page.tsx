'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getPlanBadgeColor, getPlanDisplayName } from '@/lib/utils/plan-features'
import {
  ArrowLeft,
  Users,
  GraduationCap,
  IndianRupee,
  Edit,
  Building,
  Calendar,
  Mail,
  Phone,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

interface SchoolDetails {
  id: string
  name: string
  code: string
  address: string | null
  phone: string | null
  email: string | null
  plan_type: 'starter' | 'professional' | 'enterprise'
  student_limit: number
  admin_user_limit: number
  is_active: boolean
  plan_start_date: string
  plan_end_date: string | null
  active_students: number
  admin_users: number
  total_teachers: number
  total_fees_collected: number
}

export default function SchoolDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const schoolId = params.id as string

  const [school, setSchool] = useState<SchoolDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteInfo, setDeleteInfo] = useState<{
    studentsCount?: number
    staffCount?: number
    usersCount?: number
  } | null>(null)
  const [cleaningUp, setCleaningUp] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    if (schoolId) {
      fetchSchoolDetails()
    }
  }, [schoolId])

  const fetchSchoolDetails = async () => {
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}`)
      if (response.ok) {
        const data = await response.json()
        setSchool(data)
      }
    } catch (error) {
      console.error('Error fetching school details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (force: boolean = false) => {
    setDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(
        `/api/super-admin/schools/${schoolId}${force ? '?force=true' : ''}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (response.ok) {
        router.push('/super-admin')
      } else if (response.status === 400 && data.studentsCount !== undefined) {
        // School has data, show confirmation
        setDeleteInfo({
          studentsCount: data.studentsCount,
          staffCount: data.staffCount,
          usersCount: data.usersCount,
        })
      } else {
        setDeleteError(data.error || 'Failed to delete school')
      }
    } catch (error) {
      setDeleteError('An error occurred while deleting the school')
    } finally {
      setDeleting(false)
    }
  }

  const handleCleanupOrphaned = async () => {
    setCleaningUp(true)
    setDeleteError(null)

    try {
      const response = await fetch(
        `/api/super-admin/schools/${schoolId}?cleanup_orphaned=true`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (response.ok) {
        setCleanupResult(data.deletedRecords || {})
      } else {
        setDeleteError(data.error || 'Failed to cleanup orphaned data')
      }
    } catch (error) {
      setDeleteError('An error occurred while cleaning up data')
    } finally {
      setCleaningUp(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">School not found</p>
        <p className="text-gray-400 text-sm mt-2">
          This school may have been deleted or the ID is invalid.
        </p>

        {cleanupResult ? (
          <div className="mt-6 max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 text-lg">Cleanup Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  The following orphaned records were removed:
                </p>
                <div className="space-y-2 text-sm">
                  {Object.entries(cleanupResult).map(([table, count]) => (
                    count > 0 && (
                      <div key={table} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{table.replace('_', ' ')}</span>
                        <span className="font-medium">{count} records</span>
                      </div>
                    )
                  ))}
                  {Object.values(cleanupResult).every(v => v === 0) && (
                    <p className="text-gray-500">No orphaned data found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-500">
              If there is orphaned data associated with this school ID, you can clean it up.
            </p>

            {deleteError && (
              <p className="text-red-600 text-sm">{deleteError}</p>
            )}

            <div className="flex items-center justify-center gap-4">
              <Link href="/super-admin">
                <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>
                  Back to Dashboard
                </Button>
              </Link>

              <Button
                variant="danger"
                onClick={handleCleanupOrphaned}
                loading={cleaningUp}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Cleanup Orphaned Data
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const studentPercent = (school.active_students / school.student_limit) * 100
  const userPercent = (school.admin_users / school.admin_user_limit) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{school.name}</h1>
            <p className="text-muted-foreground">School Code: {school.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getPlanBadgeColor(school.plan_type)}>
            {getPlanDisplayName(school.plan_type)}
          </Badge>
          <Badge variant={school.is_active ? 'success' : 'danger'}>
            {school.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Link href={`/super-admin/schools/${school.id}/plan`}>
            <Button size="sm" icon={<Edit className="h-4 w-4" />}>
              Edit Plan
            </Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            icon={<Trash2 className="h-4 w-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Delete School
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deleteInfo ? (
                <>
                  <p className="text-gray-700">
                    This school has the following data that will be permanently deleted:
                  </p>
                  <div className="bg-red-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Students</span>
                      <span className="font-medium">{deleteInfo.studentsCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staff Members</span>
                      <span className="font-medium">{deleteInfo.staffCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Users</span>
                      <span className="font-medium">{deleteInfo.usersCount || 0}</span>
                    </div>
                  </div>
                  <p className="text-red-600 font-medium">
                    This action cannot be undone!
                  </p>
                </>
              ) : (
                <p className="text-gray-700">
                  Are you sure you want to delete <strong>{school.name}</strong>? This will remove
                  all associated data including students, staff, fees, and attendance records.
                </p>
              )}

              {deleteError && (
                <p className="text-red-600 text-sm">{deleteError}</p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteInfo(null)
                    setDeleteError(null)
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(!!deleteInfo)}
                  loading={deleting}
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  {deleteInfo ? 'Delete All Data' : 'Delete School'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* School Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            School Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="text-gray-900">{school.address || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900 flex items-center gap-2">
                {school.email ? (
                  <>
                    <Mail className="h-4 w-4 text-gray-400" />
                    {school.email}
                  </>
                ) : (
                  'N/A'
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900 flex items-center gap-2">
                {school.phone ? (
                  <>
                    <Phone className="h-4 w-4 text-gray-400" />
                    {school.phone}
                  </>
                ) : (
                  'N/A'
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Plan Period</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                {new Date(school.plan_start_date).toLocaleDateString()}
                {school.plan_end_date && ` - ${new Date(school.plan_end_date).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{school.active_students}</div>
            <p className="text-xs text-muted-foreground">
              {school.active_students} / {school.student_limit} ({studentPercent.toFixed(0)}%)
            </p>
            <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  studentPercent >= 90 ? 'bg-red-500' : studentPercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(studentPercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{school.admin_users}</div>
            <p className="text-xs text-muted-foreground">
              {school.admin_users} / {school.admin_user_limit} ({userPercent.toFixed(0)}%)
            </p>
            <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  userPercent >= 90 ? 'bg-red-500' : userPercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(userPercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{school.total_teachers}</div>
            <p className="text-xs text-muted-foreground">Total teaching staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{school.total_fees_collected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Plan & Billing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Current Plan</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {getPlanDisplayName(school.plan_type)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Student Limit</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {school.student_limit === 999999 ? 'Unlimited' : school.student_limit}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Admin User Limit</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {school.admin_user_limit === 999999 ? 'Unlimited' : school.admin_user_limit}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
