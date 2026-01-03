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
  GraduationCap,
  Users,
  FileText,
  CreditCard,
  Clock,
} from 'lucide-react'

interface Student {
  id: string
  admission_number: string
  first_name: string
  last_name: string | null
  date_of_birth: string
  gender: string | null
  blood_group: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  admission_date: string
  roll_number: string | null
  status: string
  photo_url: string | null
  emergency_contact: string | null
  medical_conditions: string | null
  allergies: string | null
  previous_school: string | null
  current_class: { id: string; name: string; grade_level: number } | null
  current_section: { id: string; name: string } | null
  school: { id: string; name: string } | null
  student_parents?: Array<{
    relationship: string
    is_primary: boolean
    parents: {
      id: string
      first_name: string
      last_name: string | null
      phone: string
      email: string | null
      occupation: string | null
    }
  }>
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchStudent() {
      try {
        const response = await fetch(`/api/students/${params.id}`)
        const result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Failed to fetch student')
          return
        }

        setStudent(result.data)
      } catch {
        setError('Failed to fetch student')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchStudent()
    }
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this student?')) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/students/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/students')
      } else {
        const result = await response.json()
        alert(result.error || 'Failed to delete student')
      }
    } catch {
      alert('Failed to delete student')
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

  if (error || !student) {
    return (
      <div className="space-y-4">
        <Link href="/students">
          <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>
            Back to Students
          </Button>
        </Link>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{error || 'Student not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName = `${student.first_name} ${student.last_name || ''}`.trim()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/students">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-gray-500">{student.admission_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/students/${student.id}/edit`}>
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
                  <p className="text-sm text-gray-500">Admission Number</p>
                  <p className="font-medium">{student.admission_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">
                    {new Date(student.date_of_birth).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">{student.gender || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Blood Group</p>
                  <p className="font-medium">{student.blood_group || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={student.status === 'active' ? 'success' : 'danger'}>
                    {student.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium">{student.current_class?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Section</p>
                  <p className="font-medium">{student.current_section?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Roll Number</p>
                  <p className="font-medium">{student.roll_number || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Admission Date</p>
                  <p className="font-medium">
                    {new Date(student.admission_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Previous School</p>
                  <p className="font-medium">{student.previous_school || '-'}</p>
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
                    <p className="font-medium">{student.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{student.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Emergency Contact</p>
                    <p className="font-medium">{student.emergency_contact || '-'}</p>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">
                      {[student.address, student.city, student.state, student.pincode]
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Medical Conditions</p>
                  <p className="font-medium">{student.medical_conditions || 'None'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Allergies</p>
                  <p className="font-medium">{student.allergies || 'None'}</p>
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
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={fullName}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {student.first_name.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{fullName}</h3>
                <p className="text-sm text-gray-500">
                  {student.current_class?.name || '-'} - {student.current_section?.name || '-'}
                </p>
                <Badge
                  variant={student.status === 'active' ? 'success' : 'danger'}
                  className="mt-2"
                >
                  {student.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Parents/Guardians */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Parents/Guardians
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.student_parents && student.student_parents.length > 0 ? (
                <div className="space-y-4">
                  {student.student_parents.map((sp, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {sp.parents.first_name} {sp.parents.last_name || ''}
                        </p>
                        {sp.is_primary && (
                          <Badge variant="info">Primary</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 capitalize">{sp.relationship}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {sp.parents.phone}
                        </p>
                        {sp.parents.email && (
                          <p className="text-sm flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {sp.parents.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No parent information available</p>
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
                <Link href={`/attendance/students?student=${student.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start" icon={<Clock className="h-4 w-4" />}>
                    View Attendance
                  </Button>
                </Link>
                <Link href={`/fees?student=${student.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start" icon={<CreditCard className="h-4 w-4" />}>
                    View Fees
                  </Button>
                </Link>
                <Link href={`/exams/results?student=${student.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start" icon={<FileText className="h-4 w-4" />}>
                    View Results
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
