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
} from 'lucide-react'

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

export default function TeacherDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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
                  <p className="font-medium capitalize">{teacher.employee_type}</p>
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
                <Link href={`/salary?staff=${teacher.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start" icon={<CreditCard className="h-4 w-4" />}>
                    View Salary
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
