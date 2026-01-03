'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, Save, Loader2, Upload, X } from 'lucide-react'

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
  roll_number: string | null
  status: string
  emergency_contact: string | null
  medical_conditions: string | null
  allergies: string | null
  previous_school: string | null
  current_class_id: string | null
  current_section_id: string | null
  photo_url: string | null
}

interface ClassOption {
  id: string
  name: string
}

interface SectionOption {
  id: string
  name: string
  class_id: string
}

export default function EditStudentPage() {
  const params = useParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [sections, setSections] = useState<SectionOption[]>([])
  const [filteredSections, setFilteredSections] = useState<SectionOption[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    roll_number: '',
    status: 'active',
    emergency_contact: '',
    medical_conditions: '',
    allergies: '',
    previous_school: '',
    class_id: '',
    section_id: '',
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch student, classes, and sections in parallel
        const [studentRes, classesRes, sectionsRes] = await Promise.all([
          fetch(`/api/students/${params.id}`),
          fetch('/api/classes'),
          fetch('/api/sections'),
        ])

        if (!studentRes.ok) {
          setError('Failed to fetch student')
          return
        }

        const studentData = await studentRes.json()
        const student: Student = studentData.data

        setFormData({
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          date_of_birth: student.date_of_birth?.split('T')[0] || '',
          gender: student.gender || '',
          blood_group: student.blood_group || '',
          phone: student.phone || '',
          email: student.email || '',
          address: student.address || '',
          city: student.city || '',
          state: student.state || '',
          pincode: student.pincode || '',
          roll_number: student.roll_number || '',
          status: student.status || 'active',
          emergency_contact: student.emergency_contact || '',
          medical_conditions: student.medical_conditions || '',
          allergies: student.allergies || '',
          previous_school: student.previous_school || '',
          class_id: student.current_class_id || '',
          section_id: student.current_section_id || '',
        })

        // Set existing photo
        if (student.photo_url) {
          setExistingPhotoUrl(student.photo_url)
        }

        if (classesRes.ok) {
          const classesData = await classesRes.json()
          setClasses(classesData.data || [])
        }

        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json()
          setSections(sectionsData.data || [])

          // Filter sections for current class
          if (student.current_class_id) {
            setFilteredSections(
              (sectionsData.data || []).filter(
                (s: SectionOption) => s.class_id === student.current_class_id
              )
            )
          }
        }
      } catch {
        setError('Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id])

  useEffect(() => {
    if (formData.class_id) {
      setFilteredSections(sections.filter((s) => s.class_id === formData.class_id))
    } else {
      setFilteredSections([])
    }
  }, [formData.class_id, sections])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Reset section when class changes
    if (name === 'class_id') {
      setFormData((prev) => ({ ...prev, section_id: '' }))
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size too large. Maximum size is 5MB.')
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
      setError(null)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
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
    setSaving(true)
    setError(null)

    try {
      // Upload photo if a new one is selected
      let photoUrl: string | null | undefined = undefined
      if (photoFile) {
        try {
          photoUrl = await uploadPhoto()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to upload photo')
          setSaving(false)
          return
        }
      } else if (existingPhotoUrl === null && !photoPreview) {
        // Photo was removed
        photoUrl = null
      }

      const response = await fetch(`/api/students/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name || null,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender || null,
          blood_group: formData.blood_group || null,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          roll_number: formData.roll_number || null,
          status: formData.status,
          current_class_id: formData.class_id || null,
          current_section_id: formData.section_id || null,
          previous_school: formData.previous_school || null,
          ...(photoUrl !== undefined && { photo_url: photoUrl }),
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Failed to update student')
        return
      }

      router.push(`/students/${params.id}`)
    } catch {
      setError('Failed to update student')
    } finally {
      setSaving(false)
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
        <Link href={`/students/${params.id}`}>
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
          <p className="text-gray-500">Update student information</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    { value: '', label: 'Select Gender' },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Blood Group"
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Select Blood Group' },
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
                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'transferred', label: 'Transferred' },
                    { value: 'graduated', label: 'Graduated' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Class"
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select Class' },
                  ...classes.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              <Select
                label="Section"
                name="section_id"
                value={formData.section_id}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select Section' },
                  ...filteredSections.map((s) => ({ value: s.id, label: s.name })),
                ]}
                disabled={!formData.class_id}
              />
              <Input
                label="Roll Number"
                name="roll_number"
                value={formData.roll_number}
                onChange={handleChange}
              />
              <Input
                label="Previous School"
                name="previous_school"
                value={formData.previous_school}
                onChange={handleChange}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <Input
                label="Emergency Contact"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
              />
              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
                <Input
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                />
                <Input
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Conditions
                </label>
                <textarea
                  name="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter any medical conditions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter any allergies..."
                />
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Sidebar - Photo Upload */}
          <div className="space-y-6">
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
                  {photoPreview || existingPhotoUrl ? (
                    <div className="relative">
                      <div className="w-32 h-32 mx-auto rounded-full overflow-hidden relative">
                        <Image
                          src={photoPreview || existingPhotoUrl || ''}
                          alt="Student photo"
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
                      <p className="text-sm text-gray-500 mb-2">Click to upload photo</p>
                      <p className="text-xs text-gray-400">JPEG, PNG, WebP or GIF (max 5MB)</p>
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
                  disabled={saving}
                  icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href={`/students/${params.id}`} className="block">
                  <Button variant="outline" type="button" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
