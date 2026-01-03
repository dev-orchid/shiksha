'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import {
  Save,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react'

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave'

interface Student {
  id: string
  admission_number: string
  first_name: string
  last_name: string | null
  roll_number: string | null
}

interface ClassOption {
  id: string
  name: string
}

interface SectionOption {
  id: string
  name: string
}

export default function StudentAttendancePage() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [sections, setSections] = useState<SectionOption[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [loading, setLoading] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses()
  }, [])

  // Fetch sections when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass)
    } else {
      setSections([])
      setSelectedSection('')
    }
  }, [selectedClass])

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

  const loadStudents = async () => {
    if (!selectedClass || !selectedSection) {
      setMessage({ type: 'error', text: 'Please select class and section' })
      return
    }

    setLoadingStudents(true)
    setMessage(null)
    try {
      // Fetch students
      const studentsRes = await fetch(
        `/api/students?class_id=${selectedClass}&section_id=${selectedSection}&status=active&limit=100`
      )
      const studentsData = await studentsRes.json()
      const studentsList = studentsData.data || []
      setStudents(studentsList)

      // Fetch existing attendance for this date
      const attendanceRes = await fetch(
        `/api/attendance/students?class_id=${selectedClass}&section_id=${selectedSection}&date=${selectedDate}`
      )
      const attendanceData = await attendanceRes.json()

      // Build attendance map from existing records
      const existingAttendance: Record<string, AttendanceStatus> = {}
      if (attendanceData.data) {
        for (const record of attendanceData.data) {
          existingAttendance[record.student_id] = record.status
        }
      }

      // Initialize attendance for all students (default to 'present' if no record)
      const attendanceMap: Record<string, AttendanceStatus> = {}
      for (const student of studentsList) {
        attendanceMap[student.id] = existingAttendance[student.id] || 'present'
      }
      setAttendance(attendanceMap)

    } catch (error) {
      console.error('Failed to load students:', error)
      setMessage({ type: 'error', text: 'Failed to load students' })
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleMarkAll = (status: AttendanceStatus) => {
    const newAttendance: Record<string, AttendanceStatus> = {}
    students.forEach((student) => {
      newAttendance[student.id] = status
    })
    setAttendance(newAttendance)
  }

  const handleSave = async () => {
    if (students.length === 0) {
      setMessage({ type: 'error', text: 'No students loaded' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const attendanceRecords = students.map((student) => ({
        student_id: student.id,
        class_id: selectedClass,
        section_id: selectedSection,
        date: selectedDate,
        status: attendance[student.id] || 'present',
      }))

      const response = await fetch('/api/attendance/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: attendanceRecords }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Attendance saved successfully!' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save attendance' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save attendance' })
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter((s) => s === 'present').length,
    absent: Object.values(attendance).filter((s) => s === 'absent').length,
    late: Object.values(attendance).filter((s) => s === 'late').length,
    leave: Object.values(attendance).filter((s) => s === 'leave' || s === 'half_day').length,
  }

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'absent':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'late':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'half_day':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'leave':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const selectedClassName = classes.find((c) => c.id === selectedClass)?.name || ''
  const selectedSectionName = sections.find((s) => s.id === selectedSection)?.name || ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Attendance</h1>
          <p className="text-gray-500 mt-1">Mark daily attendance for students</p>
        </div>
        <Button
          icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          onClick={handleSave}
          disabled={saving || students.length === 0}
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Select
              label="Class"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                setStudents([])
                setAttendance({})
              }}
              options={[
                { value: '', label: 'Select Class' },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              label="Section"
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value)
                setStudents([])
                setAttendance({})
              }}
              options={[
                { value: '', label: 'Select Section' },
                ...sections.map((s) => ({ value: s.id, label: s.name })),
              ]}
              disabled={!selectedClass}
            />
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={loadStudents}
                disabled={loadingStudents || !selectedClass || !selectedSection}
              >
                {loadingStudents ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load Students'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-gray-500 mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            <p className="text-xs text-gray-500">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-xs text-gray-500">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            <p className="text-xs text-gray-500">Late</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.leave}</p>
            <p className="text-xs text-gray-500">Leave</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {students.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Mark All:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('present')}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                Present
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('absent')}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Absent
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('late')}
                className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
              >
                Late
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('leave')}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                Leave
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {students.length > 0
              ? `${selectedClassName} - ${selectedSectionName} (${students.length} Students)`
              : 'Select class and section to load students'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                Select a class and section, then click &quot;Load Students&quot;
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Roll No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.roll_number || String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {student.first_name.charAt(0)}
                            </span>
                          </div>
                          <span className="ml-3 text-sm text-gray-900">
                            {student.first_name} {student.last_name || ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {(['present', 'absent', 'late', 'leave'] as AttendanceStatus[]).map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(student.id, status)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                  attendance[student.id] === status
                                    ? getStatusColor(status)
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            )
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
