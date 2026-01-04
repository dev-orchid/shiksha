'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { EMPLOYEE_TYPE_OPTIONS } from '@/lib/constants/employee-types'

interface Department {
  id: string
  name: string
}

export default function EditTeacherPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    designation: '',
    department_id: '',
    employee_type: 'teaching',
    employment_type: 'permanent',
    experience_years: '0',
    highest_qualification: '',
    specialization: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    blood_group: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    bank_name: '',
    bank_account_number: '',
    ifsc_code: '',
    status: 'active',
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [teacherRes, deptRes] = await Promise.all([
          fetch(`/api/staff/${params.id}`),
          fetch('/api/departments'),
        ])

        if (!teacherRes.ok) {
          setError('Failed to fetch teacher')
          return
        }

        const teacherData = await teacherRes.json()
        const teacher = teacherData.data

        setFormData({
          first_name: teacher.first_name || '',
          last_name: teacher.last_name || '',
          email: teacher.email || '',
          phone: teacher.phone || '',
          date_of_birth: teacher.date_of_birth?.split('T')[0] || '',
          gender: teacher.gender || '',
          designation: teacher.designation || '',
          department_id: teacher.department_id || '',
          employee_type: teacher.employee_type || 'teaching',
          employment_type: teacher.employment_type || 'permanent',
          experience_years: String(teacher.experience_years || 0),
          highest_qualification: teacher.highest_qualification || '',
          specialization: teacher.specialization || '',
          address: teacher.address || '',
          city: teacher.city || '',
          state: teacher.state || '',
          pincode: teacher.pincode || '',
          blood_group: teacher.blood_group || '',
          emergency_contact_name: teacher.emergency_contact_name || '',
          emergency_contact_phone: teacher.emergency_contact_phone || '',
          bank_name: teacher.bank_name || '',
          bank_account_number: teacher.bank_account_number || '',
          ifsc_code: teacher.ifsc_code || '',
          status: teacher.status || 'active',
        })

        if (deptRes.ok) {
          const deptData = await deptRes.json()
          setDepartments(deptData.data || [])
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/staff/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          experience_years: parseInt(formData.experience_years) || 0,
          department_id: formData.department_id || null,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Failed to update teacher')
        return
      }

      router.push(`/teachers/${params.id}`)
    } catch {
      setError('Failed to update teacher')
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
        <Link href={`/teachers/${params.id}`}>
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Teacher</h1>
          <p className="text-gray-500">Update teacher information</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    { value: 'on_leave', label: 'On Leave' },
                    { value: 'resigned', label: 'Resigned' },
                    { value: 'terminated', label: 'Terminated' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
              />
              <Select
                label="Department"
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select Department' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Employee Type"
                  name="employee_type"
                  value={formData.employee_type}
                  onChange={handleChange}
                  options={EMPLOYEE_TYPE_OPTIONS}
                />
                <Select
                  label="Employment Type"
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  options={[
                    { value: 'permanent', label: 'Permanent' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'temporary', label: 'Temporary' },
                  ]}
                />
              </div>
              <Input
                label="Experience (Years)"
                name="experience_years"
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={handleChange}
              />
              <Input
                label="Highest Qualification"
                name="highest_qualification"
                value={formData.highest_qualification}
                onChange={handleChange}
              />
              <Input
                label="Specialization"
                name="specialization"
                value={formData.specialization}
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
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
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
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Emergency Contact Name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                />
                <Input
                  label="Emergency Contact Phone"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Bank Name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
              />
              <Input
                label="Account Number"
                name="bank_account_number"
                value={formData.bank_account_number}
                onChange={handleChange}
              />
              <Input
                label="IFSC Code"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleChange}
              />
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href={`/teachers/${params.id}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
