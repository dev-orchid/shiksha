'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Loader2, Calendar, AlertCircle, CheckCircle } from 'lucide-react'

interface Child {
  id: string
  name: string
  class: string
  section: string
}

interface LeaveType {
  id: string
  name: string
  description: string | null
}

interface LeaveApplicationModalProps {
  open: boolean
  onClose: () => void
  children: Child[]
  selectedChildId?: string
  onSuccess?: () => void
}

export function LeaveApplicationModal({
  open,
  onClose,
  children,
  selectedChildId,
  onSuccess,
}: LeaveApplicationModalProps) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])

  // Form state
  const [studentId, setStudentId] = useState(selectedChildId || '')
  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  // Fetch leave types when modal opens
  useEffect(() => {
    if (open) {
      fetchLeaveTypes()
      // Reset form
      setStudentId(selectedChildId || children[0]?.id || '')
      setLeaveTypeId('')
      setStartDate('')
      setEndDate('')
      setReason('')
      setError(null)
      setSuccess(false)
    }
  }, [open, selectedChildId, children])

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/parent/leave')
      if (response.ok) {
        const data = await response.json()
        setLeaveTypes(data.leaveTypes || [])
      }
    } catch (err) {
      console.error('Error fetching leave types:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    if (!studentId) {
      setError('Please select a child')
      return
    }
    if (!startDate) {
      setError('Please select a start date')
      return
    }
    if (!endDate) {
      setError('Please select an end date')
      return
    }
    if (!reason.trim()) {
      setError('Please provide a reason for leave')
      return
    }

    // Validate date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start > end) {
      setError('Start date cannot be after end date')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/parent/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          leave_type_id: leaveTypeId || null,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit leave application')
        return
      }

      setSuccess(true)

      // Call onSuccess callback after a brief delay
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error submitting leave application:', err)
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const childOptions = children.map(c => ({
    value: c.id,
    label: `${c.name} - ${c.class}${c.section ? `-${c.section}` : ''}`,
  }))

  const leaveTypeOptions = [
    { value: '', label: 'Select leave type (optional)' },
    ...leaveTypes.map(lt => ({
      value: lt.id,
      label: lt.name,
    })),
  ]

  // Calculate number of days
  const getDaysDifference = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const daysDiff = getDaysDifference()

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Apply for Leave"
      description="Submit a leave application for your child"
      size="md"
    >
      {success ? (
        <div className="py-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Application Submitted
          </h3>
          <p className="text-sm text-gray-500">
            Your leave application has been submitted successfully. You will be notified once it is reviewed.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Child Selection */}
          <Select
            label="Select Child"
            options={childOptions}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={children.length === 1}
          />

          {/* Leave Type (optional) */}
          {leaveTypes.length > 0 && (
            <Select
              label="Leave Type"
              options={leaveTypeOptions}
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
            />
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={today}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || today}
            />
          </div>

          {/* Days indicator */}
          {daysDiff > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4" />
              <span>
                {daysDiff} day{daysDiff > 1 ? 's' : ''} of leave
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Leave
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason for the leave request..."
              rows={4}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || loading}
              icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
