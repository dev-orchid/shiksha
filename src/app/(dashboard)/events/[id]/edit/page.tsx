'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, Calendar, Trash2 } from 'lucide-react'

interface EventType {
  id: string
  name: string
  color: string
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type_id: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    is_all_day: true,
  })

  useEffect(() => {
    fetchEventTypes()
    fetchEvent()
  }, [eventId])

  const fetchEventTypes = async () => {
    try {
      const res = await fetch('/api/event-types')
      const json = await res.json()
      if (json.data) {
        setEventTypes(json.data)
      }
    } catch (error) {
      console.error('Error fetching event types:', error)
    }
  }

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`)
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to fetch event')
        return
      }

      const event = json.data
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type_id: event.event_type_id || '',
        start_date: event.start_date || '',
        end_date: event.end_date || '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        location: event.location || '',
        is_all_day: event.is_all_day ?? true,
      })
    } catch (error) {
      console.error('Error fetching event:', error)
      setError('Failed to fetch event')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          event_type_id: formData.event_type_id || null,
          end_date: formData.end_date || formData.start_date,
          start_time: formData.is_all_day ? null : formData.start_time || null,
          end_time: formData.is_all_day ? null : formData.end_time || null,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to update event')
        return
      }

      router.push('/events')
    } catch (error) {
      console.error('Error updating event:', error)
      setError('Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error || 'Failed to delete event')
        return
      }

      router.push('/events')
    } catch (error) {
      console.error('Error deleting event:', error)
      setError('Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/events">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-500 mt-1">Update event details</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Event Title *"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter event title"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter event description"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <Select
                  label="Event Type"
                  value={formData.event_type_id}
                  onChange={(e) =>
                    setFormData({ ...formData, event_type_id: e.target.value })
                  }
                  placeholder="Select event type"
                  options={eventTypes.map((type) => ({
                    value: type.id,
                    label: type.name,
                  }))}
                />

                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Enter event location"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Start Date *"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    min={formData.start_date}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_all_day"
                    checked={formData.is_all_day}
                    onChange={(e) =>
                      setFormData({ ...formData, is_all_day: e.target.checked })
                    }
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="is_all_day" className="text-sm text-gray-700">
                    All day event
                  </label>
                </div>

                {!formData.is_all_day && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Start Time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                    />
                    <Input
                      label="End Time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    {formData.event_type_id && (
                      <span
                        className="px-2 py-0.5 rounded text-xs text-white"
                        style={{
                          backgroundColor:
                            eventTypes.find((t) => t.id === formData.event_type_id)
                              ?.color || '#3b82f6',
                        }}
                      >
                        {eventTypes.find((t) => t.id === formData.event_type_id)
                          ?.name || 'Event'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {formData.title || 'Event Title'}
                  </h3>
                  {formData.start_date && (
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(formData.start_date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                  {formData.location && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.location}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full" loading={saving}>
                  Save Changes
                </Button>
                <Link href="/events" className="block">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <hr className="my-2" />
                <Button
                  type="button"
                  variant="danger"
                  className="w-full"
                  onClick={handleDelete}
                  loading={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
