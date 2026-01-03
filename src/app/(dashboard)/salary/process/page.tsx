'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  IndianRupee,
  Users,
  CheckCircle,
  AlertCircle,
  Play,
  Loader2,
} from 'lucide-react'

interface StaffMember {
  id: string
  employee_id: string
  first_name: string
  last_name: string | null
  designation: string
  gross_salary: number
  deductions: number
  net_salary: number
  status: 'pending' | 'processed' | 'paid'
}

export default function ProcessPayrollPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])

  useEffect(() => {
    fetchPayrollData()
  }, [selectedMonth, selectedYear])

  const fetchPayrollData = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/salary/payroll?month=${selectedMonth}&year=${selectedYear}`
      )
      if (response.ok) {
        const data = await response.json()
        setStaff(data.data || [])
      }
    } catch {
      console.error('Failed to fetch payroll data')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedStaff.length === staff.filter((s) => s.status === 'pending').length) {
      setSelectedStaff([])
    } else {
      setSelectedStaff(staff.filter((s) => s.status === 'pending').map((s) => s.id))
    }
  }

  const handleSelectStaff = (id: string) => {
    if (selectedStaff.includes(id)) {
      setSelectedStaff(selectedStaff.filter((s) => s !== id))
    } else {
      setSelectedStaff([...selectedStaff, id])
    }
  }

  const handleProcessPayroll = async () => {
    if (selectedStaff.length === 0) {
      alert('Please select staff members to process payroll')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/salary/payroll/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_ids: selectedStaff,
          month: selectedMonth,
          year: selectedYear,
        }),
      })

      if (response.ok) {
        alert('Payroll processed successfully')
        fetchPayrollData()
        setSelectedStaff([])
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to process payroll')
      }
    } catch {
      alert('Failed to process payroll')
    } finally {
      setProcessing(false)
    }
  }

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: new Date().getFullYear() - 2 + i,
    label: String(new Date().getFullYear() - 2 + i),
  }))

  const totalGross = staff.reduce((sum, s) => sum + s.gross_salary, 0)
  const totalDeductions = staff.reduce((sum, s) => sum + s.deductions, 0)
  const totalNet = staff.reduce((sum, s) => sum + s.net_salary, 0)
  const pendingCount = staff.filter((s) => s.status === 'pending').length
  const processedCount = staff.filter((s) => s.status === 'processed').length

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
            <h1 className="text-2xl font-bold text-gray-900">Process Payroll</h1>
            <p className="text-gray-500">Generate and process monthly payroll</p>
          </div>
        </div>
        <Button
          onClick={handleProcessPayroll}
          disabled={processing || selectedStaff.length === 0}
          icon={processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        >
          {processing ? 'Processing...' : `Process (${selectedStaff.length})`}
        </Button>
      </div>

      {/* Month/Year Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              label="Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              options={months.map((m) => ({ value: String(m.value), label: m.label }))}
              className="w-40"
            />
            <Select
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              options={years.map((y) => ({ value: String(y.value), label: y.label }))}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Staff</p>
            <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Processed</p>
            <p className="text-2xl font-bold text-green-600">{processedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Gross</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{totalGross.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Net</p>
            <p className="text-xl font-bold text-green-600">
              ₹{totalNet.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Payroll - {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </CardTitle>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStaff.length === staff.filter((s) => s.status === 'pending').length && pendingCount > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Select All Pending</span>
            </label>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No payroll data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedStaff.length === staff.filter((s) => s.status === 'pending').length && pendingCount > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Designation
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Gross
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Deductions
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Net Salary
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(member.id)}
                          onChange={() => handleSelectStaff(member.id)}
                          disabled={member.status !== 'pending'}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-700">
                              {member.first_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {member.first_name} {member.last_name || ''}
                            </p>
                            <p className="text-xs text-gray-500">{member.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.designation}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                        ₹{member.gross_salary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-red-600">
                        ₹{member.deductions.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                        ₹{member.net_salary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <Badge
                          variant={
                            member.status === 'paid'
                              ? 'success'
                              : member.status === 'processed'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {member.status}
                        </Badge>
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
