'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  Search,
  IndianRupee,
  AlertCircle,
  Download,
  Mail,
  MessageSquare,
} from 'lucide-react'

interface PendingDue {
  id: string
  student_id: string
  invoice_number: string
  total_amount: number
  paid_amount: number
  balance_amount: number
  due_date: string
  status: string
  students?: {
    id: string
    admission_number: string
    first_name: string
    last_name: string | null
    phone: string | null
    classes?: { name: string }
    sections?: { name: string }
  }
}

export default function PendingDuesPage() {
  const [dues, setDues] = useState<PendingDue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchDues()
  }, [selectedClass, statusFilter])

  const fetchDues = async () => {
    setLoading(true)
    try {
      let url = '/api/fees/invoices?status=pending,partial,overdue'
      if (selectedClass) url += `&class_id=${selectedClass}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setDues(data.data || [])
      }
    } catch {
      console.error('Failed to fetch dues')
    } finally {
      setLoading(false)
    }
  }

  const filteredDues = dues.filter((due) => {
    if (searchQuery) {
      const student = due.students
      const searchLower = searchQuery.toLowerCase()
      if (
        !student?.first_name?.toLowerCase().includes(searchLower) &&
        !student?.last_name?.toLowerCase().includes(searchLower) &&
        !student?.admission_number?.toLowerCase().includes(searchLower)
      ) {
        return false
      }
    }
    if (statusFilter !== 'all' && due.status !== statusFilter) {
      return false
    }
    return true
  })

  const totalDue = filteredDues.reduce((sum, due) => sum + due.balance_amount, 0)
  const overdueCount = filteredDues.filter((d) => d.status === 'overdue').length

  const exportDues = async () => {
    try {
      const response = await fetch('/api/fees/dues/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pending_dues_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch {
      console.error('Failed to export')
    }
  }

  const sendReminder = async (studentId: string, type: 'email' | 'whatsapp') => {
    try {
      const response = await fetch('/api/fees/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, type }),
      })

      if (response.ok) {
        alert(`Reminder sent via ${type}`)
      } else {
        alert('Failed to send reminder')
      }
    } catch {
      alert('Failed to send reminder')
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
            <h1 className="text-2xl font-bold text-gray-900">Pending Dues</h1>
            <p className="text-gray-500">View and manage outstanding fees</p>
          </div>
        </div>
        <Button onClick={exportDues} icon={<Download className="h-4 w-4" />}>
          Export List
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pending</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{totalDue.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Students with Dues</p>
                <p className="text-2xl font-bold text-yellow-600">{filteredDues.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-orange-600">{overdueCount}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                { value: 'class-10', label: 'Class 10' },
                { value: 'class-9', label: 'Class 9' },
                { value: 'class-8', label: 'Class 8' },
              ]}
              className="w-40"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'partial', label: 'Partial' },
                { value: 'overdue', label: 'Overdue' },
              ]}
              className="w-36"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dues List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Dues ({filteredDues.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredDues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No pending dues found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
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
                  {filteredDues.map((due) => (
                    <tr key={due.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {due.students?.first_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {due.students?.first_name} {due.students?.last_name || ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              {due.students?.admission_number} • {due.students?.classes?.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {due.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(due.due_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-red-600">
                            ₹{due.balance_amount.toLocaleString('en-IN')}
                          </p>
                          {due.paid_amount > 0 && (
                            <p className="text-xs text-gray-500">
                              Paid: ₹{due.paid_amount.toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            due.status === 'overdue'
                              ? 'danger'
                              : due.status === 'partial'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {due.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => due.students && sendReminder(due.students.id, 'email')}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Send Email Reminder"
                          >
                            <Mail className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => due.students && sendReminder(due.students.id, 'whatsapp')}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageSquare className="h-4 w-4 text-green-500" />
                          </button>
                          <Link href={`/fees/collect?student=${due.student_id}`}>
                            <Button size="sm">Collect</Button>
                          </Link>
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
