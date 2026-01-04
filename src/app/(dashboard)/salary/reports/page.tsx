'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { useSession } from '@/components/providers/SessionProvider'
import {
  ArrowLeft,
  Download,
  IndianRupee,
  TrendingUp,
  Users,
  BarChart3,
  Loader2,
} from 'lucide-react'

interface SalaryStats {
  totalPaid: number
  totalPending: number
  averageSalary: number
  totalStaff: number
  year: number
  monthlyTrend: Array<{ month: string; amount: number }>
  departmentWise: Array<{ name: string; total: number; count: number; average: number; percentage: number }>
}

export default function SalaryReportsPage() {
  const { profile } = useSession()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SalaryStats | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (profile?.schoolId) {
      fetchReports()
    }
  }, [selectedYear, profile?.schoolId])

  const fetchReports = async () => {
    if (!profile?.schoolId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/salary/reports?school_id=${profile.schoolId}&year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch {
      console.error('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    if (!stats) return

    const headers = ['Month', 'Amount Disbursed']
    const rows = stats.monthlyTrend.map(m => [m.month, m.amount])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `salary_report_${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatLakh = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`
  }

  const maxMonthly = stats ? Math.max(...stats.monthlyTrend.map((m) => m.amount), 1) : 1
  const totalDeptSalary = stats?.departmentWise.reduce((sum, d) => sum + d.total, 0) || 1

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
          <Button onClick={exportReport} icon={<Download className="h-4 w-4" />} disabled={!stats}>
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !stats ? (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No salary data available for {selectedYear}</p>
          <Link href="/salary/process" className="text-primary hover:underline mt-2 inline-block">
            Process payroll to generate reports
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Paid (YTD)</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalPaid)}
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
                      {formatCurrency(stats.totalPending)}
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
                      {formatCurrency(stats.averageSalary)}
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
                    <p className="text-2xl font-bold text-purple-600">{stats.totalStaff}</p>
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
                <div className="flex items-end justify-between h-48 gap-2">
                  {stats.monthlyTrend.map((item) => (
                    <div key={item.month} className="flex flex-col items-center flex-1 group">
                      <div className="relative w-full">
                        <div
                          className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                          style={{ height: `${(item.amount / maxMonthly) * 192}px` }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Wise */}
            <Card>
              <CardHeader>
                <CardTitle>Department Wise Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.departmentWise.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No department data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.departmentWise.map((item) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm text-gray-500">{item.count} staff</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-blue-500 rounded-full"
                              style={{
                                width: `${item.percentage}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-24 text-right">
                            {formatLakh(item.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
