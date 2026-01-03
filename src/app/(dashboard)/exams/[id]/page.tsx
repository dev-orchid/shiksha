'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  Users,
  FileText,
  Plus,
} from 'lucide-react'

interface ExamSchedule {
  id: string
  subject_id: string
  class_id: string
  exam_date: string
  start_time: string
  end_time: string
  max_marks: number
  passing_marks: number
  subjects?: { id: string; name: string }
  classes?: { id: string; name: string }
}

interface Exam {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  description: string | null
  exam_types?: { id: string; name: string }
  academic_years?: { id: string; name: string }
  exam_schedules?: ExamSchedule[]
}

export default function ExamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchExam() {
      try {
        const response = await fetch(`/api/exams/${params.id}`)
        const result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Failed to fetch exam')
          return
        }

        setExam(result.data)
      } catch {
        setError('Failed to fetch exam')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchExam()
    }
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this exam?')) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/exams/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/exams')
      } else {
        const result = await response.json()
        alert(result.error || 'Failed to delete exam')
      }
    } catch {
      alert('Failed to delete exam')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      scheduled: 'info',
      ongoing: 'warning',
      completed: 'success',
      cancelled: 'danger',
    }
    return variants[status] || 'info'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="space-y-4">
        <Link href="/exams">
          <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>
            Back to Exams
          </Button>
        </Link>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{error || 'Exam not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/exams">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{exam.name}</h1>
              <Badge variant={getStatusBadge(exam.status)}>{exam.status}</Badge>
            </div>
            <p className="text-gray-500">{exam.exam_types?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/exams/${exam.id}/edit`}>
            <Button variant="outline" icon={<Edit className="h-4 w-4" />}>
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:bg-red-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exam Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Exam Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Exam Name</p>
                  <p className="font-medium">{exam.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Exam Type</p>
                  <p className="font-medium">{exam.exam_types?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Academic Year</p>
                  <p className="font-medium">{exam.academic_years?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={getStatusBadge(exam.status)}>{exam.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">
                    {new Date(exam.start_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">
                    {new Date(exam.end_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {exam.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{exam.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exam Schedule */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Exam Schedule
                </CardTitle>
                <Link href={`/exams/${exam.id}/schedule/new`}>
                  <Button size="sm" icon={<Plus className="h-4 w-4" />}>
                    Add Schedule
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {exam.exam_schedules && exam.exam_schedules.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-y border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Class
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Max Marks
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Passing
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {exam.exam_schedules.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {schedule.classes?.name || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                            {schedule.subjects?.name || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {schedule.exam_date ? new Date(schedule.exam_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {schedule.start_time} - {schedule.end_time}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {schedule.max_marks}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {schedule.passing_marks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No schedule added yet</p>
                  <p className="text-sm">Add subjects and timing for this exam</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Subjects</span>
                  </div>
                  <span className="font-medium">{new Set(exam.exam_schedules?.map(s => s.subject_id) || []).size}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Classes</span>
                  </div>
                  <span className="font-medium">{new Set(exam.exam_schedules?.map(s => s.class_id) || []).size}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Duration</span>
                  </div>
                  <span className="font-medium">
                    {Math.ceil(
                      (new Date(exam.end_date).getTime() - new Date(exam.start_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1}{' '}
                    days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href={`/exams/results?exam=${exam.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start" icon={<FileText className="h-4 w-4" />}>
                    View Results
                  </Button>
                </Link>
                <Link href={`/exams/results?exam=${exam.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start" icon={<Edit className="h-4 w-4" />}>
                    Enter Marks
                  </Button>
                </Link>
                <Link href={`/reports/academic?exam=${exam.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start" icon={<Users className="h-4 w-4" />}>
                    Generate Report Cards
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
