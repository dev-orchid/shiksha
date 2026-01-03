'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import {
  ArrowLeft,
  Download,
  Calendar,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  BarChart3,
  Loader2,
} from 'lucide-react'

interface AttendanceStats {
  totalStudents?: number
  totalStaff?: number
  presentToday: number
  absentToday: number
  attendanceRate: number
}

interface ClassWise {
  className: string
  present: number
  absent: number
  late: number
  total: number
}

interface DepartmentWise {
  name: string
  present: number
  absent: number
  late: number
  total: number
}

interface ClassOption {
  id: string
  name: string
}

export default function AttendanceReportsPage() {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
  })
  const [classWise, setClassWise] = useState<ClassWise[]>([])
  const [departmentWise, setDepartmentWise] = useState<DepartmentWise[]>([])
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })
  const [selectedClass, setSelectedClass] = useState('')
  const [reportType, setReportType] = useState('student')

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchData()
  }, [dateRange, selectedClass, reportType])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.data || [])
      }
    } catch {
      console.error('Failed to fetch classes')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        type: reportType,
      })
      if (selectedClass) {
        params.append('class_id', selectedClass)
      }

      const response = await fetch(`/api/attendance/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || {
          totalStudents: 0,
          totalStaff: 0,
          presentToday: 0,
          absentToday: 0,
          attendanceRate: 0,
        })
        setClassWise(data.classWise || [])
        setDepartmentWise(data.departmentWise || [])
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        type: reportType,
      })
      if (selectedClass) {
        params.append('class_id', selectedClass)
      }

      const response = await fetch(`/api/attendance/reports/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}_attendance_${dateRange.startDate}_${dateRange.endDate}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download report:', error)
    } finally {
      setExporting(false)
    }
  }

  const totalCount = reportType === 'staff' ? stats.totalStaff : stats.totalStudents

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/attendance/students">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
            <p className="text-gray-500">View and analyze attendance data</p>
          </div>
        </div>
        <Button
          onClick={downloadReport}
          disabled={exporting}
          icon={exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        >
          {exporting ? 'Exporting...' : 'Export Report'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={[
                { value: 'student', label: 'Student Attendance' },
                { value: 'staff', label: 'Staff Attendance' },
              ]}
            />
            <Input
              label="Start Date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
            {reportType === 'student' && (
              <Select
                label="Class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={[
                  { value: '', label: 'All Classes' },
                  ...classes.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total {reportType === 'staff' ? 'Staff' : 'Students'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{totalCount || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentToday || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Absent Today</p>
                <p className="text-2xl font-bold text-red-600">{stats.absentToday || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.attendanceRate || 0}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class/Department-wise Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {reportType === 'staff' ? 'Department-wise' : 'Class-wise'} Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (reportType === 'staff' ? departmentWise : classWise).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No attendance data available for selected filters</p>
              <p className="text-sm mt-2">Mark attendance first to see reports</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {reportType === 'staff' ? 'Department' : 'Class'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Records
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Late
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Attendance Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(reportType === 'staff' ? departmentWise : classWise).map((item, index) => {
                    const name = 'className' in item ? item.className : item.name
                    const rate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {item.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                          {item.present}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                          {item.absent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-yellow-600 font-medium">
                          {item.late}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-24">
                              <div
                                className="h-2 bg-green-500 rounded-full"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
