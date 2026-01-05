'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, Save, Loader2, Upload, X, UserPlus, Trash2, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface Parent {
  id: string
  first_name: string
  last_name: string | null
  relation: string
  phone: string | null
  email: string | null
}

interface StudentParent {
  is_primary: boolean
  parents: Parent
}

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

  // Parent management state
  const [linkedParents, setLinkedParents] = useState<StudentParent[]>([])
  const [showAddParentModal, setShowAddParentModal] = useState(false)
  const [parentSearch, setParentSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Parent[]>([])
  const [searchingParents, setSearchingParents] = useState(false)
  const [addingParent, setAddingParent] = useState(false)
  const [newParentForm, setNewParentForm] = useState({
    first_name: '',
    last_name: '',
    relation: 'father',
    phone: '',
    email: '',
  })

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

        // Set linked parents if available
        if (studentData.data.student_parents) {
          setLinkedParents(studentData.data.student_parents)
        }

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

  // Parent management functions
  const searchParents = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }
    setSearchingParents(true)
    try {
      const response = await fetch(`/api/parents?search=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        // Filter out already linked parents
        const linkedIds = linkedParents.map(lp => lp.parents.id)
        setSearchResults((data.data || []).filter((p: Parent) => !linkedIds.includes(p.id)))
      }
    } catch (err) {
      console.error('Error searching parents:', err)
    } finally {
      setSearchingParents(false)
    }
  }

  const linkExistingParent = async (parentId: string, relation: string) => {
    setAddingParent(true)
    try {
      const response = await fetch(`/api/students/${params.id}/parents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: parentId, relation }),
      })
      if (response.ok) {
        // Refresh student data to get updated parents
        const studentRes = await fetch(`/api/students/${params.id}`)
        if (studentRes.ok) {
          const studentData = await studentRes.json()
          setLinkedParents(studentData.data.student_parents || [])
        }
        setShowAddParentModal(false)
        setParentSearch('')
        setSearchResults([])
      } else {
        const err = await response.json()
        alert(err.error || 'Failed to link parent')
      }
    } catch (err) {
      console.error('Error linking parent:', err)
      alert('Failed to link parent')
    } finally {
      setAddingParent(false)
    }
  }

  const createAndLinkParent = async () => {
    if (!newParentForm.first_name) {
      alert('Parent first name is required')
      return
    }
    setAddingParent(true)
    try {
      const response = await fetch(`/api/students/${params.id}/parents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newParentForm),
      })
      if (response.ok) {
        // Refresh student data
        const studentRes = await fetch(`/api/students/${params.id}`)
        if (studentRes.ok) {
          const studentData = await studentRes.json()
          setLinkedParents(studentData.data.student_parents || [])
        }
        setShowAddParentModal(false)
        setNewParentForm({ first_name: '', last_name: '', relation: 'father', phone: '', email: '' })
      } else {
        const err = await response.json()
        alert(err.error || 'Failed to create parent')
      }
    } catch (err) {
      console.error('Error creating parent:', err)
      alert('Failed to create parent')
    } finally {
      setAddingParent(false)
    }
  }

  const unlinkParent = async (parentId: string) => {
    if (!confirm('Are you sure you want to unlink this parent?')) return
    try {
      const response = await fetch(`/api/students/${params.id}/parents?parent_id=${parentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setLinkedParents(prev => prev.filter(lp => lp.parents.id !== parentId))
      } else {
        const err = await response.json()
        alert(err.error || 'Failed to unlink parent')
      }
    } catch (err) {
      console.error('Error unlinking parent:', err)
      alert('Failed to unlink parent')
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

          {/* Parent/Guardian Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Parent/Guardian Information</CardTitle>
              <Button
                type="button"
                size="sm"
                icon={<UserPlus className="h-4 w-4" />}
                onClick={() => setShowAddParentModal(true)}
              >
                Add Parent
              </Button>
            </CardHeader>
            <CardContent>
              {linkedParents.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No parents linked to this student.</p>
                  <p className="text-sm mt-1">Click &quot;Add Parent&quot; to link a parent/guardian.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedParents.map((sp) => (
                    <div key={sp.parents.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sp.parents.first_name} {sp.parents.last_name}
                          <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            {sp.parents.relation}
                          </span>
                          {sp.is_primary && (
                            <span className="ml-1 text-xs font-normal px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              Primary
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {sp.parents.phone && <span className="mr-3">{sp.parents.phone}</span>}
                          {sp.parents.email && <span>{sp.parents.email}</span>}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => unlinkParent(sp.parents.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="Unlink parent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Add Parent Modal */}
      <Modal
        open={showAddParentModal}
        onClose={() => {
          setShowAddParentModal(false)
          setParentSearch('')
          setSearchResults([])
          setNewParentForm({ first_name: '', last_name: '', relation: 'father', phone: '', email: '' })
        }}
        title="Add Parent/Guardian"
      >
        <div className="space-y-6">
          {/* Search Existing Parents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Existing Parents
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={parentSearch}
                onChange={(e) => {
                  setParentSearch(e.target.value)
                  searchParents(e.target.value)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {searchingParents && (
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            )}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => linkExistingParent(p.id, p.relation)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {p.first_name} {p.last_name}
                        <span className="ml-2 text-xs text-gray-500">({p.relation})</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {p.phone && <span className="mr-2">{p.phone}</span>}
                        {p.email && <span>{p.email}</span>}
                      </p>
                    </div>
                    <Button size="sm" disabled={addingParent}>Link</Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or create new parent</span>
            </div>
          </div>

          {/* Create New Parent Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={newParentForm.first_name}
                onChange={(e) => setNewParentForm(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
              <Input
                label="Last Name"
                value={newParentForm.last_name}
                onChange={(e) => setNewParentForm(prev => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
            <Select
              label="Relation"
              value={newParentForm.relation}
              onChange={(e) => setNewParentForm(prev => ({ ...prev, relation: e.target.value }))}
              options={[
                { value: 'father', label: 'Father' },
                { value: 'mother', label: 'Mother' },
                { value: 'guardian', label: 'Guardian' },
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                type="tel"
                value={newParentForm.phone}
                onChange={(e) => setNewParentForm(prev => ({ ...prev, phone: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                value={newParentForm.email}
                onChange={(e) => setNewParentForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={createAndLinkParent}
              disabled={addingParent || !newParentForm.first_name}
              icon={addingParent ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            >
              {addingParent ? 'Creating...' : 'Create & Link Parent'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
