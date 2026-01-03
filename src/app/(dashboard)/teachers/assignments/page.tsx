'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  Plus,
  Search,
  BookOpen,
  Users,
  Trash2,
} from 'lucide-react'

interface Teacher {
  id: string
  employee_id: string
  first_name: string
  last_name: string | null
  designation: string
}

interface Class {
  id: string
  name: string
}

interface Section {
  id: string
  name: string
  class_id: string
}

interface Subject {
  id: string
  name: string
}

interface Assignment {
  id: string
  teacher_id: string
  class_id: string
  section_id: string
  subject_id: string
  teacher?: Teacher
  class?: Class
  section?: Section
  subject?: Subject
}

export default function TeacherAssignmentsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterClass, setFilterClass] = useState('')
  const [filterTeacher, setFilterTeacher] = useState('')

  const [newAssignment, setNewAssignment] = useState({
    teacher_id: '',
    class_id: '',
    section_id: '',
    subject_id: '',
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [teachersRes, classesRes, sectionsRes, subjectsRes, assignmentsRes] = await Promise.all([
          fetch('/api/staff?staff_type=teaching'),
          fetch('/api/classes'),
          fetch('/api/sections'),
          fetch('/api/subjects'),
          fetch('/api/teacher-assignments'),
        ])

        if (teachersRes.ok) {
          const data = await teachersRes.json()
          setTeachers(data.data || [])
        }
        if (classesRes.ok) {
          const data = await classesRes.json()
          setClasses(data.data || [])
        }
        if (sectionsRes.ok) {
          const data = await sectionsRes.json()
          setSections(data.data || [])
        }
        if (subjectsRes.ok) {
          const data = await subjectsRes.json()
          setSubjects(data.data || [])
        }
        if (assignmentsRes.ok) {
          const data = await assignmentsRes.json()
          setAssignments(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredSections = newAssignment.class_id
    ? sections.filter((s) => s.class_id === newAssignment.class_id)
    : []

  const filteredAssignments = assignments.filter((a) => {
    if (filterClass && a.class_id !== filterClass) return false
    if (filterTeacher && a.teacher_id !== filterTeacher) return false
    return true
  })

  const handleAddAssignment = async () => {
    if (!newAssignment.teacher_id || !newAssignment.class_id || !newAssignment.section_id || !newAssignment.subject_id) {
      alert('Please fill all fields')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/teacher-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssignment),
      })

      if (response.ok) {
        const data = await response.json()
        setAssignments([...assignments, data.data])
        setNewAssignment({ teacher_id: '', class_id: '', section_id: '', subject_id: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add assignment')
      }
    } catch {
      alert('Failed to add assignment')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return

    try {
      const response = await fetch(`/api/teacher-assignments/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAssignments(assignments.filter((a) => a.id !== id))
      } else {
        alert('Failed to delete assignment')
      }
    } catch {
      alert('Failed to delete assignment')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/teachers">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Assignments</h1>
          <p className="text-gray-500">Assign teachers to classes, sections, and subjects</p>
        </div>
      </div>

      {/* Add New Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select
              label="Teacher"
              value={newAssignment.teacher_id}
              onChange={(e) => setNewAssignment({ ...newAssignment, teacher_id: e.target.value })}
              options={[
                { value: '', label: 'Select Teacher' },
                ...teachers.map((t) => ({
                  value: t.id,
                  label: `${t.first_name} ${t.last_name || ''} (${t.employee_id})`,
                })),
              ]}
            />
            <Select
              label="Class"
              value={newAssignment.class_id}
              onChange={(e) => setNewAssignment({ ...newAssignment, class_id: e.target.value, section_id: '' })}
              options={[
                { value: '', label: 'Select Class' },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              label="Section"
              value={newAssignment.section_id}
              onChange={(e) => setNewAssignment({ ...newAssignment, section_id: e.target.value })}
              options={[
                { value: '', label: 'Select Section' },
                ...filteredSections.map((s) => ({ value: s.id, label: s.name })),
              ]}
              disabled={!newAssignment.class_id}
            />
            <Select
              label="Subject"
              value={newAssignment.subject_id}
              onChange={(e) => setNewAssignment({ ...newAssignment, subject_id: e.target.value })}
              options={[
                { value: '', label: 'Select Subject' },
                ...subjects.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <div className="flex items-end">
              <Button onClick={handleAddAssignment} disabled={saving} className="w-full">
                {saving ? 'Adding...' : 'Add Assignment'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assignments..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <Select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
              className="w-40"
            />
            <Select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              options={[
                { value: '', label: 'All Teachers' },
                ...teachers.map((t) => ({
                  value: t.id,
                  label: `${t.first_name} ${t.last_name || ''}`,
                })),
              ]}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Current Assignments ({filteredAssignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAssignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No assignments found</p>
              <p className="text-sm">Add assignments using the form above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAssignments.map((assignment) => {
                    const teacher = teachers.find((t) => t.id === assignment.teacher_id)
                    const cls = classes.find((c) => c.id === assignment.class_id)
                    const section = sections.find((s) => s.id === assignment.section_id)
                    const subject = subjects.find((s) => s.id === assignment.subject_id)

                    return (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-green-700">
                                {teacher?.first_name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {teacher ? `${teacher.first_name} ${teacher.last_name || ''}` : 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">{teacher?.employee_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="info">{cls?.name || 'Unknown'}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {section?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="success">{subject?.name || 'Unknown'}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="p-1 hover:bg-red-50 rounded text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
