'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { useSession } from '@/components/providers/SessionProvider'
import {
  ArrowLeft,
  Search,
  Download,
  Eye,
  IndianRupee,
  Loader2,
} from 'lucide-react'

interface StaffSalary {
  id: string
  staffId: string
  employeeId: string
  name: string
  designation: string
  department: string
  departmentId: string
  basicSalary: number
  grossSalary: number
  deductions: number
  netSalary: number
  status: string
}

interface Department {
  id: string
  name: string
}

export default function AllSalariesPage() {
  const { profile } = useSession()
  const [salaries, setSalaries] = useState<StaffSalary[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [summary, setSummary] = useState({ totalStaff: 0, totalMonthlySalary: 0, averageSalary: 0 })

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (profile?.schoolId) {
      fetchSalaries()
      fetchDepartments()
    }
  }, [profile?.schoolId, departmentFilter])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data || [])
      }
    } catch {
      console.error('Failed to fetch departments')
    }
  }

  const fetchSalaries = async () => {
    if (!profile?.schoolId) return
    setLoading(true)
    try {
      let url = `/api/salary/staff-salaries?school_id=${profile.schoolId}&month=${currentMonth}&year=${currentYear}`
      if (departmentFilter) url += `&department_id=${departmentFilter}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSalaries(data.data || [])
        setSummary(data.summary || { totalStaff: 0, totalMonthlySalary: 0, averageSalary: 0 })
      }
    } catch {
      console.error('Failed to fetch salaries')
    } finally {
      setLoading(false)
    }
  }

  const filteredSalaries = salaries.filter((s) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      s.name.toLowerCase().includes(searchLower) ||
      s.employeeId?.toLowerCase().includes(searchLower) ||
      s.designation?.toLowerCase().includes(searchLower)
    )
  })

  const exportSalaries = () => {
    const headers = ['Employee ID', 'Name', 'Designation', 'Department', 'Basic', 'Gross', 'Deductions', 'Net Salary', 'Status']
    const rows = filteredSalaries.map(s => [
      s.employeeId,
      s.name,
      s.designation,
      s.department,
      s.basicSalary,
      s.grossSalary,
      s.deductions,
      s.netSalary,
      s.status
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `staff_salaries_${currentMonth}_${currentYear}.csv`
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
            <h1 className="text-2xl font-bold text-gray-900">All Staff Salaries</h1>
            <p className="text-gray-500">View salary details of all staff members</p>
          </div>
        </div>
        <Button onClick={exportSalaries} icon={<Download className="h-4 w-4" />}>
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Staff</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalStaff}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Monthly Salary</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalMonthlySalary)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Average Salary</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.averageSalary)}
            </p>
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
                  placeholder="Search by name or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map(d => ({ value: d.id, label: d.name })),
              ]}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Salaries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Staff Salary Details ({filteredSalaries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSalaries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <IndianRupee className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No salary records found</p>
              <Link href="/salary/process" className="text-primary hover:underline mt-2 inline-block">
                Process payroll to generate salary records
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Basic
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Gross
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Deductions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSalaries.map((salary) => (
                    <tr key={salary.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-700">
                              {salary.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {salary.name}
                            </p>
                            <p className="text-xs text-gray-500">{salary.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {salary.designation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">{salary.department || '-'}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {formatCurrency(salary.basicSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {formatCurrency(salary.grossSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                        -{formatCurrency(salary.deductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                        {formatCurrency(salary.netSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant={salary.status === 'paid' ? 'success' : salary.status === 'processed' ? 'info' : 'warning'}>
                          {salary.status}
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
