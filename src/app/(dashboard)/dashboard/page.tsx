import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Users,
  GraduationCap,
  IndianRupee,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { getStudentLimitWarning, getAdminUserLimitWarning } from '@/lib/utils/plan-features'
import type { PlanType } from '@/lib/constants/plans'
import Link from 'next/link'

export const metadata = {
  title: 'Dashboard | School Management System',
}

async function getSchoolPlanInfo(schoolId: string) {
  const supabase = await createClient()

  // Fetch school plan information
  const { data: school } = await supabase
    .from('schools')
    .select('plan_type, student_limit, admin_user_limit')
    .eq('id', schoolId)
    .single()

  if (!school) {
    return null
  }

  // Fetch current usage
  const { data: usageData } = await supabase
    .rpc('get_school_current_usage', { p_school_id: schoolId })
    .single()

  return {
    planType: school.plan_type as PlanType,
    studentLimit: school.student_limit,
    adminUserLimit: school.admin_user_limit,
    currentStudents: usageData?.active_students || 0,
    currentAdminUsers: usageData?.admin_users || 0,
  }
}

async function getDashboardStats(schoolId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = new Date()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0]

  // Previous month for comparison
  const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
  const firstDayPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1).toISOString().split('T')[0]
  const lastDayPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).toISOString().split('T')[0]

  // Fetch all stats in parallel - filtered by school_id for multi-tenancy
  const [
    studentsResult,
    prevStudentsResult,
    teachersResult,
    prevTeachersResult,
    paymentsResult,
    prevPaymentsResult,
    todayAttendanceResult,
    totalStudentsForAttendance,
    recentActivityResult,
    upcomingEventsResult,
  ] = await Promise.all([
    // Current students count
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    // Previous month students (approximate by created_at)
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active').lt('created_at', firstDayOfMonth),
    // Current teachers count
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('employee_type', 'teaching').eq('status', 'active'),
    // Previous month teachers
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('employee_type', 'teaching').eq('status', 'active').lt('created_at', firstDayOfMonth),
    // This month's fee collection
    supabase.from('fee_payments').select('amount, fee_invoices!inner(students!inner(school_id))').eq('fee_invoices.students.school_id', schoolId).gte('payment_date', firstDayOfMonth).lte('payment_date', lastDayOfMonth),
    // Previous month's fee collection
    supabase.from('fee_payments').select('amount, fee_invoices!inner(students!inner(school_id))').eq('fee_invoices.students.school_id', schoolId).gte('payment_date', firstDayPrevMonth).lte('payment_date', lastDayPrevMonth),
    // Today's attendance (present students)
    supabase.from('student_attendance').select('id, students!inner(school_id)', { count: 'exact', head: true }).eq('students.school_id', schoolId).eq('date', today).in('status', ['present', 'late']),
    // Total students for attendance calculation
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    // Recent activity - last 5 fee payments for this school
    supabase.from('fee_payments').select(`
      id,
      amount,
      payment_date,
      created_at,
      fee_invoices!inner (
        students!inner (
          first_name,
          last_name,
          school_id
        )
      )
    `).eq('fee_invoices.students.school_id', schoolId).order('created_at', { ascending: false }).limit(5),
    // Upcoming events for this school
    supabase.from('events').select(`
      id,
      title,
      start_date,
      event_types (id, name, color)
    `).eq('school_id', schoolId).eq('is_active', true).gte('start_date', today).order('start_date', { ascending: true }).limit(6),
  ])

  // Calculate values
  const totalStudents = studentsResult.count || 0
  const prevTotalStudents = prevStudentsResult.count || 0
  const studentChange = prevTotalStudents > 0
    ? Math.round(((totalStudents - prevTotalStudents) / prevTotalStudents) * 100)
    : 0

  const totalTeachers = teachersResult.count || 0
  const prevTotalTeachers = prevTeachersResult.count || 0
  const teacherChange = prevTotalTeachers > 0
    ? Math.round(((totalTeachers - prevTotalTeachers) / prevTotalTeachers) * 100)
    : 0

  const thisMonthCollection = (paymentsResult.data as { amount: number }[] | null)?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const prevMonthCollection = (prevPaymentsResult.data as { amount: number }[] | null)?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const feeChange = prevMonthCollection > 0
    ? Math.round(((thisMonthCollection - prevMonthCollection) / prevMonthCollection) * 100)
    : 0

  const presentToday = todayAttendanceResult.count || 0
  const totalForAttendance = totalStudentsForAttendance.count || 1
  const attendancePercentage = totalForAttendance > 0
    ? Math.round((presentToday / totalForAttendance) * 100)
    : 0

  return {
    totalStudents,
    studentChange,
    totalTeachers,
    teacherChange,
    thisMonthCollection,
    feeChange,
    attendancePercentage,
    recentActivity: recentActivityResult.data || [],
    upcomingEvents: upcomingEventsResult.data || [],
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)}K`
  }
  return `₹${amount.toLocaleString('en-IN')}`
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-IN')
}

export default async function DashboardPage() {
  const authUser = await getAuthenticatedUserSchool()

  if (!authUser) {
    redirect('/login')
  }

  // Redirect super admins to their dedicated dashboard
  if (authUser.role === 'super_admin' && !authUser.schoolId) {
    redirect('/super-admin')
  }

  // At this point, we know the user has a schoolId
  if (!authUser.schoolId) {
    redirect('/login')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get display name from user metadata, fall back to email prefix
  const displayName = user?.user_metadata?.display_name
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'User'

  const dashboardData = await getDashboardStats(authUser.schoolId)
  const planInfo = await getSchoolPlanInfo(authUser.schoolId)

  // Get usage warnings
  const studentWarning = planInfo
    ? getStudentLimitWarning(
        planInfo.planType,
        planInfo.currentStudents,
        planInfo.studentLimit
      )
    : null

  const adminUserWarning = planInfo
    ? getAdminUserLimitWarning(
        planInfo.planType,
        planInfo.currentAdminUsers,
        planInfo.adminUserLimit
      )
    : null

  const stats = [
    {
      title: 'Total Students',
      value: dashboardData.totalStudents.toLocaleString('en-IN'),
      change: dashboardData.studentChange,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Teachers',
      value: dashboardData.totalTeachers.toString(),
      change: dashboardData.teacherChange,
      icon: GraduationCap,
      color: 'bg-green-500',
    },
    {
      title: 'Fee Collection',
      value: formatCurrency(dashboardData.thisMonthCollection),
      change: dashboardData.feeChange,
      icon: IndianRupee,
      color: 'bg-yellow-500',
    },
    {
      title: 'Today\'s Attendance',
      value: `${dashboardData.attendancePercentage}%`,
      change: 0,
      icon: UserCheck,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {displayName}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening at your school today.
        </p>
      </div>

      {/* Usage Warnings */}
      {(studentWarning || adminUserWarning) && (
        <div className="space-y-3">
          {studentWarning && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                studentWarning.severity === 'error'
                  ? 'bg-red-50 border-red-200'
                  : studentWarning.severity === 'critical'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              {studentWarning.severity === 'error' || studentWarning.severity === 'critical' ? (
                <AlertCircle
                  className={`h-5 w-5 mt-0.5 ${
                    studentWarning.severity === 'error'
                      ? 'text-red-600'
                      : 'text-orange-600'
                  }`}
                />
              ) : (
                <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-600" />
              )}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    studentWarning.severity === 'error'
                      ? 'text-red-800'
                      : studentWarning.severity === 'critical'
                      ? 'text-orange-800'
                      : 'text-yellow-800'
                  }`}
                >
                  {studentWarning.message}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    studentWarning.severity === 'error'
                      ? 'text-red-700'
                      : studentWarning.severity === 'critical'
                      ? 'text-orange-700'
                      : 'text-yellow-700'
                  }`}
                >
                  Current: {planInfo?.currentStudents} / Limit: {planInfo?.studentLimit}
                </p>
              </div>
              <Link
                href="/settings/plan"
                className={`text-sm font-medium underline ${
                  studentWarning.severity === 'error'
                    ? 'text-red-700 hover:text-red-800'
                    : studentWarning.severity === 'critical'
                    ? 'text-orange-700 hover:text-orange-800'
                    : 'text-yellow-700 hover:text-yellow-800'
                }`}
              >
                Upgrade Plan
              </Link>
            </div>
          )}
          {adminUserWarning && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                adminUserWarning.severity === 'error'
                  ? 'bg-red-50 border-red-200'
                  : adminUserWarning.severity === 'critical'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              {adminUserWarning.severity === 'error' || adminUserWarning.severity === 'critical' ? (
                <AlertCircle
                  className={`h-5 w-5 mt-0.5 ${
                    adminUserWarning.severity === 'error'
                      ? 'text-red-600'
                      : 'text-orange-600'
                  }`}
                />
              ) : (
                <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-600" />
              )}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    adminUserWarning.severity === 'error'
                      ? 'text-red-800'
                      : adminUserWarning.severity === 'critical'
                      ? 'text-orange-800'
                      : 'text-yellow-800'
                  }`}
                >
                  {adminUserWarning.message}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    adminUserWarning.severity === 'error'
                      ? 'text-red-700'
                      : adminUserWarning.severity === 'critical'
                      ? 'text-orange-700'
                      : 'text-yellow-700'
                  }`}
                >
                  Current: {planInfo?.currentAdminUsers} / Limit: {planInfo?.adminUserLimit}
                </p>
              </div>
              <Link
                href="/settings/plan"
                className={`text-sm font-medium underline ${
                  adminUserWarning.severity === 'error'
                    ? 'text-red-700 hover:text-red-800'
                    : adminUserWarning.severity === 'critical'
                    ? 'text-orange-700 hover:text-orange-800'
                    : 'text-yellow-700 hover:text-yellow-800'
                }`}
              >
                Upgrade Plan
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  {stat.change !== 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {stat.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`text-xs ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change > 0 ? '+' : ''}{stat.change}%
                      </span>
                      <span className="text-xs text-gray-500">vs last month</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/attendance/students"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <UserCheck className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Mark Attendance</span>
              </a>
              <a
                href="/fees"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <IndianRupee className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Collect Fees</span>
              </a>
              <a
                href="/students/new"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Add Student</span>
              </a>
              <a
                href="/whatsapp/send"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Send Notice</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity: any) => {
                  const studentName = activity.fee_invoices?.students
                    ? `${activity.fee_invoices.students.first_name} ${activity.fee_invoices.students.last_name}`
                    : 'Unknown'
                  const timeAgo = getTimeAgo(new Date(activity.created_at))
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Fee payment: {formatCurrency(activity.amount)}
                        </p>
                        <p className="text-xs text-gray-500">from {studentName}</p>
                      </div>
                      <span className="text-xs text-gray-400">{timeAgo}</span>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Events</CardTitle>
          <a href="/events" className="text-sm text-primary hover:underline">
            View all
          </a>
        </CardHeader>
        <CardContent>
          {dashboardData.upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardData.upcomingEvents.map((event: any) => (
                <a
                  key={event.id}
                  href={`/events/${event.id}/edit`}
                  className="p-4 rounded-lg border border-gray-200 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: event.event_types?.color || '#3b82f6',
                        color: 'white',
                      }}
                    >
                      {event.event_types?.name || 'Event'}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(event.start_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No upcoming events</p>
              <a
                href="/events/new"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                Create your first event
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
