'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

interface Department {
  id: string
  name: string
}

export default function NewTeacherPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])

  const [formData, setFormData] = useState({
    employee_id: '',
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
    joining_date: new Date().toISOString().split('T')[0],
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
  })

  useEffect(() => {
    async function fetchDepartments() {
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
    fetchDepartments()
  }, [])

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
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          experience_years: parseInt(formData.experience_years) || 0,
          department_id: formData.department_id || null,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Failed to create teacher')
        return
      }

      const result = await response.json()
      router.push(`/teachers/${result.data.id}`)
    } catch {
      setError('Failed to create teacher')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/teachers">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Teacher</h1>
          <p className="text-gray-500">Enter teacher details</p>
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
              <Input
                label="Employee ID"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                required
                placeholder="EMP-001"
              />
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
                placeholder="Senior Teacher"
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
                  options={[
                    { value: 'teaching', label: 'Teaching' },
                    { value: 'non-teaching', label: 'Non-Teaching' },
                    { value: 'admin', label: 'Admin' },
                  ]}
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
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Joining Date"
                  name="joining_date"
                  type="date"
                  value={formData.joining_date}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Experience (Years)"
                  name="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={handleChange}
                />
              </div>
              <Input
                label="Highest Qualification"
                name="highest_qualification"
                value={formData.highest_qualification}
                onChange={handleChange}
                placeholder="M.Sc., B.Ed."
              />
              <Input
                label="Specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="Physics"
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
                  required
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
          <Link href="/teachers">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            {saving ? 'Saving...' : 'Add Teacher'}
          </Button>
        </div>
      </form>
    </div>
  )
}
