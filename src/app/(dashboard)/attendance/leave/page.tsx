'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface LeaveApplication {
  id: string
  applicant_type: string
  student_id: string
  leave_type_id: string | null
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  rejection_reason: string | null
  created_at: string
  students: {
    id: string
    first_name: string
    last_name: string | null
    admission_number: string
    current_class: { id: string; name: string } | null
    current_section: { id: string; name: string } | null
  } | null
  leave_types: { id: string; name: string } | null
}

interface ClassOption {
  id: string
  name: string
}

export default function LeaveManagementPage() {
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [classFilter, setClassFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses()
  }, [])

  // Fetch applications when filters change
  useEffect(() => {
    fetchApplications()
  }, [statusFilter, classFilter, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.data || [])
      }
    } catch {
      console.error('Failed to fetch classes')
    }
  }

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('status', statusFilter)
      params.set('page', page.toString())
      if (classFilter) params.set('class_id', classFilter)

      const response = await fetch(`/api/attendance/leave?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch leave applications:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, classFilter, page])

  const handleApprove = async (application: LeaveApplication) => {
    try {
      setActionLoading(application.id)
      setMessage(null)

      const response = await fetch('/api/attendance/leave', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: application.id,
          action: 'approve',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to approve leave' })
        return
      }

      setMessage({ type: 'success', text: 'Leave application approved successfully' })
      fetchApplications()
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setActionLoading(null)
    }
  }

  const openRejectModal = (application: LeaveApplication) => {
    setSelectedApplication(application)
    setRejectionReason('')
    setRejectModalOpen(true)
  }

  const handleReject = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      return
    }

    try {
      setActionLoading(selectedApplication.id)
      setMessage(null)

      const response = await fetch('/api/attendance/leave', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApplication.id,
          action: 'reject',
          rejection_reason: rejectionReason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to reject leave' })
        return
      }

      setMessage({ type: 'success', text: 'Leave application rejected' })
      setRejectModalOpen(false)
      setSelectedApplication(null)
      fetchApplications()
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>
      case 'cancelled':
        return <Badge variant="default">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const endDate = new Date(end).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return start === end ? startDate : `${startDate} - ${endDate}`
  }

  const getDaysCount = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  // Filter applications by search query
  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true
    const studentName = app.students
      ? `${app.students.first_name} ${app.students.last_name || ''}`.toLowerCase()
      : ''
    const admissionNo = app.students?.admission_number?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    return studentName.includes(query) || admissionNo.includes(query)
  })

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ]

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classes.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Applications</h1>
          <p className="text-gray-500 mt-1">Manage student leave requests</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="sm:w-40"
            />
            <Select
              options={classOptions}
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value)
                setPage(1)
              }}
              className="sm:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Applications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {statusFilter === 'all' ? 'All Applications' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Applications`}
            </CardTitle>
            <span className="text-sm text-gray-500">{total} total</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No leave applications found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApplications.map((application) => {
                const student = application.students
                const studentName = student
                  ? `${student.first_name} ${student.last_name || ''}`
                  : 'Unknown'
                const classSection = student
                  ? `${student.current_class?.name || ''}${student.current_section?.name ? `-${student.current_section.name}` : ''}`
                  : ''
                const daysCount = getDaysCount(application.start_date, application.end_date)

                return (
                  <div key={application.id} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Student Info */}
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {student?.first_name?.[0]}{student?.last_name?.[0] || ''}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{studentName}</h3>
                            {getStatusBadge(application.status)}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {classSection} | {student?.admission_number}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDateRange(application.start_date, application.end_date)}</span>
                            </div>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-600">
                              {daysCount} day{daysCount > 1 ? 's' : ''}
                            </span>
                            {application.leave_types && (
                              <>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-600">{application.leave_types.name}</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Reason:</span> {application.reason}
                          </p>
                          {application.rejection_reason && (
                            <p className="text-sm text-red-600 mt-1">
                              <span className="font-medium">Rejection reason:</span> {application.rejection_reason}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Applied on {new Date(application.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {application.status === 'pending' && (
                        <div className="flex items-center gap-2 sm:flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(application)}
                            disabled={actionLoading === application.id}
                            icon={
                              actionLoading === application.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectModal(application)}
                            disabled={actionLoading === application.id}
                            icon={<XCircle className="h-4 w-4" />}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  icon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  icon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Leave Application"
        description="Please provide a reason for rejecting this leave application"
      >
        <div className="space-y-4">
          {selectedApplication && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900">
                {selectedApplication.students?.first_name} {selectedApplication.students?.last_name}
              </p>
              <p className="text-sm text-gray-500">
                {formatDateRange(selectedApplication.start_date, selectedApplication.end_date)}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || actionLoading !== null}
              icon={
                actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )
              }
            >
              Reject Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
