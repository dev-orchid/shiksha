'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  Download,
  Users,
  UserPlus,
  UserMinus,
  GraduationCap,
} from 'lucide-react'

export default function StudentReportPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">Student Reports</h1>
            <p className="text-gray-500">Student enrollment and demographics</p>
          </div>
        </div>
        <Button icon={<Download className="h-4 w-4" />}>
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">1,234</p>
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
                <p className="text-sm text-gray-500">New Admissions</p>
                <p className="text-2xl font-bold text-green-600">156</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Transfers</p>
                <p className="text-2xl font-bold text-red-600">23</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <UserMinus className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Graduated</p>
                <p className="text-2xl font-bold text-purple-600">98</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Class-wise Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { class: 'Class 10', students: 180, sections: 4 },
                { class: 'Class 9', students: 175, sections: 4 },
                { class: 'Class 8', students: 168, sections: 4 },
                { class: 'Class 7', students: 156, sections: 3 },
                { class: 'Class 6', students: 148, sections: 3 },
                { class: 'Class 5', students: 140, sections: 3 },
              ].map((item) => (
                <div key={item.class} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.class}</p>
                    <p className="text-sm text-gray-500">{item.sections} Sections</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{item.students}</p>
                    <p className="text-xs text-gray-500">students</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-blue-600">54%</span>
                  </div>
                  <p className="font-medium">Male</p>
                  <p className="text-sm text-gray-500">666 students</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-pink-600">46%</span>
                  </div>
                  <p className="font-medium">Female</p>
                  <p className="text-sm text-gray-500">568 students</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Category Distribution</h4>
                <div className="space-y-2">
                  {[
                    { category: 'General', count: 520, percentage: 42 },
                    { category: 'OBC', count: 370, percentage: 30 },
                    { category: 'SC', count: 222, percentage: 18 },
                    { category: 'ST', count: 122, percentage: 10 },
                  ].map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <span className="text-sm">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-primary rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-16 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admission Trend (This Year)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfers Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { month: 'April', admissions: 45, transfers: 5 },
                  { month: 'May', admissions: 32, transfers: 3 },
                  { month: 'June', admissions: 28, transfers: 4 },
                  { month: 'July', admissions: 15, transfers: 2 },
                  { month: 'August', admissions: 12, transfers: 3 },
                  { month: 'September', admissions: 8, transfers: 2 },
                ].map((row) => (
                  <tr key={row.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{row.month}</td>
                    <td className="px-6 py-4 text-green-600">+{row.admissions}</td>
                    <td className="px-6 py-4 text-red-600">-{row.transfers}</td>
                    <td className="px-6 py-4">
                      <Badge variant={row.admissions - row.transfers > 0 ? 'success' : 'danger'}>
                        {row.admissions - row.transfers > 0 ? '+' : ''}{row.admissions - row.transfers}
                      </Badge>
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
