'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Loader2,
  X,
} from 'lucide-react'

interface ExamType {
  id: string
  name: string
}

interface ClassItem {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  code: string
}

interface ScheduleItem {
  id: string
  subjectId: string
  date: string
  startTime: string
  endTime: string
  maxMarks: number
  passingMarks: number
}

export default function CreateExamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Add exam type modal
  const [showAddExamType, setShowAddExamType] = useState(false)
  const [newExamTypeName, setNewExamTypeName] = useState('')
  const [addingExamType, setAddingExamType] = useState(false)

  // Data from API
  const [examTypes, setExamTypes] = useState<ExamType[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  // Form state
  const [examName, setExamName] = useState('')
  const [examTypeId, setExamTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    {
      id: '1',
      subjectId: '',
      date: '',
      startTime: '09:00',
      endTime: '12:00',
      maxMarks: 100,
      passingMarks: 33,
    },
  ])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [examTypesRes, classesRes, subjectsRes] = await Promise.all([
        fetch('/api/exam-types'),
        fetch('/api/classes'),
        fetch('/api/subjects'),
      ])

      if (examTypesRes.ok) {
        const data = await examTypesRes.json()
        setExamTypes(data.data || [])
      }

      if (classesRes.ok) {
        const data = await classesRes.json()
        setClasses(data.data || [])
      }

      if (subjectsRes.ok) {
        const data = await subjectsRes.json()
        setSubjects(data.data || [])
      }
    } catch {
      console.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExamType = async () => {
    if (!newExamTypeName.trim()) return

    setAddingExamType(true)
    try {
      const response = await fetch('/api/exam-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newExamTypeName.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setExamTypes([...examTypes, data.data])
        setExamTypeId(data.data.id)
        setNewExamTypeName('')
        setShowAddExamType(false)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add exam type')
      }
    } catch {
      setError('Failed to add exam type')
    } finally {
      setAddingExamType(false)
    }
  }

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        id: Date.now().toString(),
        subjectId: '',
        date: '',
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: 100,
        passingMarks: 33,
      },
    ])
  }

  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id))
  }

  const updateSchedule = (id: string, field: string, value: string | number) => {
    setSchedules(
      schedules.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((c) => c !== classId)
        : [...prev, classId]
    )
  }

  const handleSubmit = async () => {
    setError('')

    // Validation
    if (!examName.trim()) {
      setError('Exam name is required')
      return
    }
    if (!examTypeId) {
      setError('Please select an exam type')
      return
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required')
      return
    }
    if (selectedClasses.length === 0) {
      setError('Please select at least one class')
      return
    }
    if (schedules.some(s => !s.subjectId || !s.date)) {
      setError('Please fill in all subject schedules')
      return
    }

    setSaving(true)

    try {
      // Create schedules for each selected class
      const allSchedules = selectedClasses.flatMap(classId =>
        schedules.map(schedule => ({
          class_id: classId,
          subject_id: schedule.subjectId,
          exam_date: schedule.date,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          max_marks: schedule.maxMarks,
          passing_marks: schedule.passingMarks,
        }))
      )

      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: examName,
          exam_type_id: examTypeId,
          start_date: startDate,
          end_date: endDate,
          description: description || undefined,
          schedules: allSchedules,
        }),
      })

      if (response.ok) {
        router.push('/exams')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create exam')
      }
    } catch {
      setError('Failed to create exam')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/exams">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Examination</h1>
          <p className="text-gray-500 mt-1">Set up a new exam with schedule and subjects</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
              <CardDescription>Basic information about the examination</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Exam Name"
                placeholder="e.g., Unit Test 1"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Select
                    options={[
                      { value: '', label: 'Select exam type' },
                      ...examTypes.map(t => ({ value: t.id, label: t.name })),
                    ]}
                    value={examTypeId}
                    onChange={(e) => setExamTypeId(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddExamType(true)}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Add New
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Optional description about the examination"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Classes Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Classes</CardTitle>
              <CardDescription>Choose the classes for this examination</CardDescription>
            </CardHeader>
            <CardContent>
              {classes.length === 0 ? (
                <p className="text-gray-500 text-sm">No classes found. Please create classes first.</p>
              ) : (
                <>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => toggleClass(cls.id)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          selectedClasses.includes(cls.id)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        }`}
                      >
                        {cls.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedClasses.length} class(es) selected
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Exam Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Exam Schedule</CardTitle>
                <CardDescription>Define subject-wise schedule and marks</CardDescription>
              </div>
              <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={addSchedule}>
                Add Subject
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedules.map((schedule, index) => (
                <div
                  key={schedule.id}
                  className="p-4 border border-gray-200 rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Subject {index + 1}
                    </span>
                    {schedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSchedule(schedule.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Subject"
                      options={[
                        { value: '', label: 'Select subject' },
                        ...subjects.map((s) => ({ value: s.id, label: s.name })),
                      ]}
                      value={schedule.subjectId}
                      onChange={(e) => updateSchedule(schedule.id, 'subjectId', e.target.value)}
                    />
                    <Input
                      label="Exam Date"
                      type="date"
                      value={schedule.date}
                      onChange={(e) => updateSchedule(schedule.id, 'date', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Input
                      label="Start Time"
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => updateSchedule(schedule.id, 'startTime', e.target.value)}
                    />
                    <Input
                      label="End Time"
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => updateSchedule(schedule.id, 'endTime', e.target.value)}
                    />
                    <Input
                      label="Max Marks"
                      type="number"
                      value={schedule.maxMarks}
                      onChange={(e) => updateSchedule(schedule.id, 'maxMarks', parseInt(e.target.value) || 0)}
                    />
                    <Input
                      label="Passing Marks"
                      type="number"
                      value={schedule.passingMarks}
                      onChange={(e) => updateSchedule(schedule.id, 'passingMarks', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Classes</span>
                <span className="font-medium">{selectedClasses.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subjects</span>
                <span className="font-medium">{schedules.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Max Marks</span>
                <span className="font-medium">
                  {schedules.reduce((sum, s) => sum + (s.maxMarks || 0), 0)}
                </span>
              </div>
              <hr />
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={saving}
                icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
              >
                {saving ? 'Creating...' : 'Create Examination'}
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-blue-500" />
                <p>Ensure exam dates don&apos;t conflict with holidays</p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-blue-500" />
                <p>Allow buffer time between consecutive exams</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Exam Type Modal */}
      {showAddExamType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add Exam Type</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddExamType(false)
                  setNewExamTypeName('')
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <Input
                label="Exam Type Name"
                placeholder="e.g., Unit Test, Half Yearly, Annual Exam"
                value={newExamTypeName}
                onChange={(e) => setNewExamTypeName(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddExamType(false)
                    setNewExamTypeName('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddExamType}
                  disabled={addingExamType || !newExamTypeName.trim()}
                  icon={addingExamType ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                >
                  {addingExamType ? 'Adding...' : 'Add Exam Type'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
