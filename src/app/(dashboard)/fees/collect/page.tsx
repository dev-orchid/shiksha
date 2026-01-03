'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  Search,
  IndianRupee,
  User,
  Receipt,
  Loader2,
} from 'lucide-react'

interface Student {
  id: string
  admission_number: string
  first_name: string
  last_name: string | null
  classes?: { name: string }
  sections?: { name: string }
}

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  net_amount?: number
  paid_amount: number
  balance_amount: number
  due_date: string
  status: string
}

export default function CollectFeesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_mode: 'cash',
    transaction_id: '',
    remarks: '',
  })

  useEffect(() => {
    const studentId = searchParams.get('student')
    if (studentId) {
      fetchStudent(studentId)
    }
  }, [searchParams])

  const searchStudents = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/students?search=${encodeURIComponent(searchQuery)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.data || [])
      }
    } catch {
      console.error('Failed to search students')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudent = async (studentId: string) => {
    setLoading(true)
    try {
      const [studentRes, invoicesRes] = await Promise.all([
        fetch(`/api/students/${studentId}`),
        fetch(`/api/fees/invoices?student_id=${studentId}&status=pending,partial,overdue`),
      ])

      if (studentRes.ok) {
        const studentData = await studentRes.json()
        setSelectedStudent(studentData.data)
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json()
        // Normalize invoice data to ensure balance_amount is set
        const normalizedInvoices = (invoicesData.data || []).map((inv: Invoice) => ({
          ...inv,
          paid_amount: inv.paid_amount || 0,
          balance_amount: inv.balance_amount ?? (inv.net_amount || inv.total_amount) - (inv.paid_amount || 0),
        }))
        setInvoices(normalizedInvoices)
      }
    } catch {
      console.error('Failed to fetch student data')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    setStudents([])
    setSearchQuery('')
    fetchStudent(student.id)
  }

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    const balanceAmount = invoice.balance_amount || invoice.total_amount - (invoice.paid_amount || 0)
    setPaymentData({ ...paymentData, amount: String(balanceAmount) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice || !paymentData.amount) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/fees/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          amount: parseFloat(paymentData.amount),
          payment_mode: paymentData.payment_mode,
          transaction_id: paymentData.transaction_id || null,
          remarks: paymentData.remarks || null,
          payment_date: new Date().toISOString().split('T')[0],
        }),
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/fees/payments/${result.data.id}/receipt`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to process payment')
      }
    } catch {
      alert('Failed to process payment')
    } finally {
      setSubmitting(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Collect Fees</h1>
          <p className="text-gray-500">Search for a student and collect fees</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Student
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
                />
              </div>
              <Button onClick={searchStudents} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {students.length > 0 && (
              <div className="border rounded-lg divide-y">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {student.first_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {student.first_name} {student.last_name || ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        {student.admission_number} • {student.classes?.name} - {student.sections?.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedStudent && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">
                      {selectedStudent.first_name} {selectedStudent.last_name || ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedStudent.admission_number} • {selectedStudent.classes?.name} - {selectedStudent.sections?.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedStudent ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a student to view pending invoices</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No pending invoices</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => {
                  const balanceAmount = invoice.balance_amount || invoice.total_amount - (invoice.paid_amount || 0)
                  return (
                    <button
                      key={invoice.id}
                      type="button"
                      onClick={() => handleSelectInvoice(invoice)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all cursor-pointer ${
                        selectedInvoice?.id === invoice.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{invoice.invoice_number}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-700'
                            : invoice.status === 'partial'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                        </span>
                        <span className="font-semibold text-red-600">
                          ₹{balanceAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {selectedInvoice?.id !== invoice.id && (
                        <p className="text-xs text-gray-400 mt-2">Click to select and pay</p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Form */}
      {selectedInvoice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-medium">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium">₹{(selectedInvoice.total_amount || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paid Amount</p>
                  <p className="font-medium text-green-600">₹{(selectedInvoice.paid_amount || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Balance Amount</p>
                  <p className="font-medium text-red-600">₹{(selectedInvoice.balance_amount || selectedInvoice.total_amount - (selectedInvoice.paid_amount || 0)).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Amount to Pay"
                  name="amount"
                  type="number"
                  min="1"
                  max={selectedInvoice.balance_amount || selectedInvoice.total_amount}
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                />
                <Select
                  label="Payment Mode"
                  value={paymentData.payment_mode}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_mode: e.target.value })}
                  options={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'cheque', label: 'Cheque' },
                    { value: 'upi', label: 'UPI' },
                    { value: 'card', label: 'Card' },
                    { value: 'bank_transfer', label: 'Bank Transfer' },
                    { value: 'online', label: 'Online' },
                  ]}
                />
                <Input
                  label="Transaction ID (Optional)"
                  name="transaction_id"
                  value={paymentData.transaction_id}
                  onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                  placeholder="For online/UPI payments"
                />
                <Input
                  label="Remarks (Optional)"
                  name="remarks"
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="outline" onClick={() => setSelectedInvoice(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !paymentData.amount}
                  icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
                >
                  {submitting ? 'Processing...' : `Pay ₹${parseFloat(paymentData.amount || '0').toLocaleString('en-IN')}`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
