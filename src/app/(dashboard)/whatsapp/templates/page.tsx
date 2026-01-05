'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  Plus,
  FileText,
  Edit,
  Trash2,
  Save,
  X,
  Copy,
} from 'lucide-react'
import { useSession } from '@/components/providers/SessionProvider'

interface Template {
  id: string
  name: string
  category: string
  content: string
  variables: string[]
  is_active: boolean
  created_at: string
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'fee_reminder', label: 'Fee Reminder' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'exam', label: 'Exam Related' },
  { value: 'result', label: 'Result' },
  { value: 'announcement', label: 'Announcement' },
]

export default function WhatsAppTemplatesPage() {
  const { profile } = useSession()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    content: '',
  })

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const schoolId = profile?.schoolId
      const params = schoolId ? `?school_id=${schoolId}` : ''
      const response = await fetch(`/api/whatsapp/templates${params}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.data || [])
      }
    } catch {
      console.error('Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }, [profile?.schoolId])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingId
        ? `/api/whatsapp/templates/${editingId}`
        : '/api/whatsapp/templates'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          school_id: profile?.schoolId,
        }),
      })

      if (response.ok) {
        fetchTemplates()
        setShowForm(false)
        setEditingId(null)
        setFormData({ name: '', category: 'general', content: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save template')
      }
    } catch {
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (template: Template) => {
    setEditingId(template.id)
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/whatsapp/templates/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchTemplates()
      } else {
        alert('Failed to delete template')
      }
    } catch {
      alert('Failed to delete template')
    }
  }

  const copyTemplate = (content: string) => {
    navigator.clipboard.writeText(content)
    alert('Template copied to clipboard')
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
      general: 'info',
      fee_reminder: 'success',
      attendance: 'warning',
      exam: 'danger',
      result: 'success',
      announcement: 'info',
    }
    return colors[category] || 'info'
  }

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category)
    return cat?.label || category
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/whatsapp">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
            <p className="text-gray-500">Create and manage message templates</p>
          </div>
        </div>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingId(null)
            setFormData({ name: '', category: 'general', content: '' })
            setShowForm(true)
          }}
        >
          Create Template
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Template' : 'Create New Template'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Template Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Fee Reminder"
                />
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={CATEGORIES}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  required
                  placeholder="Enter message content. Use {{variable}} for dynamic content."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {'{{student_name}}'}, {'{{class}}'}, {'{{amount}}'}, {'{{date}}'}, {'{{school_name}}'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} icon={<Save className="h-4 w-4" />}>
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                  icon={<X className="h-4 w-4" />}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No templates created yet</p>
                <p className="text-sm">Create templates to speed up messaging</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <Badge variant={getCategoryColor(template.category)} className="mt-1">
                      {getCategoryLabel(template.category)}
                    </Badge>
                  </div>
                  <Badge variant={template.is_active ? 'success' : 'danger'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{template.content}</p>
                </div>
                {template.variables && template.variables.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.variables.map((v) => (
                      <span key={v} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyTemplate(template.content)}
                    icon={<Copy className="h-4 w-4" />}
                  >
                    Copy
                  </Button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
