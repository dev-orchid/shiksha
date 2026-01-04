'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useSession } from '@/components/providers/SessionProvider'
import {
  Wallet,
  TrendingUp,
  Users,
  Calendar,
  Download,
  FileText,
  Eye,
  Play,
  Loader2,
} from 'lucide-react'

interface PayrollHistory {
  id: string
  month: string
  monthNumber: number
  year: number
  totalStaff: number
  grossAmount: number
  deductions: number
  netAmount: number
  status: 'pending' | 'paid'
}

interface StaffSalary {
  id: string
  staffId: string
  name: string
  designation: string
  basicSalary: number
  grossSalary: number
  deductions: number
  netSalary: number
  status: 'pending' | 'paid' | 'processed'
}

interface SalaryStats {
  thisMonthPayroll: number
  totalDeductions: number
  netPayable: number
  pendingPayments: number
  staffWithPayroll: number
  totalStaff: number
  month: number
  year: number
}

export default function SalaryPage() {
  const { profile } = useSession()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SalaryStats | null>(null)
  const [payrollHistory, setPayrollHistory] = useState<PayrollHistory[]>([])
  const [staffSalaries, setStaffSalaries] = useState<StaffSalary[]>([])
  const [error, setError] = useState('')

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    if (profile?.schoolId) {
      fetchData()
    }
  }, [profile?.schoolId])

  const fetchData = async () => {
    if (!profile?.schoolId) return

    setLoading(true)
    setError('')

    try {
      // Fetch all data in parallel
      const [statsRes, historyRes, salariesRes] = await Promise.all([
        fetch(`/api/salary/stats?school_id=${profile.schoolId}&month=${currentMonth}&year=${currentYear}`),
        fetch(`/api/salary/history?school_id=${profile.schoolId}&limit=6`),
        fetch(`/api/salary/staff-salaries?school_id=${profile.schoolId}&month=${currentMonth}&year=${currentYear}&limit=5`),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.data)
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setPayrollHistory(historyData.data || [])
      }

      if (salariesRes.ok) {
        const salariesData = await salariesRes.json()
        setStaffSalaries(salariesData.data || [])
      }
    } catch (err) {
      console.error('Error fetching salary data:', err)
      setError('Failed to load salary data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleExport = async () => {
    if (!profile?.schoolId) return

    try {
      const response = await fetch(
        `/api/salary/history?school_id=${profile.schoolId}&limit=100`
      )
      if (response.ok) {
        const data = await response.json()
        const csv = generateCSV(data.data)
        downloadCSV(csv, `payroll-history-${currentYear}.csv`)
      }
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const generateCSV = (data: PayrollHistory[]) => {
    const headers = ['Month', 'Staff Count', 'Gross Amount', 'Deductions', 'Net Amount', 'Status']
    const rows = data.map(p => [
      p.month,
      p.totalStaff,
      p.grossAmount,
      p.deductions,
      p.netAmount,
      p.status
    ])
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-gray-500 mt-1">Manage staff salaries and payroll</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/salary/structure">
            <Button variant="outline" icon={<FileText className="h-4 w-4" />}>
              Salary Structure
            </Button>
          </Link>
          <Link href="/salary/process">
            <Button icon={<Play className="h-4 w-4" />}>Process Payroll</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month Payroll</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats?.thisMonthPayroll || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.staffWithPayroll || 0} Staff Members
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Deductions</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(stats?.totalDeductions || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">PF, Tax, etc.</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Payable</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats?.netPayable || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">After deductions</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {stats?.pendingPayments || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Staff members</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payroll History</CardTitle>
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={handleExport}
          >
            Export
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Staff Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gross Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Net Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payrollHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No payroll history found. Process your first payroll to see data here.
                    </td>
                  </tr>
                ) : (
                  payrollHistory.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{payroll.month}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payroll.totalStaff}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payroll.grossAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -{formatCurrency(payroll.deductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(payroll.netAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={payroll.status === 'paid' ? 'success' : 'warning'}>
                          {payroll.status === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/salary/process?month=${payroll.monthNumber}&year=${payroll.year}`}>
                            <Button variant="ghost" size="sm" icon={<Eye className="h-4 w-4" />}>
                              View
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Staff Salaries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Staff Salaries - {monthNames[currentMonth - 1]} {currentYear}</CardTitle>
          <Link href="/salary/all">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Basic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gross
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staffSalaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No staff salaries found for this month.
                      <Link href="/salary/process" className="text-primary hover:underline ml-1">
                        Process payroll
                      </Link> to generate salary records.
                    </td>
                  </tr>
                ) : (
                  staffSalaries.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{staff.name}</p>
                          <p className="text-sm text-gray-500">{staff.designation}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(staff.basicSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(staff.grossSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -{formatCurrency(staff.deductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(staff.netSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={staff.status === 'paid' ? 'success' : 'warning'}>
                          {staff.status === 'paid' ? 'Paid' : staff.status === 'processed' ? 'Processed' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" size="sm" icon={<FileText className="h-4 w-4" />}>
                          Payslip
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
