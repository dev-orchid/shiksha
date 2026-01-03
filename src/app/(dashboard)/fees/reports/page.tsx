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
  IndianRupee,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Loader2,
} from 'lucide-react'

interface FeeStats {
  totalCollected: number
  totalPending: number
  totalOverdue: number
  collectionRate: number
  monthlyTrend: Array<{ month: string; collected: number; pending: number }>
  categoryWise: Array<{ category: string; collected: number; percentage: number }>
  classWise: Array<{ className: string; collected: number; pending: number }>
}

export default function FeeReportsPage() {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState<FeeStats>({
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    collectionRate: 0,
    monthlyTrend: [],
    categoryWise: [],
    classWise: [],
  })
  const [reportType, setReportType] = useState('monthly')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/fees/reports?type=${reportType}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
      )
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
    setExporting(true)
    try {
      const response = await fetch(
        `/api/fees/reports/export?type=${reportType}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
      )
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `fee_report_${reportType}_${dateRange.startDate}_${dateRange.endDate}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch {
      console.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/fees">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Reports</h1>
            <p className="text-gray-500">Analyze fee collection and trends</p>
          </div>
        </div>
        <Button onClick={exportReport} disabled={exporting} icon={exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}>
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
                { value: 'daily', label: 'Daily Report' },
                { value: 'weekly', label: 'Weekly Report' },
                { value: 'monthly', label: 'Monthly Report' },
                { value: 'yearly', label: 'Yearly Report' },
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
            <div className="flex items-end">
              <Button onClick={fetchReports} className="w-full">
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Collected</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{stats.totalCollected.toLocaleString('en-IN')}
                    </p>
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
                    <p className="text-sm text-gray-500">Total Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      ₹{stats.totalPending.toLocaleString('en-IN')}
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
                    <p className="text-sm text-gray-500">Total Overdue</p>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{stats.totalOverdue.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Collection Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.collectionRate}%</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
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
                  Monthly Collection Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.monthlyTrend.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No collection data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.monthlyTrend.map((item) => {
                      const total = item.collected + item.pending
                      const percentage = total > 0 ? (item.collected / total) * 100 : 0
                      return (
                        <div key={item.month} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.month}</span>
                            <span className="text-gray-500">
                              ₹{item.collected.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Wise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Category Wise Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.categoryWise.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No category data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.categoryWise.map((item, index) => {
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500']
                      return (
                        <div key={item.category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                            <span className="text-sm">{item.category}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              ₹{item.collected.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-500">{item.percentage}%</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Class Wise Collection */}
          <Card>
            <CardHeader>
              <CardTitle>Class Wise Collection</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.classWise.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No class-wise data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-y border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Collected
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Pending
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Collection Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.classWise.map((item) => {
                        const total = item.collected + item.pending
                        const rate = total > 0 ? ((item.collected / total) * 100).toFixed(1) : '0.0'
                        return (
                          <tr key={item.className} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                              {item.className}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-green-600">
                              ₹{item.collected.toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-red-600">
                              ₹{item.pending.toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                              ₹{total.toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full">
                                  <div
                                    className="h-2 bg-green-500 rounded-full"
                                    style={{ width: `${rate}%` }}
                                  />
                                </div>
                                <span className="text-sm">{rate}%</span>
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
        </>
      )}
    </div>
  )
}
