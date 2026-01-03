'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Users,
  Save,
  X,
} from 'lucide-react'

interface Section {
  id: string
  name: string
  capacity: number
  is_active: boolean
}

interface Class {
  id: string
  name: string
  grade_level: number
  description: string | null
  is_active: boolean
  sections: Section[]
}

interface Subject {
  id: string
  name: string
  code: string
  description: string | null
  is_active: boolean
}

export default function ClassesSettingsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddClass, setShowAddClass] = useState(false)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showAddSection, setShowAddSection] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [selectedClassForSection, setSelectedClassForSection] = useState<Class | null>(null)
  const [saving, setSaving] = useState(false)

  const [classForm, setClassForm] = useState({
    name: '',
    grade_level: 0,
    description: '',
  })

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    description: '',
  })

  const [sectionForm, setSectionForm] = useState({
    name: '',
    capacity: 40,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/subjects'),
      ])

      if (classesRes.ok) {
        const data = await classesRes.json()
        setClasses(data.data || [])
      }

      if (subjectsRes.ok) {
        const data = await subjectsRes.json()
        setSubjects(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingClass ? `/api/classes/${editingClass.id}` : '/api/classes'
      const method = editingClass ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classForm),
      })

      if (response.ok) {
        fetchData()
        setShowAddClass(false)
        setEditingClass(null)
        setClassForm({ name: '', grade_level: 0, description: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save')
      }
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingSubject ? `/api/subjects/${editingSubject.id}` : '/api/subjects'
      const method = editingSubject ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectForm),
      })

      if (response.ok) {
        fetchData()
        setShowAddSubject(false)
        setEditingSubject(null)
        setSubjectForm({ name: '', code: '', description: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save')
      }
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassForSection) return
    setSaving(true)

    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClassForSection.id,
          ...sectionForm,
        }),
      })

      if (response.ok) {
        fetchData()
        setShowAddSection(false)
        setSelectedClassForSection(null)
        setSectionForm({ name: '', capacity: 40 })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save')
      }
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return

    try {
      const response = await fetch(`/api/classes/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete')
      }
    } catch {
      alert('Failed to delete')
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return

    try {
      const response = await fetch(`/api/subjects/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete')
      }
    } catch {
      alert('Failed to delete')
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return

    try {
      const response = await fetch(`/api/sections/${sectionId}`, { method: 'DELETE' })
      if (response.ok) {
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete')
      }
    } catch {
      alert('Failed to delete')
    }
  }

  const totalSections = classes.reduce((sum, c) => sum + (c.sections?.length || 0), 0)

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
        <Link href="/settings">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes & Sections</h1>
          <p className="text-gray-500 mt-1">Manage classes, sections, and subjects</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-xs text-gray-500">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSections}</p>
                <p className="text-xs text-gray-500">Total Sections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{subjects.length}</p>
                <p className="text-xs text-gray-500">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Classes & Sections</CardTitle>
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => {
              setEditingClass(null)
              setClassForm({ name: '', grade_level: 0, description: '' })
              setShowAddClass(true)
            }}>
              Add Class
            </Button>
          </CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {classes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No classes defined</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {classes.map((cls) => (
                  <div key={cls.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{cls.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm text-gray-500">
                            Grade: {cls.grade_level}
                          </span>
                          {cls.sections && cls.sections.length > 0 && (
                            <>
                              <span className="text-xs text-gray-400">|</span>
                              <span className="text-sm text-gray-500">
                                Sections: {cls.sections.map(s => s.name).join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={cls.is_active ? 'success' : 'default'}>
                          {cls.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <button
                          onClick={() => {
                            setSelectedClassForSection(cls)
                            setSectionForm({ name: '', capacity: 40 })
                            setShowAddSection(true)
                          }}
                          className="p-1 hover:bg-gray-100 rounded text-primary"
                          title="Add Section"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingClass(cls)
                            setClassForm({
                              name: cls.name,
                              grade_level: cls.grade_level,
                              description: cls.description || '',
                            })
                            setShowAddClass(true)
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    {/* Section badges */}
                    {cls.sections && cls.sections.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {cls.sections.map((section) => (
                          <div
                            key={section.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                          >
                            <span>{section.name}</span>
                            <span className="text-xs text-gray-500">({section.capacity})</span>
                            <button
                              onClick={() => handleDeleteSection(section.id)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subjects</CardTitle>
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => {
              setEditingSubject(null)
              setSubjectForm({ name: '', code: '', description: '' })
              setShowAddSubject(true)
            }}>
              Add Subject
            </Button>
          </CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No subjects defined</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {subjects.map((subject) => (
                  <div key={subject.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{subject.name}</p>
                        <p className="text-sm text-gray-500">Code: {subject.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={subject.is_active ? 'success' : 'default'}>
                          {subject.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <button
                          onClick={() => {
                            setEditingSubject(subject)
                            setSubjectForm({
                              name: subject.name,
                              code: subject.code,
                              description: subject.description || '',
                            })
                            setShowAddSubject(true)
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="p-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Class Modal */}
      <Modal
        open={showAddClass}
        onClose={() => {
          setShowAddClass(false)
          setEditingClass(null)
        }}
        title={editingClass ? 'Edit Class' : 'Add New Class'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowAddClass(false)
              setEditingClass(null)
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveClass}
              disabled={saving}
              icon={<Save className="h-4 w-4" />}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <Input
            label="Class Name"
            value={classForm.name}
            onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
            placeholder="e.g., Class 1"
            required
          />
          <Input
            label="Grade Level"
            type="number"
            value={classForm.grade_level}
            onChange={(e) => setClassForm({ ...classForm, grade_level: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 1"
            required
          />
          <Input
            label="Description"
            value={classForm.description}
            onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
            placeholder="Optional description"
          />
        </form>
      </Modal>

      {/* Add/Edit Subject Modal */}
      <Modal
        open={showAddSubject}
        onClose={() => {
          setShowAddSubject(false)
          setEditingSubject(null)
        }}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowAddSubject(false)
              setEditingSubject(null)
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubject}
              disabled={saving}
              icon={<Save className="h-4 w-4" />}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <Input
            label="Subject Name"
            value={subjectForm.name}
            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
            placeholder="e.g., Mathematics"
            required
          />
          <Input
            label="Subject Code"
            value={subjectForm.code}
            onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
            placeholder="e.g., MAT"
            required
          />
          <Input
            label="Description"
            value={subjectForm.description}
            onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
            placeholder="Optional description"
          />
        </form>
      </Modal>

      {/* Add Section Modal */}
      <Modal
        open={showAddSection}
        onClose={() => {
          setShowAddSection(false)
          setSelectedClassForSection(null)
        }}
        title={`Add Section to ${selectedClassForSection?.name || ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowAddSection(false)
              setSelectedClassForSection(null)
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSection}
              disabled={saving}
              icon={<Save className="h-4 w-4" />}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveSection} className="space-y-4">
          <Input
            label="Section Name"
            value={sectionForm.name}
            onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
            placeholder="e.g., A"
            required
          />
          <Input
            label="Capacity"
            type="number"
            value={sectionForm.capacity}
            onChange={(e) => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value) || 40 })}
            placeholder="e.g., 40"
            required
          />
        </form>
      </Modal>
    </div>
  )
}
