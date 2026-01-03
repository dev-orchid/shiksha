'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  Download,
  IndianRupee,
  TrendingUp,
  Users,
  BarChart3,
} from 'lucide-react'

interface SalaryStats {
  totalPaid: number
  totalPending: number
  averageSalary: number
  totalStaff: number
  monthlyTrend: Array<{ month: string; amount: number }>
  departmentWise: Array<{ department: string; total: number; count: number }>
}

export default function SalaryReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SalaryStats | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchReports()
  }, [selectedYear])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/salary/reports?year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch {
      console.error('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const response = await fetch(`/api/salary/reports/export?year=${selectedYear}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `salary_report_${selectedYear}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch {
      console.error('Failed to export report')
    }
  }

  // Mock data for display
  const mockStats: SalaryStats = {
    totalPaid: 4850000,
    totalPending: 485000,
    averageSalary: 45000,
    totalStaff: 56,
    monthlyTrend: [
      { month: 'Jan', amount: 450000 },
      { month: 'Feb', amount: 455000 },
      { month: 'Mar', amount: 460000 },
      { month: 'Apr', amount: 458000 },
      { month: 'May', amount: 465000 },
      { month: 'Jun', amount: 470000 },
      { month: 'Jul', amount: 475000 },
      { month: 'Aug', amount: 480000 },
      { month: 'Sep', amount: 482000 },
      { month: 'Oct', amount: 485000 },
      { month: 'Nov', amount: 485000 },
      { month: 'Dec', amount: 485000 },
    ],
    departmentWise: [
      { department: 'Science', total: 1200000, count: 12 },
      { department: 'Mathematics', total: 1000000, count: 10 },
      { department: 'Languages', total: 800000, count: 8 },
      { department: 'Social Studies', total: 600000, count: 6 },
      { department: 'Admin', total: 750000, count: 8 },
      { department: 'Support', total: 500000, count: 12 },
    ],
  }

  const displayStats = stats || mockStats
  const maxMonthly = Math.max(...displayStats.monthlyTrend.map((m) => m.amount))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/salary">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salary Reports</h1>
            <p className="text-gray-500">View salary disbursement analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            options={Array.from({ length: 5 }, (_, i) => ({
              value: String(new Date().getFullYear() - 2 + i),
              label: String(new Date().getFullYear() - 2 + i),
            }))}
            className="w-32"
          />
          <Button onClick={exportReport} icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Paid (YTD)</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{displayStats.totalPaid.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ₹{displayStats.totalPending.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Salary</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{displayStats.averageSalary.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-2xl font-bold text-purple-600">{displayStats.totalStaff}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Salary Disbursement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="flex items-end justify-between h-48 gap-2">
                {displayStats.monthlyTrend.map((item) => (
                  <div key={item.month} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-green-500 rounded-t transition-all"
                      style={{ height: `${(item.amount / maxMonthly) * 100}%` }}
                    />
                    <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Wise */}
        <Card>
          <CardHeader>
            <CardTitle>Department Wise Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayStats.departmentWise.map((item) => (
                <div key={item.department}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.department}</span>
                    <span className="text-sm text-gray-500">{item.count} staff</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{
                          width: `${(item.total / displayStats.totalPaid) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-24 text-right">
                      ₹{(item.total / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
