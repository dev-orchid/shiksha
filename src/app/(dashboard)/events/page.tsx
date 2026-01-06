'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Edit,
  Trash2,
} from 'lucide-react'

interface EventType {
  id: string
  name: string
  color: string
}

interface Event {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  is_all_day: boolean
  event_types: EventType | null
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function EventsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Fetch events for current month
  useEffect(() => {
    fetchEvents()
    fetchEventTypes()
  }, [year, month, selectedTypeId])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      let url = `/api/events?month=${month + 1}&year=${year}`
      if (selectedTypeId) {
        url += `&event_type_id=${selectedTypeId}`
      }
      const res = await fetch(url)
      const json = await res.json()
      if (json.data) {
        setEvents(json.data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setShowEventModal(false)
        setSelectedEvent(null)
        fetchEvents()
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    } finally {
      setDeleting(false)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const days: { date: Date | null; isCurrentMonth: boolean }[] = []

    // Previous month's trailing days
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    // Next month's leading days to complete the grid
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push({ date: nextDate, isCurrentMonth: false })
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      const startDate = event.start_date
      const endDate = event.end_date || event.start_date
      return dateStr >= startDate && dateStr <= endDate
    })
  }

  const formatTime = (time: string | null) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const calendarDays = generateCalendarDays()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage school events and calendar</p>
        </div>
        <Link href="/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </Link>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
                {MONTHS[month]} {year}
              </h2>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToToday} className="ml-2">
                Today
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="w-48"
                options={[
                  { value: '', label: 'All Event Types' },
                  ...eventTypes.map((type) => ({
                    value: type.id,
                    label: type.name,
                  })),
                ]}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="border-t border-gray-200">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-sm font-medium text-gray-500 border-r border-gray-200 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayEvents = day.date ? getEventsForDate(day.date) : []
                  const isTodayDate = day.date ? isToday(day.date) : false

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border-b border-r border-gray-200 ${
                        !day.isCurrentMonth ? 'bg-gray-50' : ''
                      } ${index % 7 === 6 ? 'border-r-0' : ''}`}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isTodayDate
                            ? 'bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center'
                            : day.isCurrentMonth
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {day.date?.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowEventModal(true)
                            }}
                            className="w-full text-left px-2 py-1 rounded text-xs truncate hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: event.event_types?.color || '#3b82f6',
                              color: 'white',
                            }}
                          >
                            {event.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Types Legend */}
      {eventTypes.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Event Types</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-3">
              {eventTypes.map((type) => (
                <div key={type.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm text-gray-600">{type.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Detail Modal */}
      <Modal
        open={showEventModal}
        onClose={() => {
          setShowEventModal(false)
          setSelectedEvent(null)
        }}
        title={selectedEvent?.title || 'Event Details'}
      >
        {selectedEvent && (
          <div className="space-y-4">
            {selectedEvent.event_types && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedEvent.event_types.color }}
                />
                <span className="text-sm font-medium text-gray-600">
                  {selectedEvent.event_types.name}
                </span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(selectedEvent.start_date)}
                    {selectedEvent.end_date &&
                      selectedEvent.end_date !== selectedEvent.start_date && (
                        <> - {formatDate(selectedEvent.end_date)}</>
                      )}
                  </p>
                </div>
              </div>

              {!selectedEvent.is_all_day && selectedEvent.start_time && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    {formatTime(selectedEvent.start_time)}
                    {selectedEvent.end_time && (
                      <> - {formatTime(selectedEvent.end_time)}</>
                    )}
                  </p>
                </div>
              )}

              {selectedEvent.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                </div>
              )}

              {selectedEvent.description && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteEvent}
                loading={deleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Link href={`/events/${selectedEvent.id}/edit`}>
                <Button size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
