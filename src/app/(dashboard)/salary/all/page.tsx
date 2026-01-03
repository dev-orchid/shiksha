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
  Download,
  Eye,
  IndianRupee,
} from 'lucide-react'

interface StaffSalary {
  id: string
  employee_id: string
  first_name: string
  last_name: string | null
  designation: string
  department?: { name: string }
  basic_salary: number
  total_earnings: number
  total_deductions: number
  net_salary: number
  status: string
}

export default function AllSalariesPage() {
  const [salaries, setSalaries] = useState<StaffSalary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')

  useEffect(() => {
    fetchSalaries()
  }, [departmentFilter])

  const fetchSalaries = async () => {
    setLoading(true)
    try {
      let url = '/api/salary/staff-salaries'
      if (departmentFilter) url += `?department_id=${departmentFilter}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSalaries(data.data || [])
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
      s.first_name.toLowerCase().includes(searchLower) ||
      s.last_name?.toLowerCase().includes(searchLower) ||
      s.employee_id.toLowerCase().includes(searchLower)
    )
  })

  const totalSalary = filteredSalaries.reduce((sum, s) => sum + s.net_salary, 0)

  const exportSalaries = async () => {
    try {
      const response = await fetch('/api/salary/staff-salaries/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'staff_salaries.csv'
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch {
      console.error('Failed to export')
    }
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
            <p className="text-2xl font-bold text-gray-900">{filteredSalaries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Monthly Salary</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{totalSalary.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Average Salary</p>
            <p className="text-2xl font-bold text-blue-600">
              ₹{filteredSalaries.length > 0 ? Math.round(totalSalary / filteredSalaries.length).toLocaleString('en-IN') : 0}
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
                { value: 'science', label: 'Science' },
                { value: 'math', label: 'Mathematics' },
                { value: 'languages', label: 'Languages' },
                { value: 'admin', label: 'Admin' },
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredSalaries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <IndianRupee className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No salary records found</p>
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
                      Earnings
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Deductions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
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
                              {salary.first_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {salary.first_name} {salary.last_name || ''}
                            </p>
                            <p className="text-xs text-gray-500">{salary.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {salary.designation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">{salary.department?.name || '-'}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        ₹{salary.basic_salary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600">
                        +₹{salary.total_earnings.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                        -₹{salary.total_deductions.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                        ₹{salary.net_salary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Link href={`/teachers/${salary.id}`}>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                        </Link>
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
