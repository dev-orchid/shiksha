'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Plus,
  Search,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  FileText,
  Download,
  Eye,
  Printer,
  Loader2,
  ChevronRight,
} from 'lucide-react'

interface Student {
  id: string
  first_name: string
  last_name: string | null
  admission_number: string
  classes?: { name: string } | null
  sections?: { name: string } | null
  current_class?: { name: string } | null
  current_section?: { name: string } | null
  fee_status?: string
  pending_fee_amount?: number
}

interface Payment {
  id: string
  receipt_number: string
  amount: number
  payment_mode: string
  payment_date: string
  status: string
  fee_invoices: {
    id: string
    invoice_number: string
    student_id: string
    students: {
      id: string
      first_name: string
      last_name: string
      admission_number: string
      classes: { name: string } | null
      sections: { name: string } | null
    } | null
  } | null
}

interface PendingDue {
  id: string
  invoice_number: string
  student_id: string
  balance_amount: number
  due_date: string
  status: string
  students: {
    id: string
    first_name: string
    last_name: string
    admission_number: string
    classes: { name: string } | null
    sections: { name: string } | null
  } | null
}

interface Stats {
  todayCollection: number
  monthCollection: number
  totalPending: number
  pendingCount: number
  collectionRate: number
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`
  } else if (amount >= 1000) {
    return `₹${amount.toLocaleString('en-IN')}`
  }
  return `₹${amount.toLocaleString('en-IN')}`
}

export default function FeesPage() {
  const router = useRouter()
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [pendingDues, setPendingDues] = useState<PendingDue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState<Stats>({
    todayCollection: 0,
    monthCollection: 0,
    totalPending: 0,
    pendingCount: 0,
    collectionRate: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]

      // Fetch all data in parallel
      const [paymentsRes, todayPaymentsRes, monthPaymentsRes, pendingInvoicesRes] = await Promise.all([
        fetch('/api/fees/payments?limit=10'),
        fetch(`/api/fees/payments?start_date=${today}&end_date=${today}`),
        fetch(`/api/fees/payments?start_date=${firstDayOfMonth}&end_date=${lastDayOfMonth}`),
        fetch('/api/fees/invoices?status=pending&limit=5'),
      ])

      const [paymentsData, todayData, monthData, pendingData] = await Promise.all([
        paymentsRes.json(),
        todayPaymentsRes.json(),
        monthPaymentsRes.json(),
        pendingInvoicesRes.json(),
      ])

      setRecentPayments(paymentsData.data || [])

      // Calculate stats
      const todayTotal = (todayData.data || []).reduce(
        (sum: number, p: Payment) => sum + (p.amount || 0),
        0
      )
      const monthTotal = (monthData.data || []).reduce(
        (sum: number, p: Payment) => sum + (p.amount || 0),
        0
      )

      const pendingInvoices = pendingData.data || []
      const totalPending = pendingInvoices.reduce(
        (sum: number, inv: PendingDue) => sum + (inv.balance_amount || 0),
        0
      )

      setPendingDues(pendingInvoices.slice(0, 5))

      setStats({
        todayCollection: todayTotal,
        monthCollection: monthTotal,
        totalPending: totalPending,
        pendingCount: pendingData.pagination?.total || pendingInvoices.length,
        collectionRate: monthTotal > 0 ? Math.round((monthTotal / (monthTotal + totalPending)) * 100) : 0,
      })
    } catch (error) {
      console.error('Failed to fetch fee data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    // Redirect to collect fee page with search query
    router.push(`/fees/collect?search=${encodeURIComponent(searchQuery)}`)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const today = new Date()
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

      const response = await fetch(
        `/api/fees/reports/export?type=monthly&start_date=${firstDayOfMonth}&end_date=${lastDayOfMonth}`
      )
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `fee_payments_${firstDayOfMonth}_${lastDayOfMonth}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch {
      console.error('Failed to export')
    } finally {
      setExporting(false)
    }
  }

  const handlePrintReceipt = (paymentId: string) => {
    window.open(`/fees/payments/${paymentId}/receipt`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Collection</h1>
          <p className="text-gray-500 mt-1">Manage fee payments and track dues</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/fees/invoices">
            <Button variant="outline" icon={<FileText className="h-4 w-4" />}>
              Generate Invoices
            </Button>
          </Link>
          <Link href="/fees/collect">
            <Button icon={<Plus className="h-4 w-4" />}>Collect Fee</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Collection</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.todayCollection)}
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
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.monthCollection)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pending</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(stats.totalPending)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stats.pendingCount} Students</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Collection Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.collectionRate}%</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Fee Collection */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Fee Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student by name or admission no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="text-center py-8 text-gray-500">
                <IndianRupee className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm">Search for a student to collect fee</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Dues */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Dues</CardTitle>
            <Link href="/fees/dues">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingDues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm">No pending dues</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingDues.map((due) => (
                  <Link
                    key={due.id}
                    href={`/fees/collect?student=${due.student_id}`}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer group"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {due.students?.first_name} {due.students?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {due.students?.classes?.name || '-'} - {due.students?.sections?.name || '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          ₹{(due.balance_amount || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due: {new Date(due.due_date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Payments</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              icon={exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            >
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
            <Link href="/fees/payments">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="text-center py-12">
              <IndianRupee className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No recent payments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Receipt No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
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
                  {recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                        {payment.receipt_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.fee_invoices?.students?.first_name}{' '}
                            {payment.fee_invoices?.students?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {payment.fee_invoices?.students?.classes?.name || '-'} -{' '}
                            {payment.fee_invoices?.students?.sections?.name || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{(payment.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="default">{payment.payment_mode}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                          {payment.status === 'completed' ? 'Paid' : payment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/fees/payments/${payment.id}/receipt`}>
                            <button className="p-1 hover:bg-gray-100 rounded" title="View Receipt">
                              <Eye className="h-4 w-4 text-gray-500" />
                            </button>
                          </Link>
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Print Receipt"
                            onClick={() => handlePrintReceipt(payment.id)}
                          >
                            <Printer className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
