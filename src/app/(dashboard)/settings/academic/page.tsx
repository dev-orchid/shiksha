'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  Plus,
  Calendar,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
} from 'lucide-react'

interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
}

export default function AcademicSettingsPage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    fetchYears()
  }, [])

  const fetchYears = async () => {
    try {
      const response = await fetch('/api/academic-years')
      if (response.ok) {
        const data = await response.json()
        setYears(data.data || [])
      }
    } catch {
      console.error('Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingId ? `/api/academic-years/${editingId}` : '/api/academic-years'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchYears()
        setShowForm(false)
        setEditingId(null)
        setFormData({ name: '', start_date: '', end_date: '' })
      } else {
        alert('Failed to save')
      }
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (year: AcademicYear) => {
    setEditingId(year.id)
    setFormData({
      name: year.name,
      start_date: year.start_date.split('T')[0],
      end_date: year.end_date.split('T')[0],
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this academic year?')) return

    try {
      const response = await fetch(`/api/academic-years/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchYears()
      } else {
        alert('Failed to delete')
      }
    } catch {
      alert('Failed to delete')
    }
  }

  const setAsCurrent = async (id: string) => {
    try {
      const response = await fetch(`/api/academic-years/${id}/set-current`, { method: 'POST' })
      if (response.ok) {
        fetchYears()
      } else {
        alert('Failed to set as current')
      }
    } catch {
      alert('Failed to set as current')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Year Settings</h1>
            <p className="text-gray-500">Manage academic years</p>
          </div>
        </div>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingId(null)
            setFormData({ name: '', start_date: '', end_date: '' })
            setShowForm(true)
          }}
        >
          Add Academic Year
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Academic Year' : 'Add Academic Year'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., 2024-25"
                />
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} icon={<Save className="h-4 w-4" />}>
                  {saving ? 'Saving...' : 'Save'}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Years
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : years.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No academic years defined</p>
            </div>
          ) : (
            <div className="space-y-3">
              {years.map((year) => (
                <div
                  key={year.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    year.is_current ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{year.name}</h3>
                        {year.is_current && <Badge variant="success">Current</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(year.start_date).toLocaleDateString('en-IN')} -{' '}
                        {new Date(year.end_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!year.is_current && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAsCurrent(year.id)}
                        icon={<CheckCircle className="h-4 w-4" />}
                      >
                        Set Current
                      </Button>
                    )}
                    <button
                      onClick={() => handleEdit(year)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(year.id)}
                      className="p-2 hover:bg-red-50 rounded"
                      disabled={year.is_current}
                    >
                      <Trash2 className={`h-4 w-4 ${year.is_current ? 'text-gray-300' : 'text-red-500'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
