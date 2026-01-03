'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  GraduationCap,
} from 'lucide-react'

interface Teacher {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  designation: string
  phone: string | null
  email: string
  status: string
  employee_type: string
  department: { id: string; name: string } | null
}

interface Department {
  id: string
  name: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Stats {
  total: number
  active: number
  onLeave: number
  departments: number
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    onLeave: 0,
    departments: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchDepartments()
    fetchStats()
  }, [])

  useEffect(() => {
    fetchTeachers()
  }, [pagination.page, departmentFilter, statusFilter])

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

  const fetchStats = async () => {
    try {
      // Fetch all staff to calculate stats
      const [totalRes, activeRes, leaveRes] = await Promise.all([
        fetch('/api/staff?limit=1'),
        fetch('/api/staff?status=active&limit=1'),
        fetch('/api/staff?status=on_leave&limit=1'),
      ])

      const [totalData, activeData, leaveData] = await Promise.all([
        totalRes.json(),
        activeRes.json(),
        leaveRes.json(),
      ])

      setStats({
        total: totalData.pagination?.total || 0,
        active: activeData.pagination?.total || 0,
        onLeave: leaveData.pagination?.total || 0,
        departments: departments.length,
      })
    } catch {
      console.error('Failed to fetch stats')
    }
  }

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchQuery) params.append('search', searchQuery)
      if (departmentFilter) params.append('department_id', departmentFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/staff?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTeachers(data.data || [])
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }))
      }
    } catch {
      console.error('Failed to fetch teachers')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchTeachers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchTeachers()
        fetchStats()
      } else {
        alert('Failed to delete teacher')
      }
    } catch {
      alert('Failed to delete teacher')
    } finally {
      setDeleting(null)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-500 mt-1">Manage all staff members</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Link href="/teachers/new">
            <Button icon={<Plus className="h-4 w-4" />}>Add Teacher</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Staff</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">On Leave</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.onLeave}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Departments</p>
            <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Departments' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
                className="w-40"
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'on_leave', label: 'On Leave' },
                  { value: 'resigned', label: 'Resigned' },
                ]}
                className="w-32"
              />
              <Button type="submit" variant="outline" icon={<Filter className="h-4 w-4" />}>
                Apply
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Staff ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No staff found</p>
              <Link href="/teachers/new">
                <Button className="mt-4" icon={<Plus className="h-4 w-4" />}>
                  Add First Staff
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
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
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-700">
                              {teacher.first_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.first_name} {teacher.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {teacher.designation}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.employee_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            teacher.employee_type === 'teaching'
                              ? 'info'
                              : teacher.employee_type === 'admin'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {teacher.employee_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.department?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {teacher.phone && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Phone className="h-3 w-3" />
                              {teacher.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-gray-500">
                            <Mail className="h-3 w-3" />
                            {teacher.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            teacher.status === 'active'
                              ? 'success'
                              : teacher.status === 'on_leave'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {teacher.status === 'active'
                            ? 'Active'
                            : teacher.status === 'on_leave'
                            ? 'On Leave'
                            : teacher.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/teachers/${teacher.id}`}>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Eye className="h-4 w-4 text-gray-500" />
                            </button>
                          </Link>
                          <Link href={`/teachers/${teacher.id}/edit`}>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Edit className="h-4 w-4 text-gray-500" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(teacher.id)}
                            disabled={deleting === teacher.id}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {teachers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
