'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

interface Child {
  id: string
  name: string
  class: string
  section: string
}

interface DayData {
  date: number
  day: string
  status: string
  time?: string
  reason?: string
}

interface AttendanceData {
  children: Child[]
  selectedStudent: string
  month: number
  year: number
  summary: {
    totalDays: number
    present: number
    absent: number
    late: number
    halfDay: number
    leave: number
    percentage: number
  }
  monthly: {
    totalDays: number
    present: number
    absent: number
    late: number
    halfDay: number
    leave: number
    percentage: number
    days: DayData[]
  }
  recentAbsences: Array<{
    date: string
    reason: string
    status: string
  }>
}

export default function ParentAttendancePage() {
  const searchParams = useSearchParams()
  const childParam = searchParams.get('child')

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AttendanceData | null>(null)
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Generate month options
  const getMonthOptions = () => {
    const options: Array<{ value: string; label: string }> = []
    const now = new Date()

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      options.push({ value: monthValue, label: monthLabel })
    }

    return options
  }

  const monthOptions = getMonthOptions()

  // Fetch attendance data
  const fetchAttendance = useCallback(async (studentId?: string, month?: number, year?: number) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (studentId) params.set('student_id', studentId)
      if (month) params.set('month', (month - 1).toString()) // API expects 0-indexed
      if (year) params.set('year', year.toString())

      const response = await fetch(`/api/parent/attendance?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)

        // Set selected child if not set
        if (!selectedChild && result.children?.length > 0) {
          const childId = childParam || result.selectedStudent || result.children[0].id
          setSelectedChild(childId)
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }, [childParam, selectedChild])

  // Initial load
  useEffect(() => {
    fetchAttendance(childParam || undefined, selectedMonth, selectedYear)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when child or month changes
  useEffect(() => {
    if (selectedChild) {
      fetchAttendance(selectedChild, selectedMonth, selectedYear)
    }
  }, [selectedChild, selectedMonth, selectedYear]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-')
    setSelectedYear(parseInt(year))
    setSelectedMonth(parseInt(month))
  }

  const handlePrevMonth = () => {
    let newMonth = selectedMonth - 1
    let newYear = selectedYear
    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }
    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }

  const handleNextMonth = () => {
    const now = new Date()
    let newMonth = selectedMonth + 1
    let newYear = selectedYear

    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }

    // Don't go past current month
    if (newYear > now.getFullYear() || (newYear === now.getFullYear() && newMonth > now.getMonth() + 1)) {
      return
    }

    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'half_day':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'leave':
        return <span className="text-blue-500 text-xs font-medium">L</span>
      case 'holiday':
      case 'future':
      case 'no_record':
        return <span className="text-gray-400 text-xs">-</span>
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'half_day':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'leave':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'holiday':
        return 'bg-gray-100 text-gray-500 border-gray-200'
      case 'future':
      case 'no_record':
        return 'bg-gray-50 text-gray-400 border-gray-200'
      default:
        return 'bg-gray-50'
    }
  }

  const childOptions = (data?.children || []).map(c => ({
    value: c.id,
    label: `${c.name} - ${c.class}${c.section ? `-${c.section}` : ''}`,
  }))

  const currentMonthValue = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  })

  // Calculate first day offset for calendar grid
  const firstDayOffset = data?.monthly?.days?.[0]
    ? new Date(selectedYear, selectedMonth - 1, 1).getDay()
    : 0

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/parent">
                <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="font-semibold text-gray-900">Attendance Record</h1>
                <p className="text-xs text-gray-500">View attendance history</p>
              </div>
            </div>
            <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>
              Download Report
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {childOptions.length > 0 && (
              <Select
                label="Select Child"
                options={childOptions}
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="sm:w-64"
              />
            )}
            <Select
              label="Select Month"
              options={monthOptions}
              value={currentMonthValue}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="sm:w-64"
            />
          </div>

          {!data || data.children.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <p>No children linked to your account.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Overall Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {data.summary.percentage}%
                    </p>
                    <p className="text-xs text-gray-500">Overall Attendance</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-gray-900">
                      {data.summary.totalDays}
                    </p>
                    <p className="text-xs text-gray-500">Total Working Days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {data.summary.present}
                    </p>
                    <p className="text-xs text-gray-500">Days Present</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-red-600">{data.summary.absent}</p>
                    <p className="text-xs text-gray-500">Days Absent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-yellow-600">{data.summary.late}</p>
                    <p className="text-xs text-gray-500">Late Arrivals</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar View */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{monthName}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        Present: {data.monthly.present} | Absent: {data.monthly.absent} | Late: {data.monthly.late}
                        {data.monthly.leave > 0 && ` | Leave: ${data.monthly.leave}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div
                            key={day}
                            className="text-center text-xs font-medium text-gray-500 py-2"
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {/* Empty cells for days before first of month */}
                        {Array.from({ length: firstDayOffset }).map((_, index) => (
                          <div key={`empty-${index}`} className="aspect-square" />
                        ))}
                        {/* Actual days */}
                        {(data.monthly.days || []).map((dayData, index) => (
                          <div
                            key={index}
                            className={`aspect-square flex flex-col items-center justify-center rounded-lg border ${getStatusColor(
                              dayData.status
                            )} ${dayData.status === 'holiday' || dayData.status === 'future' ? 'opacity-60' : ''}`}
                            title={dayData.reason || dayData.time || undefined}
                          >
                            <span className="text-sm font-medium">{dayData.date}</span>
                            {getStatusIcon(dayData.status)}
                          </div>
                        ))}
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded" />
                          <span className="text-sm text-gray-600">Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded" />
                          <span className="text-sm text-gray-600">Absent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded" />
                          <span className="text-sm text-gray-600">Late</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded" />
                          <span className="text-sm text-gray-600">Leave</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded" />
                          <span className="text-sm text-gray-600">Holiday/No Record</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Monthly Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Attendance Rate</span>
                            <span className="font-medium">
                              {data.monthly.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 rounded-full h-2"
                              style={{
                                width: `${data.monthly.percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-green-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-green-600">{data.monthly.present}</p>
                            <p className="text-xs text-gray-500">Present</p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-red-600">{data.monthly.absent}</p>
                            <p className="text-xs text-gray-500">Absent</p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-yellow-600">{data.monthly.late}</p>
                            <p className="text-xs text-gray-500">Late</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Absences */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Absences</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {data.recentAbsences.length === 0 ? (
                        <div className="px-6 py-4 text-center text-gray-500 text-sm">
                          No recent absences
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {data.recentAbsences.map((absence, index) => (
                            <div key={index} className="px-6 py-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {new Date(absence.date).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </p>
                                  <p className="text-xs text-gray-500">{absence.reason}</p>
                                </div>
                                <Badge
                                  variant="default"
                                  className="text-xs"
                                >
                                  {absence.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Apply Leave */}
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm text-gray-600 mb-4">
                        Need to inform the school about an absence?
                      </p>
                      <Button className="w-full">Apply for Leave</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
