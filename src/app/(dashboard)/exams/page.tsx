'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Users,
  Eye,
  Edit,
  ClipboardList,
  Loader2,
} from 'lucide-react'

interface ExamType {
  id: string
  name: string
}

interface AcademicYear {
  id: string
  name: string
}

interface Exam {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  results_published?: boolean
  exam_types: ExamType | null
  academic_years: AcademicYear | null
  exam_schedules?: any[]
}

interface Stats {
  total: number
  completed: number
  upcoming: number
  ongoing: number
  resultsPublished: number
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [examTypes, setExamTypes] = useState<ExamType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [examTypeFilter, setExamTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    upcoming: 0,
    ongoing: 0,
    resultsPublished: 0,
  })

  useEffect(() => {
    fetchExamTypes()
    fetchExams()
  }, [])

  useEffect(() => {
    fetchExams()
  }, [examTypeFilter, statusFilter])

  const fetchExamTypes = async () => {
    try {
      const response = await fetch('/api/exam-types')
      if (response.ok) {
        const data = await response.json()
        setExamTypes(data.data || [])
      }
    } catch {
      console.error('Failed to fetch exam types')
    }
  }

  const fetchExams = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (examTypeFilter) params.append('exam_type_id', examTypeFilter)
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/exams?${params}`)
      if (response.ok) {
        const data = await response.json()
        setExams(data.data || [])
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch {
      console.error('Failed to fetch exams')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchExams()
  }

  const getStatusBadge = (examStatus: string) => {
    switch (examStatus) {
      case 'upcoming':
      case 'scheduled':
        return <Badge variant="info">Upcoming</Badge>
      case 'ongoing':
        return <Badge variant="warning">Ongoing</Badge>
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>
      default:
        return <Badge variant="default">{examStatus}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examinations</h1>
          <p className="text-gray-500 mt-1">Manage exams, schedules, and results</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/exams/grades">
            <Button variant="outline" icon={<ClipboardList className="h-4 w-4" />}>
              Grade Settings
            </Button>
          </Link>
          <Link href="/exams/new">
            <Button icon={<Plus className="h-4 w-4" />}>Create Exam</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Exams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resultsPublished}</p>
                <p className="text-xs text-gray-500">Results Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              options={[
                { value: '', label: 'All Types' },
                ...examTypes.map(t => ({ value: t.id, label: t.name })),
              ]}
              value={examTypeFilter}
              onChange={(e) => setExamTypeFilter(e.target.value)}
              className="w-full sm:w-48"
            />
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'completed', label: 'Completed' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48"
            />
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Exams List */}
      <Card>
        <CardHeader>
          <CardTitle>All Examinations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No exams found</p>
              <Link href="/exams/new">
                <Button className="mt-4" icon={<Plus className="h-4 w-4" />}>
                  Create First Exam
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Exam Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Academic Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{exam.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="default">{exam.exam_types?.name || '-'}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <p>{new Date(exam.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                          <p className="text-xs">to {new Date(exam.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exam.academic_years?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(exam.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Set(exam.exam_schedules?.map(s => s.subject_id) || []).size} subjects
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/exams/${exam.id}`}>
                            <Button variant="ghost" size="sm" icon={<Eye className="h-4 w-4" />}>
                              View
                            </Button>
                          </Link>
                          {exam.status === 'completed' && (
                            <Link href={`/exams/results?exam=${exam.id}`}>
                              <Button variant="ghost" size="sm" icon={<ClipboardList className="h-4 w-4" />}>
                                Results
                              </Button>
                            </Link>
                          )}
                          {(exam.status === 'scheduled') && (
                            <Link href={`/exams/${exam.id}/edit`}>
                              <Button variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />}>
                                Edit
                              </Button>
                            </Link>
                          )}
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
