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
  Upload,
  Eye,
  Edit,
  Trash2,
  Users,
  IndianRupee,
  IdCard,
} from 'lucide-react'

interface Student {
  id: string
  admission_number: string
  first_name: string
  last_name: string
  roll_number: string | null
  gender: string
  phone: string | null
  status: string
  admission_date: string
  current_class: { id: string; name: string } | null
  current_section: { id: string; name: string } | null
  fee_status?: 'clear' | 'pending' | 'overdue'
  pending_fee_amount?: number
}

interface ClassOption {
  id: string
  name: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [sections, setSections] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [pagination.page, classFilter, sectionFilter, statusFilter])

  useEffect(() => {
    if (classFilter) {
      fetchSections(classFilter)
    } else {
      setSections([])
      setSectionFilter('')
    }
  }, [classFilter])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.data || [])
      }
    } catch {
      console.error('Failed to fetch classes')
    }
  }

  const fetchSections = async (classId: string) => {
    try {
      const response = await fetch(`/api/sections?class_id=${classId}`)
      if (response.ok) {
        const data = await response.json()
        setSections(data.data || [])
      }
    } catch {
      console.error('Failed to fetch sections')
    }
  }

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchQuery) params.append('search', searchQuery)
      if (classFilter) params.append('class_id', classFilter)
      if (sectionFilter) params.append('section_id', sectionFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/students?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.data || [])
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }))
      }
    } catch {
      console.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchStudents()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchStudents()
      } else {
        alert('Failed to delete student')
      }
    } catch {
      alert('Failed to delete student')
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
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">Manage all students in your school</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/students/id-cards">
            <Button variant="outline" icon={<IdCard className="h-4 w-4" />}>
              Bulk ID Cards
            </Button>
          </Link>
          <Link href="/students/import">
            <Button variant="outline" icon={<Upload className="h-4 w-4" />}>
              Import
            </Button>
          </Link>
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Link href="/students/new">
            <Button icon={<Plus className="h-4 w-4" />}>Add Student</Button>
          </Link>
        </div>
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
                  placeholder="Search by name, admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Classes' },
                  ...classes.map((c) => ({ value: c.id, label: c.name })),
                ]}
                className="w-32"
              />
              <Select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Sections' },
                  ...sections.map((s) => ({ value: s.id, label: s.name })),
                ]}
                className="w-36"
                disabled={!classFilter}
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'transferred', label: 'Transferred' },
                  { value: 'graduated', label: 'Graduated' },
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

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Students ({pagination.total})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No students found</p>
              <Link href="/students/new">
                <Button className="mt-4" icon={<Plus className="h-4 w-4" />}>
                  Add First Student
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {student.first_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {student.gender}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.admission_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.current_class?.name || '-'} - {student.current_section?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.roll_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.admission_date
                          ? new Date(student.admission_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            student.status === 'active'
                              ? 'success'
                              : student.status === 'inactive'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {student.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.fee_status === 'overdue' ? (
                          <div>
                            <Badge variant="danger">Overdue</Badge>
                            <p className="text-xs text-red-600 mt-1">
                              ₹{(student.pending_fee_amount || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        ) : student.fee_status === 'pending' ? (
                          <div>
                            <Badge variant="warning">Pending</Badge>
                            <p className="text-xs text-yellow-600 mt-1">
                              ₹{(student.pending_fee_amount || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="success">Clear</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/students/${student.id}`}>
                            <button className="p-1 hover:bg-gray-100 rounded" title="View">
                              <Eye className="h-4 w-4 text-gray-500" />
                            </button>
                          </Link>
                          <Link href={`/students/${student.id}/edit`}>
                            <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                              <Edit className="h-4 w-4 text-gray-500" />
                            </button>
                          </Link>
                          <Link href={`/fees/collect?student=${student.id}`}>
                            <button
                              className={`p-1 rounded ${
                                student.fee_status === 'clear'
                                  ? 'hover:bg-gray-100'
                                  : 'hover:bg-green-50 bg-green-50'
                              }`}
                              title="Collect Fee"
                            >
                              <IndianRupee className={`h-4 w-4 ${
                                student.fee_status === 'overdue'
                                  ? 'text-red-600'
                                  : student.fee_status === 'pending'
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                              }`} />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(student.id)}
                            disabled={deleting === student.id}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                            title="Delete"
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
          {students.length > 0 && (
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
