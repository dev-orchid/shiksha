'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// Mock data
const children = [
  { value: '1', label: 'Rahul Kumar - Class 10-A' },
  { value: '2', label: 'Priya Kumar - Class 7-B' },
]

const months = [
  { value: '2024-12', label: 'December 2024' },
  { value: '2024-11', label: 'November 2024' },
  { value: '2024-10', label: 'October 2024' },
  { value: '2024-09', label: 'September 2024' },
]

const attendanceData = {
  summary: {
    totalDays: 150,
    present: 142,
    absent: 5,
    late: 3,
    percentage: 94.67,
  },
  monthly: {
    '2024-12': {
      totalDays: 22,
      present: 20,
      absent: 1,
      late: 1,
      days: [
        { date: 1, day: 'Sun', status: 'holiday' },
        { date: 2, day: 'Mon', status: 'present' },
        { date: 3, day: 'Tue', status: 'present' },
        { date: 4, day: 'Wed', status: 'present' },
        { date: 5, day: 'Thu', status: 'late', time: '8:45 AM' },
        { date: 6, day: 'Fri', status: 'present' },
        { date: 7, day: 'Sat', status: 'holiday' },
        { date: 8, day: 'Sun', status: 'holiday' },
        { date: 9, day: 'Mon', status: 'present' },
        { date: 10, day: 'Tue', status: 'present' },
        { date: 11, day: 'Wed', status: 'present' },
        { date: 12, day: 'Thu', status: 'absent', reason: 'Sick Leave' },
        { date: 13, day: 'Fri', status: 'present' },
        { date: 14, day: 'Sat', status: 'holiday' },
        { date: 15, day: 'Sun', status: 'holiday' },
        { date: 16, day: 'Mon', status: 'present' },
        { date: 17, day: 'Tue', status: 'present' },
        { date: 18, day: 'Wed', status: 'present' },
        { date: 19, day: 'Thu', status: 'present' },
        { date: 20, day: 'Fri', status: 'present' },
        { date: 21, day: 'Sat', status: 'holiday' },
        { date: 22, day: 'Sun', status: 'holiday' },
        { date: 23, day: 'Mon', status: 'present' },
        { date: 24, day: 'Tue', status: 'present' },
        { date: 25, day: 'Wed', status: 'holiday', note: 'Christmas' },
        { date: 26, day: 'Thu', status: 'present' },
        { date: 27, day: 'Fri', status: 'present' },
        { date: 28, day: 'Sat', status: 'holiday' },
        { date: 29, day: 'Sun', status: 'holiday' },
        { date: 30, day: 'Mon', status: 'present' },
        { date: 31, day: 'Tue', status: 'present' },
      ],
    },
  },
  recentAbsences: [
    { date: '2024-12-12', reason: 'Sick Leave', status: 'approved' },
    { date: '2024-11-28', reason: 'Family Function', status: 'approved' },
    { date: '2024-11-15', reason: 'Medical Appointment', status: 'approved' },
    { date: '2024-10-25', reason: 'Not Feeling Well', status: 'approved' },
    { date: '2024-10-10', reason: 'Family Emergency', status: 'approved' },
  ],
}

export default function ParentAttendancePage() {
  const searchParams = useSearchParams()
  const childParam = searchParams.get('child')
  const [selectedChild, setSelectedChild] = useState(childParam || '1')
  const [selectedMonth, setSelectedMonth] = useState('2024-12')

  const monthData = attendanceData.monthly['2024-12']

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'holiday':
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
      case 'holiday':
        return 'bg-gray-100 text-gray-500 border-gray-200'
      default:
        return 'bg-gray-50'
    }
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
            <Select
              label="Select Child"
              options={children}
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="sm:w-64"
            />
            <Select
              label="Select Month"
              options={months}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="sm:w-64"
            />
          </div>

          {/* Overall Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {attendanceData.summary.percentage}%
                </p>
                <p className="text-xs text-gray-500">Overall Attendance</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {attendanceData.summary.totalDays}
                </p>
                <p className="text-xs text-gray-500">Total Working Days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {attendanceData.summary.present}
                </p>
                <p className="text-xs text-gray-500">Days Present</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{attendanceData.summary.absent}</p>
                <p className="text-xs text-gray-500">Days Absent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{attendanceData.summary.late}</p>
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
                    <CardTitle>December 2024</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Present: {monthData.present} | Absent: {monthData.absent} | Late:{' '}
                    {monthData.late}
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
                    {monthData.days.map((dayData, index) => (
                      <div
                        key={index}
                        className={`aspect-square flex flex-col items-center justify-center rounded-lg border ${getStatusColor(
                          dayData.status
                        )} ${dayData.status === 'holiday' ? 'opacity-60' : ''}`}
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
                      <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded" />
                      <span className="text-sm text-gray-600">Holiday</span>
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
                          {((monthData.present / monthData.totalDays) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 rounded-full h-2"
                          style={{
                            width: `${(monthData.present / monthData.totalDays) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-green-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-green-600">{monthData.present}</p>
                        <p className="text-xs text-gray-500">Present</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-red-600">{monthData.absent}</p>
                        <p className="text-xs text-gray-500">Absent</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-yellow-600">{monthData.late}</p>
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
                  <div className="divide-y divide-gray-200">
                    {attendanceData.recentAbsences.map((absence, index) => (
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
                            variant={absence.status === 'approved' ? 'success' : 'warning'}
                            className="text-xs"
                          >
                            {absence.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
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
        </div>
      </main>
    </div>
  )
}
