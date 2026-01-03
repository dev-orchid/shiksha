'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Building2,
  Users,
  Loader2,
} from 'lucide-react'

interface Department {
  id: string
  name: string
  code: string | null
  description: string | null
  is_active: boolean
  head_id: string | null
  created_at: string
}

interface DepartmentForm {
  name: string
  code: string
  description: string
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<DepartmentForm>({
    name: '',
    code: '',
    description: '',
  })

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
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '' })
    setError(null)
  }

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setError('Department name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create department')
        return
      }

      setDepartments((prev) => [...prev, data.data])
      setShowAddModal(false)
      resetForm()
    } catch {
      setError('Failed to create department')
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (department: Department) => {
    setSelectedDepartment(department)
    setFormData({
      name: department.name,
      code: department.code || '',
      description: department.description || '',
    })
    setShowEditModal(true)
  }

  const handleEdit = async () => {
    if (!selectedDepartment || !formData.name.trim()) {
      setError('Department name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update department')
        return
      }

      setDepartments((prev) =>
        prev.map((d) => (d.id === selectedDepartment.id ? data.data : d))
      )
      setShowEditModal(false)
      setSelectedDepartment(null)
      resetForm()
    } catch {
      setError('Failed to update department')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (department: Department) => {
    setSelectedDepartment(department)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!selectedDepartment) return

    setSaving(true)

    try {
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete department')
        return
      }

      setDepartments((prev) => prev.filter((d) => d.id !== selectedDepartment.id))
      setShowDeleteModal(false)
      setSelectedDepartment(null)
    } catch {
      setError('Failed to delete department')
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
        <Link href="/settings">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 mt-1">Manage school departments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{departments.length}</p>
                <p className="text-xs text-gray-500">Total Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {departments.filter((d) => d.is_active).length}
                </p>
                <p className="text-xs text-gray-500">Active Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Departments</CardTitle>
          <Button
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
          >
            Add Department
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {departments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No departments found</p>
              <Button
                className="mt-4"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  resetForm()
                  setShowAddModal(true)
                }}
              >
                Add First Department
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {departments.map((department) => (
                <div key={department.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{department.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {department.code && (
                          <>
                            <span className="text-sm text-gray-500">
                              Code: {department.code}
                            </span>
                            <span className="text-xs text-gray-400">|</span>
                          </>
                        )}
                        {department.description && (
                          <span className="text-sm text-gray-500">
                            {department.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={department.is_active ? 'success' : 'default'}>
                        {department.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <button
                        onClick={() => handleEditClick(department)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(department)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Add New Department"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={saving}
              icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {saving ? 'Saving...' : 'Save Department'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <Input
            label="Department Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Science"
            required
          />
          <Input
            label="Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., SCI"
          />
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional description"
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedDepartment(null)
          resetForm()
        }}
        title="Edit Department"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setSelectedDepartment(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={saving}
              icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {saving ? 'Saving...' : 'Update Department'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <Input
            label="Department Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Science"
            required
          />
          <Input
            label="Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., SCI"
          />
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional description"
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedDepartment(null)
        }}
        title="Delete Department"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedDepartment(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={saving}
              icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete the department &quot;{selectedDepartment?.name}&quot;?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
