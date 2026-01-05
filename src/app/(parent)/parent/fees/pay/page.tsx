'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  ArrowLeft,
  IndianRupee,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
  Shield,
  CheckCircle,
} from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  month: number | null
  year: number | null
  net_amount: number
  paid_amount: number
  balance_amount: number
  due_date: string
  status: string
}

interface Student {
  id: string
  first_name: string
  last_name: string
  admission_number: string
  current_class?: { name: string }
  current_section?: { name: string }
}

export default function PayAllDuesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const studentId = searchParams.get('student_id')

  const [student, setStudent] = useState<Student | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        setError('Missing student information')
        setLoading(false)
        return
      }

      try {
        const [childrenRes, invoicesRes] = await Promise.all([
          fetch('/api/parent/children'),
          fetch(`/api/parent/invoices?student_id=${studentId}&status=pending,partial,overdue`),
        ])

        if (childrenRes.ok) {
          const childrenData = await childrenRes.json()
          const s = childrenData.data?.find((c: Student) => c.id === studentId)
          if (s) setStudent(s)
        }

        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json()
          const pendingInvoices = (invoicesData.data || []).filter(
            (inv: Invoice) => inv.status !== 'paid' && inv.status !== 'cancelled'
          )
          setInvoices(pendingInvoices)
          // Select all by default
          setSelectedInvoices(pendingInvoices.map((inv: Invoice) => inv.id))
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [studentId])

  const formatMonth = (month: number | null, year: number | null) => {
    if (!month || !year) return 'N/A'
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }

  const toggleInvoice = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }

  const selectAll = () => {
    setSelectedInvoices(invoices.map((inv) => inv.id))
  }

  const deselectAll = () => {
    setSelectedInvoices([])
  }

  const totalSelected = invoices
    .filter((inv) => selectedInvoices.includes(inv.id))
    .reduce((sum, inv) => sum + parseFloat(inv.balance_amount?.toString() || '0'), 0)

  const handlePayment = async () => {
    if (selectedInvoices.length === 0) {
      setError('Please select at least one invoice')
      return
    }

    // If single invoice, redirect to single payment page
    if (selectedInvoices.length === 1) {
      router.push(`/parent/fees/pay/${selectedInvoices[0]}?student_id=${studentId}`)
      return
    }

    // For multiple invoices, we'll pay them one by one starting with the first
    // In a production system, you might want to create a bulk payment API
    setProcessing(true)
    setError(null)

    try {
      // Pay the first selected invoice
      const firstInvoiceId = selectedInvoices[0]
      const firstInvoice = invoices.find((inv) => inv.id === firstInvoiceId)

      if (!firstInvoice) {
        setError('Invoice not found')
        setProcessing(false)
        return
      }

      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: firstInvoiceId,
          student_id: studentId,
          amount: parseFloat(firstInvoice.balance_amount?.toString() || '0'),
        }),
      })

      const data = await response.json()

      if (response.ok && data.payment_url) {
        window.location.href = data.payment_url
      } else {
        setError(data.error || 'Failed to initiate payment')
        setProcessing(false)
      }
    } catch (err) {
      console.error('Error initiating payment:', err)
      setError('Failed to initiate payment. Please try again.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && invoices.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <Link href="/parent/fees">
              <Button>Back to Fees</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/parent/fees">
                <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="font-semibold text-gray-900">Pay Dues</h1>
                <p className="text-xs text-gray-500">Select invoices to pay</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Student Info */}
          {student && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {student.first_name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{student.first_name} {student.last_name}</p>
                    <p className="text-sm text-gray-500">
                      {student.admission_number} | {student.current_class?.name || 'N/A'}
                      {student.current_section?.name && `-${student.current_section.name}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Pending Invoices */}
          {invoices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">All Dues Cleared!</h2>
                <p className="text-gray-500 mb-4">There are no pending invoices for this student.</p>
                <Link href="/parent/fees">
                  <Button>Back to Fees</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Invoice Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pending Invoices</CardTitle>
                      <CardDescription>
                        {selectedInvoices.length} of {invoices.length} selected
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={selectAll}>
                        Select All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={deselectAll}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200">
                    {invoices.map((invoice) => {
                      const isSelected = selectedInvoices.includes(invoice.id)
                      const balance = parseFloat(invoice.balance_amount?.toString() || '0')

                      return (
                        <div
                          key={invoice.id}
                          className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                            isSelected ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => toggleInvoice(invoice.id)}
                        >
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => toggleInvoice(invoice.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {formatMonth(invoice.month, invoice.year)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {invoice.invoice_number} | Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900">
                                    ₹{balance.toLocaleString()}
                                  </p>
                                  <Badge
                                    variant={invoice.status === 'overdue' ? 'danger' : 'warning'}
                                    className="text-xs"
                                  >
                                    {invoice.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card className="border-2 border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Payment Summary</h3>
                      <p className="text-sm text-gray-500">
                        {selectedInvoices.length} invoice(s) selected
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="text-2xl font-bold text-primary">
                        ₹{totalSelected.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {selectedInvoices.length > 1 && (
                    <div className="bg-yellow-50 text-yellow-800 rounded-lg p-3 mb-4 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        Multiple invoices selected. Payments will be processed one at a time starting with the earliest.
                      </span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 text-red-700 rounded-lg p-3 mb-4 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePayment}
                    disabled={processing || selectedInvoices.length === 0}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <IndianRupee className="h-4 w-4 mr-2" />
                        {selectedInvoices.length > 1
                          ? `Pay First Invoice (₹${invoices.find((inv) => inv.id === selectedInvoices[0])?.balance_amount?.toLocaleString() || 0})`
                          : `Pay ₹${totalSelected.toLocaleString()}`}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                    <Shield className="h-3 w-3" />
                    <span>Secured by NTT DATA Payment Gateway</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
