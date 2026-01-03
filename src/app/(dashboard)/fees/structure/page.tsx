'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  IndianRupee,
  Save,
  X,
} from 'lucide-react'

interface FeeCategory {
  id: string
  name: string
  description: string | null
  is_active: boolean
}

interface FeeStructure {
  id: string
  class_id: string
  fee_category_id: string
  amount: number
  frequency: string
  due_day: number
  late_fee: number
  classes?: { id: string; name: string }
  fee_categories?: { id: string; name: string }
}

interface Class {
  id: string
  name: string
}

export default function FeeStructurePage() {
  const [categories, setCategories] = useState<FeeCategory[]>([])
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showStructureForm, setShowStructureForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null)
  const [saving, setSaving] = useState(false)

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  })

  const [structureForm, setStructureForm] = useState({
    class_id: '',
    fee_category_id: '',
    amount: '',
    frequency: 'monthly',
    due_day: '10',
    late_fee: '0',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, structuresRes, classesRes] = await Promise.all([
        fetch('/api/fees/categories'),
        fetch('/api/fees/structures'),
        fetch('/api/classes'),
      ])

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.data || [])
      }
      if (structuresRes.ok) {
        const data = await structuresRes.json()
        setStructures(data.data || [])
      }
      if (classesRes.ok) {
        const data = await classesRes.json()
        setClasses(data.data || [])
      }
    } catch {
      console.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingCategory
        ? `/api/fees/categories/${editingCategory.id}`
        : '/api/fees/categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      })

      if (response.ok) {
        fetchData()
        setShowCategoryForm(false)
        setEditingCategory(null)
        setCategoryForm({ name: '', description: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save category')
      }
    } catch {
      alert('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/fees/structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...structureForm,
          amount: parseFloat(structureForm.amount),
          due_day: parseInt(structureForm.due_day),
          late_fee: parseFloat(structureForm.late_fee),
        }),
      })

      if (response.ok) {
        fetchData()
        setShowStructureForm(false)
        setStructureForm({
          class_id: '',
          fee_category_id: '',
          amount: '',
          frequency: 'monthly',
          due_day: '10',
          late_fee: '0',
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save fee structure')
      }
    } catch {
      alert('Failed to save fee structure')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/fees/categories/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData()
      } else {
        alert('Failed to delete category')
      }
    } catch {
      alert('Failed to delete category')
    }
  }

  const handleDeleteStructure = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return

    try {
      const response = await fetch(`/api/fees/structures/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData()
      } else {
        alert('Failed to delete fee structure')
      }
    } catch {
      alert('Failed to delete fee structure')
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
        <Link href="/fees">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Structure</h1>
          <p className="text-gray-500">Manage fee categories and amounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fee Categories</CardTitle>
              <Button
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryForm({ name: '', description: '' })
                  setShowCategoryForm(true)
                }}
              >
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showCategoryForm && (
              <form onSubmit={handleSaveCategory} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  <Input
                    label="Category Name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    required
                    placeholder="e.g., Tuition Fee"
                  />
                  <Input
                    label="Description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Optional description"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving} icon={<Save className="h-4 w-4" />}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCategoryForm(false)}
                      icon={<X className="h-4 w-4" />}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-gray-500">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={category.is_active ? 'success' : 'danger'}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <button
                      onClick={() => {
                        setEditingCategory(category)
                        setCategoryForm({
                          name: category.name,
                          description: category.description || '',
                        })
                        setShowCategoryForm(true)
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-center py-4 text-gray-500">No categories defined</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fee Structures */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fee Amounts by Class</CardTitle>
              <Button
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowStructureForm(true)}
              >
                Add Structure
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showStructureForm && (
              <form onSubmit={handleSaveStructure} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  <Select
                    label="Class"
                    value={structureForm.class_id}
                    onChange={(e) => setStructureForm({ ...structureForm, class_id: e.target.value })}
                    options={[
                      { value: '', label: 'Select Class' },
                      ...classes.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    required
                  />
                  <Select
                    label="Fee Category"
                    value={structureForm.fee_category_id}
                    onChange={(e) => setStructureForm({ ...structureForm, fee_category_id: e.target.value })}
                    options={[
                      { value: '', label: 'Select Category' },
                      ...categories.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Amount"
                      type="number"
                      min="0"
                      value={structureForm.amount}
                      onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                      required
                    />
                    <Select
                      label="Frequency"
                      value={structureForm.frequency}
                      onChange={(e) => setStructureForm({ ...structureForm, frequency: e.target.value })}
                      options={[
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'quarterly', label: 'Quarterly' },
                        { value: 'half_yearly', label: 'Half Yearly' },
                        { value: 'yearly', label: 'Yearly' },
                        { value: 'one_time', label: 'One Time' },
                      ]}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Due Day of Month"
                      type="number"
                      min="1"
                      max="28"
                      value={structureForm.due_day}
                      onChange={(e) => setStructureForm({ ...structureForm, due_day: e.target.value })}
                    />
                    <Input
                      label="Late Fee"
                      type="number"
                      min="0"
                      value={structureForm.late_fee}
                      onChange={(e) => setStructureForm({ ...structureForm, late_fee: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving} icon={<Save className="h-4 w-4" />}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStructureForm(false)}
                      icon={<X className="h-4 w-4" />}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {structures.map((structure) => (
                <div
                  key={structure.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{structure.classes?.name}</Badge>
                      <span className="text-gray-500">•</span>
                      <span className="font-medium">{structure.fee_categories?.name}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {structure.frequency} • Due on {structure.due_day}th
                      {structure.late_fee > 0 && ` • Late fee: ₹${structure.late_fee}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {structure.amount.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleDeleteStructure(structure.id)}
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
              {structures.length === 0 && (
                <p className="text-center py-4 text-gray-500">No fee structures defined</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
