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
  Users,
  MessageSquare,
  Edit,
  Trash2,
  Save,
  X,
} from 'lucide-react'
import { useSession } from '@/components/providers/SessionProvider'

interface WhatsAppGroup {
  id: string
  name: string
  group_type: string
  description: string | null
  member_count: number
  created_at: string
  is_active: boolean
}

const GROUP_TYPES = [
  { value: 'class', label: 'Class Group' },
  { value: 'parents', label: 'Parents Group' },
  { value: 'teachers', label: 'Teachers Group' },
  { value: 'custom', label: 'Custom Group' },
]

export default function WhatsAppGroupsPage() {
  const { profile } = useSession()
  const [groups, setGroups] = useState<WhatsAppGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_type: 'custom',
  })

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const schoolId = profile?.schoolId
      const params = schoolId ? `?school_id=${schoolId}` : ''
      const response = await fetch(`/api/whatsapp/groups${params}`)
      if (response.ok) {
        const data = await response.json()
        setGroups(data.data || [])
      }
    } catch {
      console.error('Failed to fetch groups')
    } finally {
      setLoading(false)
    }
  }, [profile?.schoolId])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/whatsapp/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          school_id: profile?.schoolId,
        }),
      })

      if (response.ok) {
        fetchGroups()
        setShowForm(false)
        setFormData({ name: '', description: '', group_type: 'custom' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create group')
      }
    } catch {
      alert('Failed to create group')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return

    try {
      const response = await fetch(`/api/whatsapp/groups/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchGroups()
      } else {
        alert('Failed to delete group')
      }
    } catch {
      alert('Failed to delete group')
    }
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
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Groups</h1>
            <p className="text-gray-500">Manage broadcast groups for messaging</p>
          </div>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>
          Create Group
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Group Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Class 10 Parents"
              />
              <Select
                label="Group Type"
                value={formData.group_type}
                onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
                options={GROUP_TYPES}
              />
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} icon={<Save className="h-4 w-4" />}>
                  {saving ? 'Creating...' : 'Create Group'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  icon={<X className="h-4 w-4" />}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No groups created yet</p>
                <p className="text-sm">Create your first group to start messaging</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          groups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Link href={`/whatsapp/groups/${group.id}`} className="block">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <Badge variant={group.is_active ? 'success' : 'danger'}>
                      {group.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  <p className="text-xs text-gray-400 capitalize">{group.group_type} group</p>
                  {group.description && (
                    <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {group.member_count || 0} members
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Link href={`/whatsapp/groups/${group.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full" icon={<Users className="h-4 w-4" />}>
                      Manage Members
                    </Button>
                  </Link>
                  <Link href={`/whatsapp/send?group=${group.id}`}>
                    <Button variant="outline" size="sm" icon={<MessageSquare className="h-4 w-4" />}>
                      Send
                    </Button>
                  </Link>
                  <button
                    onClick={() => handleDelete(group.id)}
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
