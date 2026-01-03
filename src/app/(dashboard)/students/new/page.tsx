'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'

interface ClassOption {
  id: string
  name: string
}

interface SectionOption {
  id: string
  name: string
}

export default function AddStudentPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [sections, setSections] = useState<SectionOption[]>([])
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    admission_number: '',
    class_id: '',
    section_id: '',
    roll_number: '',
    admission_date: '',
    previous_school: '',
    address: '',
    phone: '',
    email: '',
    father_name: '',
    father_phone: '',
    mother_name: '',
    mother_phone: '',
  })

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (formData.class_id) {
      fetchSections(formData.class_id)
    } else {
      setSections([])
    }
  }, [formData.class_id])

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size too large. Maximum size is 5MB.')
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null

    const formData = new FormData()
    formData.append('file', photoFile)
    formData.append('folder', 'students')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload photo')
    }

    const data = await response.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get school_id from the session/user context
      // For now, we'll fetch it from the API or use a default
      const schoolResponse = await fetch('/api/settings/school')
      let schoolId = null
      if (schoolResponse.ok) {
        const schoolData = await schoolResponse.json()
        schoolId = schoolData.data?.id
      }

      if (!schoolId) {
        // Try to get from schools list
        const schoolsResponse = await fetch('/api/schools')
        if (schoolsResponse.ok) {
          const schoolsData = await schoolsResponse.json()
          if (schoolsData.data && schoolsData.data.length > 0) {
            schoolId = schoolsData.data[0].id
          }
        }
      }

      if (!schoolId) {
        setError('No school configured. Please configure school settings first.')
        setLoading(false)
        return
      }

      // Upload photo if selected
      let photoUrl: string | null = null
      if (photoFile) {
        try {
          photoUrl = await uploadPhoto()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to upload photo')
          setLoading(false)
          return
        }
      }

      const payload = {
        school_id: schoolId,
        admission_number: formData.admission_number,
        first_name: formData.first_name,
        last_name: formData.last_name || formData.first_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        current_class_id: formData.class_id,
        current_section_id: formData.section_id,
        roll_number: formData.roll_number || undefined,
        blood_group: formData.blood_group || undefined,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        admission_date: formData.admission_date,
        previous_school: formData.previous_school || undefined,
        photo_url: photoUrl || undefined,
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/students')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create student')
        if (errorData.details) {
          const validationErrors = errorData.details
            .map((d: { path: string[]; message: string }) => `${d.path.join('.')}: ${d.message}`)
            .join(', ')
          setError(`Validation error: ${validationErrors}`)
        }
      }
    } catch (err) {
      setError('Failed to create student. Please try again.')
      console.error('Error creating student:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
          <p className="text-gray-500 mt-1">Fill in the details to register a new student</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic details about the student</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                  />
                  <Input
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                  />
                  <Select
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Select gender' },
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' },
                    ]}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Blood Group"
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Select blood group' },
                      { value: 'A+', label: 'A+' },
                      { value: 'A-', label: 'A-' },
                      { value: 'B+', label: 'B+' },
                      { value: 'B-', label: 'B-' },
                      { value: 'AB+', label: 'AB+' },
                      { value: 'AB-', label: 'AB-' },
                      { value: 'O+', label: 'O+' },
                      { value: 'O-', label: 'O-' },
                    ]}
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
                <CardDescription>Class and admission details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Admission Number"
                    name="admission_number"
                    value={formData.admission_number}
                    onChange={handleChange}
                    placeholder="STU-2024-XXX"
                    required
                  />
                  <Select
                    label="Class"
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Select class' },
                      ...classes.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    required
                  />
                  <Select
                    label="Section"
                    name="section_id"
                    value={formData.section_id}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Select section' },
                      ...sections.map((s) => ({ value: s.id, label: s.name })),
                    ]}
                    disabled={!formData.class_id}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Roll Number"
                    name="roll_number"
                    value={formData.roll_number}
                    onChange={handleChange}
                    placeholder="Enter roll number"
                  />
                  <Input
                    label="Admission Date"
                    name="admission_date"
                    type="date"
                    value={formData.admission_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Input
                  label="Previous School"
                  name="previous_school"
                  value={formData.previous_school}
                  onChange={handleChange}
                  placeholder="Enter previous school name (if any)"
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Address and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full address"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </CardContent>
            </Card>

            {/* Parent/Guardian Information */}
            <Card>
              <CardHeader>
                <CardTitle>Parent/Guardian Information</CardTitle>
                <CardDescription>Details of parents or guardians</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Father's Name"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleChange}
                    placeholder="Enter father's name"
                  />
                  <Input
                    label="Father's Phone"
                    name="father_phone"
                    value={formData.father_phone}
                    onChange={handleChange}
                    placeholder="Enter father's phone"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Mother's Name"
                    name="mother_name"
                    value={formData.mother_name}
                    onChange={handleChange}
                    placeholder="Enter mother's name"
                  />
                  <Input
                    label="Mother's Phone"
                    name="mother_phone"
                    value={formData.mother_phone}
                    onChange={handleChange}
                    placeholder="Enter mother's phone"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Student Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <div className="relative">
                      <div className="w-32 h-32 mx-auto rounded-full overflow-hidden relative">
                        <Image
                          src={photoPreview}
                          alt="Student photo preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemovePhoto()
                        }}
                        className="absolute top-0 right-1/2 translate-x-16 -translate-y-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="text-sm text-gray-500 mt-3">Click to change photo</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        Click to upload photo
                      </p>
                      <p className="text-xs text-gray-400">
                        JPEG, PNG, WebP or GIF (max 5MB)
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  icon={<Save className="h-4 w-4" />}
                  loading={loading}
                >
                  Save Student
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/students')}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
