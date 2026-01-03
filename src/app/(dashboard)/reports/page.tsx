'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import {
  FileText,
  Users,
  GraduationCap,
  IndianRupee,
  Calendar,
  Download,
  TrendingUp,
  BarChart3,
} from 'lucide-react'

const reportCategories = [
  {
    title: 'Attendance Reports',
    description: 'Student and staff attendance summaries',
    icon: Calendar,
    href: '/reports/attendance',
    color: 'bg-blue-100 text-blue-600',
    stats: '15 reports',
  },
  {
    title: 'Academic Reports',
    description: 'Exam results, report cards, and progress reports',
    icon: GraduationCap,
    href: '/reports/academic',
    color: 'bg-green-100 text-green-600',
    stats: '12 reports',
  },
  {
    title: 'Fee Reports',
    description: 'Fee collection, dues, and financial summaries',
    icon: IndianRupee,
    href: '/reports/fees',
    color: 'bg-yellow-100 text-yellow-600',
    stats: '10 reports',
  },
  {
    title: 'Student Reports',
    description: 'Student profiles, enrollment, and demographics',
    icon: Users,
    href: '/reports/students',
    color: 'bg-purple-100 text-purple-600',
    stats: '8 reports',
  },
]

const recentReports = [
  {
    name: 'Monthly Attendance Report - December 2024',
    type: 'Attendance',
    generatedAt: '2024-12-30 10:30 AM',
    generatedBy: 'Admin',
  },
  {
    name: 'Fee Collection Summary - December 2024',
    type: 'Fees',
    generatedAt: '2024-12-29 04:15 PM',
    generatedBy: 'Accountant',
  },
  {
    name: 'Class 10 Half Yearly Results',
    type: 'Academic',
    generatedAt: '2024-12-28 11:00 AM',
    generatedBy: 'Principal',
  },
  {
    name: 'Staff Attendance Report - November 2024',
    type: 'Attendance',
    generatedAt: '2024-12-01 09:00 AM',
    generatedBy: 'Admin',
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Generate and download various reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-xs text-gray-500">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Download className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">128</p>
                <p className="text-xs text-gray-500">Downloads This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">15</p>
                <p className="text-xs text-gray-500">Generated Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-xs text-gray-500">Report Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((category) => (
          <Link key={category.title} href={category.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                    <p className="text-xs text-primary mt-2 font-medium">{category.stats}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Generated Reports</CardTitle>
          <CardDescription>Reports generated in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {recentReports.map((report, index) => (
              <div
                key={index}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-500">
                      {report.type} • Generated by {report.generatedBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{report.generatedAt}</span>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Download className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
