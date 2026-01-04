'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useSession } from '@/components/providers/SessionProvider'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  IndianRupee,
  Save,
  X,
  Loader2,
} from 'lucide-react'
import { EMPLOYEE_TYPE_OPTIONS_WITH_ALL, getEmployeeTypeLabel, EmployeeType } from '@/lib/constants/employee-types'

interface SalaryComponent {
  id: string
  name: string
  component_type: 'earning' | 'deduction'
  is_percentage: boolean
  is_taxable: boolean
  is_active: boolean
  default_value?: number
}

interface SalaryStructure {
  id: string
  name: string
  description: string | null
  employee_type: 'teaching' | 'non_teaching' | 'administrative' | 'support' | null
  components: Array<{
    id: string
    componentId: string
    name: string
    type: 'earning' | 'deduction'
    amount: number
    percentage?: number
  }>
  is_active: boolean
}


export default function SalaryStructurePage() {
  const { profile } = useSession()
  const [components, setComponents] = useState<SalaryComponent[]>([])
  const [structures, setStructures] = useState<SalaryStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [showComponentForm, setShowComponentForm] = useState(false)
  const [showStructureForm, setShowStructureForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [componentForm, setComponentForm] = useState({
    id: '',
    name: '',
    component_type: 'earning',
    is_percentage: false,
    is_taxable: false,
    default_value: '',
  })
  const [editingComponent, setEditingComponent] = useState(false)
  const [creatingDefaults, setCreatingDefaults] = useState(false)

  const [structureForm, setStructureForm] = useState({
    id: '',
    name: '',
    description: '',
    employee_type: '',
    components: [] as Array<{ component_id: string; value: string }>,
  })
  const [editingStructure, setEditingStructure] = useState(false)

  useEffect(() => {
    if (profile?.schoolId) {
      fetchData()
    }
  }, [profile?.schoolId])

  const fetchData = async () => {
    if (!profile?.schoolId) return

    try {
      const [componentsRes, structuresRes] = await Promise.all([
        fetch(`/api/salary/components?school_id=${profile.schoolId}`),
        fetch(`/api/salary/structures?school_id=${profile.schoolId}`),
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
    if (!profile?.schoolId) return
    setSaving(true)

    try {
      const isEditing = editingComponent && componentForm.id
      const response = await fetch('/api/salary/components', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing ? { id: componentForm.id } : { school_id: profile.schoolId }),
          name: componentForm.name,
          component_type: componentForm.component_type,
          is_percentage: componentForm.is_percentage,
          is_taxable: componentForm.is_taxable,
          default_value: componentForm.default_value ? parseFloat(componentForm.default_value) : null,
        }),
      })

      if (response.ok) {
        fetchData()
        setShowComponentForm(false)
        setEditingComponent(false)
        setComponentForm({ id: '', name: '', component_type: 'earning', is_percentage: false, is_taxable: false, default_value: '' })
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

  const handleEditComponent = (component: SalaryComponent) => {
    setComponentForm({
      id: component.id,
      name: component.name,
      component_type: component.component_type,
      is_percentage: component.is_percentage,
      is_taxable: component.is_taxable,
      default_value: component.default_value ? String(component.default_value) : '',
    })
    setEditingComponent(true)
    setShowComponentForm(true)
  }

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.schoolId) return
    setSaving(true)

    try {
      // Map components with proper amount/percentage based on component type
      const mappedComponents = structureForm.components.map((c) => {
        const component = components.find(comp => comp.id === c.component_id)
        const value = parseFloat(c.value) || 0
        if (component?.is_percentage) {
          return { component_id: c.component_id, percentage: value }
        }
        return { component_id: c.component_id, amount: value }
      })

      const isEditing = editingStructure && structureForm.id
      const response = await fetch('/api/salary/structures', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing ? { id: structureForm.id } : {}),
          school_id: profile.schoolId,
          name: structureForm.name,
          description: structureForm.description,
          employee_type: structureForm.employee_type || null,
          components: mappedComponents,
        }),
      })

      if (response.ok) {
        fetchData()
        setShowStructureForm(false)
        setEditingStructure(false)
        setStructureForm({ id: '', name: '', description: '', employee_type: '', components: [] })
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

  const handleEditStructure = (structure: SalaryStructure) => {
    // Map structure components to form format
    const formComponents = structure.components?.map(c => ({
      component_id: c.componentId,
      value: String(c.percentage || c.amount || 0),
    })) || []

    setStructureForm({
      id: structure.id,
      name: structure.name,
      description: structure.description || '',
      employee_type: structure.employee_type || '',
      components: formComponents,
    })
    setEditingStructure(true)
    setShowStructureForm(true)
  }

  const handleDeleteComponent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return

    try {
      const response = await fetch(`/api/salary/components?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchData()
      } else {
        alert('Failed to delete component')
      }
    } catch {
      alert('Failed to delete component')
    }
  }

  const handleCreateDefaults = async () => {
    if (!profile?.schoolId) return
    setCreatingDefaults(true)

    try {
      const response = await fetch('/api/salary/components/defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: profile.schoolId }),
      })

      const result = await response.json()
      if (response.ok) {
        fetchData()
        alert(result.message)
      } else {
        alert(result.error || 'Failed to create default components')
      }
    } catch {
      alert('Failed to create default components')
    } finally {
      setCreatingDefaults(false)
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

    // Auto-populate default value when component is selected
    if (field === 'component_id' && value) {
      const component = components.find(c => c.id === value)
      if (component?.default_value && !updated[index].value) {
        updated[index].value = String(component.default_value)
      }
    }

    setStructureForm({ ...structureForm, components: updated })
  }

  const getComponentPlaceholder = (componentId: string) => {
    const component = components.find(c => c.id === componentId)
    if (component?.is_percentage) {
      return '% of Basic'
    }
    return 'Amount (₹)'
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
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateDefaults}
                  disabled={creatingDefaults}
                >
                  {creatingDefaults ? 'Creating...' : 'Add Defaults'}
                </Button>
                <Button
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowComponentForm(true)}
                >
                  Add Component
                </Button>
              </div>
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
                      value={componentForm.component_type}
                      onChange={(e) => setComponentForm({ ...componentForm, component_type: e.target.value })}
                      options={[
                        { value: 'earning', label: 'Earning' },
                        { value: 'deduction', label: 'Deduction' },
                      ]}
                    />
                    <Input
                      label="Default Value"
                      type="number"
                      value={componentForm.default_value}
                      onChange={(e) => setComponentForm({ ...componentForm, default_value: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={componentForm.is_percentage}
                        onChange={(e) => setComponentForm({ ...componentForm, is_percentage: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Percentage Based</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={componentForm.is_taxable}
                        onChange={(e) => setComponentForm({ ...componentForm, is_taxable: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Taxable</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving} icon={<Save className="h-4 w-4" />}>
                      {saving ? 'Saving...' : (editingComponent ? 'Update' : 'Save')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowComponentForm(false)
                        setEditingComponent(false)
                        setComponentForm({ id: '', name: '', component_type: 'earning', is_percentage: false, is_taxable: false, default_value: '' })
                      }}
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
                      <Badge variant={component.component_type === 'earning' ? 'success' : 'danger'}>
                        {component.component_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {component.is_percentage ? 'Percentage' : 'Fixed'} • {component.is_taxable ? 'Taxable' : 'Non-taxable'}
                      {component.default_value ? ` • Default: ₹${component.default_value.toLocaleString('en-IN')}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditComponent(component)}
                      className="p-1 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteComponent(component.id)}
                      className="p-1 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
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
                  <Select
                    label="Employee Type"
                    value={structureForm.employee_type}
                    onChange={(e) => setStructureForm({ ...structureForm, employee_type: e.target.value })}
                    options={EMPLOYEE_TYPE_OPTIONS_WITH_ALL}
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
                            ...components.map((c) => ({
                              value: c.id,
                              label: `${c.name} (${c.is_percentage ? '%' : '₹'})`
                            })),
                          ]}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={comp.value}
                          onChange={(e) => updateStructureComponent(index, 'value', e.target.value)}
                          placeholder={getComponentPlaceholder(comp.component_id)}
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
                      {saving ? 'Saving...' : (editingStructure ? 'Update' : 'Save')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowStructureForm(false)
                        setEditingStructure(false)
                        setStructureForm({ id: '', name: '', description: '', employee_type: '', components: [] })
                      }}
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{structure.name}</p>
                      {structure.employee_type && (
                        <Badge variant="info">
                          {getEmployeeTypeLabel(structure.employee_type)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditStructure(structure)}
                        className="p-1 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </button>
                      <Badge variant={structure.is_active ? 'success' : 'danger'}>
                        {structure.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  {structure.description && (
                    <p className="text-sm text-gray-500 mb-2">{structure.description}</p>
                  )}
                  {structure.components && structure.components.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {structure.components.map((c, i) => (
                        <span key={i}>
                          {c.name}: {c.percentage ? `${c.percentage}%` : `₹${(c.amount || 0).toLocaleString('en-IN')}`}
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
