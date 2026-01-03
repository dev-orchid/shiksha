'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import {
  ArrowLeft,
  Download,
  UserCheck,
  UserX,
  TrendingUp,
  Calendar,
} from 'lucide-react'

export default function AttendanceReportPage() {
  const [reportType, setReportType] = useState('class')
  const [selectedClass, setSelectedClass] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const exportReport = () => {
    // Export logic
    alert('Export functionality will be implemented')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
            <p className="text-gray-500">View and analyze attendance data</p>
          </div>
        </div>
        <Button onClick={exportReport} icon={<Download className="h-4 w-4" />}>
          Export Report
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={[
                { value: 'class', label: 'Class-wise' },
                { value: 'student', label: 'Student-wise' },
                { value: 'daily', label: 'Daily' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
            <Select
              label="Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                { value: 'class-10', label: 'Class 10' },
                { value: 'class-9', label: 'Class 9' },
                { value: 'class-8', label: 'Class 8' },
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
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Attendance</p>
                <p className="text-2xl font-bold text-green-600">92%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Present</p>
                <p className="text-2xl font-bold text-blue-600">45,230</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Absent</p>
                <p className="text-2xl font-bold text-red-600">3,920</p>
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
                <p className="text-sm text-gray-500">Working Days</p>
                <p className="text-2xl font-bold text-purple-600">42</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class-wise Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { class: 'Class 10 A', students: 45, present: 43, absent: 2, rate: 95.6 },
                  { class: 'Class 10 B', students: 44, present: 40, absent: 4, rate: 90.9 },
                  { class: 'Class 9 A', students: 48, present: 46, absent: 2, rate: 95.8 },
                  { class: 'Class 9 B', students: 46, present: 42, absent: 4, rate: 91.3 },
                  { class: 'Class 8 A', students: 50, present: 47, absent: 3, rate: 94.0 },
                ].map((row) => (
                  <tr key={row.class} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{row.class}</td>
                    <td className="px-6 py-4">{row.students}</td>
                    <td className="px-6 py-4 text-green-600">{row.present}</td>
                    <td className="px-6 py-4 text-red-600">{row.absent}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${row.rate}%` }}
                          />
                        </div>
                        <span className="text-sm">{row.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
