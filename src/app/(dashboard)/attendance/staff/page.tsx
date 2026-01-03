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

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'holiday'

interface Staff {
  id: string
  employee_id: string
  first_name: string
  last_name: string | null
  designation: string | null
  department_id: string | null
  departments?: { id: string; name: string } | null
}

interface Department {
  id: string
  name: string
}

export default function StaffAttendancePage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments()
  }, [])

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

  const loadStaff = async () => {
    setLoadingStaff(true)
    setMessage(null)
    try {
      // Fetch staff (optionally filtered by department)
      let url = '/api/staff?status=active&limit=100'
      if (selectedDepartment) {
        url += `&department_id=${selectedDepartment}`
      }

      const staffRes = await fetch(url)
      const staffData = await staffRes.json()
      const staffMembers = staffData.data || []
      setStaffList(staffMembers)

      // Fetch existing attendance for this date
      let attendanceUrl = `/api/attendance/staff?date=${selectedDate}`
      if (selectedDepartment) {
        attendanceUrl += `&department_id=${selectedDepartment}`
      }

      const attendanceRes = await fetch(attendanceUrl)
      const attendanceData = await attendanceRes.json()

      // Build attendance map from existing records
      const existingAttendance: Record<string, AttendanceStatus> = {}
      if (attendanceData.data) {
        for (const record of attendanceData.data) {
          existingAttendance[record.staff_id] = record.status
        }
      }

      // Initialize attendance for all staff (default to 'present' if no record)
      const attendanceMap: Record<string, AttendanceStatus> = {}
      for (const staff of staffMembers) {
        attendanceMap[staff.id] = existingAttendance[staff.id] || 'present'
      }
      setAttendance(attendanceMap)

    } catch (error) {
      console.error('Failed to load staff:', error)
      setMessage({ type: 'error', text: 'Failed to load staff' })
    } finally {
      setLoadingStaff(false)
    }
  }

  const handleStatusChange = (staffId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [staffId]: status }))
  }

  const handleMarkAll = (status: AttendanceStatus) => {
    const newAttendance: Record<string, AttendanceStatus> = {}
    staffList.forEach((staff) => {
      newAttendance[staff.id] = status
    })
    setAttendance(newAttendance)
  }

  const handleSave = async () => {
    if (staffList.length === 0) {
      setMessage({ type: 'error', text: 'No staff loaded' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const attendanceRecords = staffList.map((staff) => ({
        staff_id: staff.id,
        date: selectedDate,
        status: attendance[staff.id] || 'present',
      }))

      const response = await fetch('/api/attendance/staff', {
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
    total: staffList.length,
    present: Object.values(attendance).filter((s) => s === 'present').length,
    absent: Object.values(attendance).filter((s) => s === 'absent').length,
    late: Object.values(attendance).filter((s) => s === 'late').length,
    leave: Object.values(attendance).filter((s) => s === 'on_leave' || s === 'half_day').length,
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
      case 'on_leave':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'holiday':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const selectedDepartmentName = departments.find((d) => d.id === selectedDepartment)?.name || 'All Departments'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Attendance</h1>
          <p className="text-gray-500 mt-1">Mark daily attendance for staff members</p>
        </div>
        <Button
          icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          onClick={handleSave}
          disabled={saving || staffList.length === 0}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              label="Department (Optional)"
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value)
                setStaffList([])
                setAttendance({})
              }}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={loadStaff}
                disabled={loadingStaff}
              >
                {loadingStaff ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load Staff'
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
      {staffList.length > 0 && (
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
                onClick={() => handleMarkAll('on_leave')}
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
            {staffList.length > 0
              ? `${selectedDepartmentName} (${staffList.length} Staff)`
              : 'Click "Load Staff" to view staff members'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {staffList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                Click &quot;Load Staff&quot; to load staff members
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Staff Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {staff.employee_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {staff.first_name.charAt(0)}
                            </span>
                          </div>
                          <span className="ml-3 text-sm text-gray-900">
                            {staff.first_name} {staff.last_name || ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {staff.designation || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {(['present', 'absent', 'late', 'on_leave'] as AttendanceStatus[]).map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(staff.id, status)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                  attendance[staff.id] === status
                                    ? getStatusColor(status)
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {status === 'on_leave' ? 'Leave' : status.charAt(0).toUpperCase() + status.slice(1)}
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
