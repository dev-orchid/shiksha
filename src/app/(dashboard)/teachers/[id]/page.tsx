'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useSession } from '@/components/providers/SessionProvider'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Briefcase,
  GraduationCap,
  Building,
  CreditCard,
  BookOpen,
  IndianRupee,
  Save,
  X,
} from 'lucide-react'
import { getEmployeeTypeLabel } from '@/lib/constants/employee-types'

interface Teacher {
  id: string
  employee_id: string
  first_name: string
  last_name: string | null
  date_of_birth: string | null
  gender: string | null
  blood_group: string | null
  phone: string
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  designation: string
  employee_type: string
  employment_type: string
  joining_date: string
  experience_years: number
  highest_qualification: string | null
  specialization: string | null
  status: string
  photo_url: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  bank_name: string | null
  bank_account_number: string | null
  ifsc_code: string | null
  department: { id: string; name: string } | null
  school: { id: string; name: string } | null
  teacher_assignments?: Array<{
    id: string
    class_id: string
    section_id: string
    subject_id: string
    is_class_teacher: boolean
    classes: { id: string; name: string }
    sections: { id: string; name: string }
    subjects: { id: string; name: string }
  }>
}

interface SalaryStructure {
  id: string
  name: string
  description: string | null
  employee_type: string | null
}

interface SalaryAssignment {
  id: string
  staff_id: string
  salary_structure_id: string | null
  basic_salary: number
  effective_from: string
  is_current: boolean
  salary_structures: SalaryStructure | null
}

export default function TeacherDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useSession()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Salary assignment state
  const [salaryAssignment, setSalaryAssignment] = useState<SalaryAssignment | null>(null)
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([])
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [salaryForm, setSalaryForm] = useState({
    basic_salary: '',
    salary_structure_id: '',
  })
  const [savingSalary, setSavingSalary] = useState(false)

  useEffect(() => {
    async function fetchTeacher() {
      try {
        const response = await fetch(`/api/staff/${params.id}`)
        const result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Failed to fetch teacher')
          return
        }

        setTeacher(result.data)
      } catch {
        setError('Failed to fetch teacher')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchTeacher()
    }
  }, [params.id])

  // Fetch salary assignment and structures
  useEffect(() => {
    async function fetchSalaryData() {
      if (!params.id || !profile?.schoolId) return

      try {
        // Fetch salary assignment
        const assignmentRes = await fetch(`/api/salary/assignments?staff_id=${params.id}&current_only=true`)
        if (assignmentRes.ok) {
          const data = await assignmentRes.json()
          if (data.data && data.data.length > 0) {
            setSalaryAssignment(data.data[0])
            setSalaryForm({
              basic_salary: String(data.data[0].basic_salary),
              salary_structure_id: data.data[0].salary_structure_id || '',
            })
          }
        }

        // Fetch salary structures
        const structuresRes = await fetch(`/api/salary/structures?school_id=${profile.schoolId}`)
        if (structuresRes.ok) {
          const data = await structuresRes.json()
          setSalaryStructures(data.data || [])
        }
      } catch {
        console.error('Failed to fetch salary data')
      }
    }

    fetchSalaryData()
  }, [params.id, profile?.schoolId])

  const handleSaveSalary = async () => {
    if (!params.id || !salaryForm.basic_salary) return

    setSavingSalary(true)
    try {
      const response = await fetch('/api/salary/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: params.id,
          basic_salary: parseFloat(salaryForm.basic_salary),
          salary_structure_id: salaryForm.salary_structure_id || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSalaryAssignment(data.data)
        setShowSalaryForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save salary')
      }
    } catch {
      alert('Failed to save salary')
    } finally {
      setSavingSalary(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this teacher?')) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/staff/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/teachers')
      } else {
        const result = await response.json()
        alert(result.error || 'Failed to delete teacher')
      }
    } catch {
      alert('Failed to delete teacher')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !teacher) {
    return (
      <div className="space-y-4">
        <Link href="/teachers">
          <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>
            Back to Teachers
          </Button>
        </Link>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{error || 'Teacher not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName = `${teacher.first_name} ${teacher.last_name || ''}`.trim()

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      active: 'success',
      on_leave: 'warning',
      resigned: 'danger',
      terminated: 'danger',
    }
    return variants[status] || 'info'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/teachers">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-gray-500">{teacher.employee_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/teachers/${teacher.id}/edit`}>
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="font-medium">{teacher.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">
                    {teacher.date_of_birth
                      ? new Date(teacher.date_of_birth).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">{teacher.gender || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Blood Group</p>
                  <p className="font-medium">{teacher.blood_group || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={getStatusBadge(teacher.status)}>
                    {teacher.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Employment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Designation</p>
                  <p className="font-medium">{teacher.designation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{teacher.department?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employee Type</p>
                  <p className="font-medium">{getEmployeeTypeLabel(teacher.employee_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employment Type</p>
                  <p className="font-medium capitalize">{teacher.employment_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joining Date</p>
                  <p className="font-medium">
                    {new Date(teacher.joining_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium">{teacher.experience_years} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Qualification</p>
                  <p className="font-medium">{teacher.highest_qualification || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Specialization</p>
                  <p className="font-medium">{teacher.specialization || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{teacher.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{teacher.email || '-'}</p>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">
                      {[teacher.address, teacher.city, teacher.state, teacher.pincode]
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Emergency Contact</p>
                  <p className="font-medium">{teacher.emergency_contact_name || '-'}</p>
                  <p className="text-sm text-gray-500">{teacher.emergency_contact_phone || ''}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium">{teacher.bank_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-medium">{teacher.bank_account_number || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IFSC Code</p>
                  <p className="font-medium">{teacher.ifsc_code || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  {teacher.photo_url ? (
                    <img
                      src={teacher.photo_url}
                      alt={fullName}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-green-700">
                      {teacher.first_name.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{fullName}</h3>
                <p className="text-sm text-gray-500">{teacher.designation}</p>
                <p className="text-sm text-gray-400">{teacher.department?.name}</p>
                <Badge
                  variant={getStatusBadge(teacher.status)}
                  className="mt-2"
                >
                  {teacher.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Class Teacher Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Class Teacher
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.teacher_assignments?.filter(a => a.is_class_teacher).length ? (
                <div className="space-y-2">
                  {teacher.teacher_assignments
                    .filter(a => a.is_class_teacher)
                    .map((assignment) => (
                      <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">
                          {assignment.classes?.name} - {assignment.sections?.name}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No class assignments</p>
              )}
            </CardContent>
          </Card>

          {/* Subject Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.teacher_assignments && teacher.teacher_assignments.length > 0 ? (
                <div className="space-y-2">
                  {teacher.teacher_assignments.map((assignment) => (
                    <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{assignment.subjects?.name}</p>
                      <p className="text-sm text-gray-500">
                        {assignment.classes?.name} - {assignment.sections?.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No subject assignments</p>
              )}
            </CardContent>
          </Card>

          {/* Salary Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Salary
                </CardTitle>
                {!showSalaryForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSalaryForm(true)}
                    icon={<Edit className="h-4 w-4" />}
                  >
                    {salaryAssignment ? 'Edit' : 'Assign'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showSalaryForm ? (
                <div className="space-y-3">
                  <Input
                    label="Basic Salary"
                    type="number"
                    value={salaryForm.basic_salary}
                    onChange={(e) => setSalaryForm({ ...salaryForm, basic_salary: e.target.value })}
                    placeholder="e.g., 25000"
                    required
                  />
                  <Select
                    label="Salary Structure"
                    value={salaryForm.salary_structure_id}
                    onChange={(e) => setSalaryForm({ ...salaryForm, salary_structure_id: e.target.value })}
                    options={[
                      { value: '', label: 'Select Structure (Optional)' },
                      ...salaryStructures
                        .filter(s => !s.employee_type || s.employee_type === teacher?.employee_type)
                        .sort((a, b) => {
                          // Show matching employee_type structures first
                          const aMatch = a.employee_type === teacher?.employee_type ? 0 : 1
                          const bMatch = b.employee_type === teacher?.employee_type ? 0 : 1
                          return aMatch - bMatch
                        })
                        .map(s => ({
                          value: s.id,
                          label: s.employee_type === teacher?.employee_type
                            ? `${s.name} (Recommended)`
                            : s.name
                        })),
                    ]}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveSalary}
                      disabled={savingSalary || !salaryForm.basic_salary}
                      icon={<Save className="h-4 w-4" />}
                    >
                      {savingSalary ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSalaryForm(false)}
                      icon={<X className="h-4 w-4" />}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : salaryAssignment ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Basic Salary</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(salaryAssignment.basic_salary)}
                    </p>
                  </div>
                  {salaryAssignment.salary_structures && (
                    <div>
                      <p className="text-sm text-gray-500">Structure</p>
                      <Badge variant="info">{salaryAssignment.salary_structures.name}</Badge>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Effective From</p>
                    <p className="text-sm">
                      {new Date(salaryAssignment.effective_from).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <IndianRupee className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No salary assigned</p>
                  <p className="text-xs text-gray-400 mt-1">Click Assign to set up salary</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href={`/attendance/staff?staff=${teacher.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start" icon={<Calendar className="h-4 w-4" />}>
                    View Attendance
                  </Button>
                </Link>
                <Link href="/salary" className="block">
                  <Button variant="outline" className="w-full justify-start" icon={<CreditCard className="h-4 w-4" />}>
                    Salary Management
                  </Button>
                </Link>
                <Link href="/teachers/assignments" className="block">
                  <Button variant="outline" className="w-full justify-start" icon={<BookOpen className="h-4 w-4" />}>
                    Manage Assignments
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
