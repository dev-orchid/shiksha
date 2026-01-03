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

interface SalaryComponent {
  id: string
  name: string
  type: 'earning' | 'deduction'
  calculation_type: 'fixed' | 'percentage'
  is_taxable: boolean
  is_active: boolean
}

interface SalaryStructure {
  id: string
  name: string
  description: string | null
  components: Array<{
    component_id: string
    value: number
    component?: SalaryComponent
  }>
  is_active: boolean
}

export default function SalaryStructurePage() {
  const [components, setComponents] = useState<SalaryComponent[]>([])
  const [structures, setStructures] = useState<SalaryStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [showComponentForm, setShowComponentForm] = useState(false)
  const [showStructureForm, setShowStructureForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [componentForm, setComponentForm] = useState({
    name: '',
    type: 'earning',
    calculation_type: 'fixed',
    is_taxable: false,
  })

  const [structureForm, setStructureForm] = useState({
    name: '',
    description: '',
    components: [] as Array<{ component_id: string; value: string }>,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [componentsRes, structuresRes] = await Promise.all([
        fetch('/api/salary/components'),
        fetch('/api/salary/structures'),
      ])

      if (componentsRes.ok) {
        const data = await componentsRes.json()
        setComponents(data.data || [])
      }
      if (structuresRes.ok) {
        const data = await structuresRes.json()
        setStructures(data.data || [])
      }
    } catch {
      console.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/salary/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(componentForm),
      })

      if (response.ok) {
        fetchData()
        setShowComponentForm(false)
        setComponentForm({ name: '', type: 'earning', calculation_type: 'fixed', is_taxable: false })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save component')
      }
    } catch {
      alert('Failed to save component')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/salary/structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...structureForm,
          components: structureForm.components.map((c) => ({
            component_id: c.component_id,
            value: parseFloat(c.value),
          })),
        }),
      })

      if (response.ok) {
        fetchData()
        setShowStructureForm(false)
        setStructureForm({ name: '', description: '', components: [] })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save structure')
      }
    } catch {
      alert('Failed to save structure')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteComponent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return

    try {
      const response = await fetch(`/api/salary/components/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchData()
      } else {
        alert('Failed to delete component')
      }
    } catch {
      alert('Failed to delete component')
    }
  }

  const addComponentToStructure = () => {
    setStructureForm({
      ...structureForm,
      components: [...structureForm.components, { component_id: '', value: '' }],
    })
  }

  const updateStructureComponent = (index: number, field: string, value: string) => {
    const updated = [...structureForm.components]
    updated[index] = { ...updated[index], [field]: value }
    setStructureForm({ ...structureForm, components: updated })
  }

  const removeStructureComponent = (index: number) => {
    const updated = structureForm.components.filter((_, i) => i !== index)
    setStructureForm({ ...structureForm, components: updated })
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
        <Link href="/salary">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Structure</h1>
          <p className="text-gray-500">Manage salary components and structures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Components */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Salary Components</CardTitle>
              <Button
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowComponentForm(true)}
              >
                Add Component
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showComponentForm && (
              <form onSubmit={handleSaveComponent} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  <Input
                    label="Component Name"
                    value={componentForm.name}
                    onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                    required
                    placeholder="e.g., Basic Salary"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Type"
                      value={componentForm.type}
                      onChange={(e) => setComponentForm({ ...componentForm, type: e.target.value as 'earning' | 'deduction' })}
                      options={[
                        { value: 'earning', label: 'Earning' },
                        { value: 'deduction', label: 'Deduction' },
                      ]}
                    />
                    <Select
                      label="Calculation"
                      value={componentForm.calculation_type}
                      onChange={(e) => setComponentForm({ ...componentForm, calculation_type: e.target.value as 'fixed' | 'percentage' })}
                      options={[
                        { value: 'fixed', label: 'Fixed Amount' },
                        { value: 'percentage', label: 'Percentage' },
                      ]}
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={componentForm.is_taxable}
                      onChange={(e) => setComponentForm({ ...componentForm, is_taxable: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Taxable</span>
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving} icon={<Save className="h-4 w-4" />}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowComponentForm(false)}
                      icon={<X className="h-4 w-4" />}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {components.map((component) => (
                <div
                  key={component.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{component.name}</p>
                      <Badge variant={component.type === 'earning' ? 'success' : 'danger'}>
                        {component.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {component.calculation_type} • {component.is_taxable ? 'Taxable' : 'Non-taxable'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteComponent(component.id)}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))}
              {components.length === 0 && (
                <p className="text-center py-4 text-gray-500">No components defined</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Salary Structures */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Salary Structures</CardTitle>
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
                  <Input
                    label="Structure Name"
                    value={structureForm.name}
                    onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                    required
                    placeholder="e.g., Senior Teacher Package"
                  />
                  <Input
                    label="Description"
                    value={structureForm.description}
                    onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
                    placeholder="Optional description"
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Components</label>
                      <Button type="button" size="sm" variant="outline" onClick={addComponentToStructure}>
                        Add
                      </Button>
                    </div>
                    {structureForm.components.map((comp, index) => (
                      <div key={index} className="flex gap-2">
                        <Select
                          value={comp.component_id}
                          onChange={(e) => updateStructureComponent(index, 'component_id', e.target.value)}
                          options={[
                            { value: '', label: 'Select Component' },
                            ...components.map((c) => ({ value: c.id, label: c.name })),
                          ]}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={comp.value}
                          onChange={(e) => updateStructureComponent(index, 'value', e.target.value)}
                          placeholder="Amount"
                          className="w-32"
                        />
                        <button
                          type="button"
                          onClick={() => removeStructureComponent(index)}
                          className="p-2 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ))}
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
                  className="p-3 bg-white border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{structure.name}</p>
                    <Badge variant={structure.is_active ? 'success' : 'danger'}>
                      {structure.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {structure.description && (
                    <p className="text-sm text-gray-500 mb-2">{structure.description}</p>
                  )}
                  {structure.components && structure.components.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {structure.components.map((c, i) => (
                        <span key={i}>
                          {c.component?.name}: ₹{c.value.toLocaleString('en-IN')}
                          {i < structure.components.length - 1 && ' • '}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {structures.length === 0 && (
                <p className="text-center py-4 text-gray-500">No structures defined</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
