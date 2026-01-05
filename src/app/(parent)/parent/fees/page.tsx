'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  IndianRupee,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Loader2,
} from 'lucide-react'

interface Child {
  id: string
  first_name: string
  last_name: string
  admission_number: string
  current_class?: { name: string }
  current_section?: { name: string }
}

interface InvoiceItem {
  id: string
  description: string
  amount: number
  discount_amount: number
  net_amount: number
  fee_categories?: { id: string; name: string }
}

interface Invoice {
  id: string
  invoice_number: string
  month: number | null
  year: number | null
  total_amount: number
  discount_amount: number
  late_fee: number
  net_amount: number
  paid_amount: number
  balance_amount: number
  due_date: string
  status: string
  created_at: string
  students?: Child
  fee_invoice_items?: InvoiceItem[]
}

interface Payment {
  id: string
  receipt_number: string
  amount: number
  payment_date: string
  payment_mode: string
  fee_invoices?: {
    invoice_number: string
    students?: { first_name: string; last_name: string }
  }
}

export default function ParentFeesPage() {
  const searchParams = useSearchParams()
  const childParam = searchParams.get('child')

  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch children
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await fetch('/api/parent/children')
        if (response.ok) {
          const data = await response.json()
          setChildren(data.data || [])
          // Select first child or from URL param
          if (data.data?.length > 0) {
            const childId = childParam || data.data[0].id
            setSelectedChild(childId)
          }
        }
      } catch (error) {
        console.error('Error fetching children:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchChildren()
  }, [childParam])

  // Fetch invoices and payments when child changes
  const fetchFeeData = useCallback(async () => {
    if (!selectedChild) return

    try {
      const [invoicesRes, paymentsRes] = await Promise.all([
        fetch(`/api/parent/invoices?student_id=${selectedChild}`),
        fetch(`/api/parent/payments?student_id=${selectedChild}`),
      ])

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        setInvoices(data.data || [])
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        setPayments(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching fee data:', error)
    }
  }, [selectedChild])

  useEffect(() => {
    fetchFeeData()
  }, [fetchFeeData])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>
      case 'partial':
        return <Badge variant="warning">Partial</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatMonth = (month: number | null, year: number | null) => {
    if (!month || !year) return 'N/A'
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }

  // Calculate totals
  const totalDue = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + parseFloat(inv.balance_amount?.toString() || '0'), 0)

  const totalPaid = invoices
    .reduce((sum, inv) => sum + parseFloat(inv.paid_amount?.toString() || '0'), 0)

  const totalAmount = invoices
    .reduce((sum, inv) => sum + parseFloat(inv.net_amount?.toString() || '0'), 0)

  const childOptions = children.map(c => ({
    value: c.id,
    label: `${c.first_name} ${c.last_name} - ${c.current_class?.name || 'N/A'}${c.current_section?.name ? `-${c.current_section.name}` : ''}`,
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/parent">
                <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="font-semibold text-gray-900">Fee Details</h1>
                <p className="text-xs text-gray-500">View and pay school fees</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Child Selector */}
          {children.length > 1 && (
            <Select
              label="Select Child"
              options={childOptions}
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="max-w-xs"
            />
          )}

          {children.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <p>No children linked to your account.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Fee Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IndianRupee className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Total Fee</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Amount Paid</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">₹{totalDue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Total Due</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-primary text-white">
                  <CardContent className="p-4">
                    <Link href={totalDue > 0 ? `/parent/fees/pay?student_id=${selectedChild}` : '#'}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">₹{totalDue.toLocaleString()}</p>
                          <p className="text-xs text-white/80">Pay Now</p>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Invoices */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Fee Invoices</CardTitle>
                      <CardDescription>Monthly fee breakdown and payment status</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {invoices.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          No invoices found
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {invoices.map((invoice) => (
                            <div
                              key={invoice.id}
                              className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                                selectedInvoice === invoice.id ? 'bg-blue-50' : ''
                              }`}
                              onClick={() =>
                                setSelectedInvoice(selectedInvoice === invoice.id ? null : invoice.id)
                              }
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`p-2 rounded-lg ${
                                      invoice.status === 'paid'
                                        ? 'bg-green-100'
                                        : invoice.status === 'overdue'
                                        ? 'bg-red-100'
                                        : 'bg-yellow-100'
                                    }`}
                                  >
                                    {invoice.status === 'paid' ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : invoice.status === 'overdue' ? (
                                      <AlertCircle className="h-5 w-5 text-red-600" />
                                    ) : (
                                      <Clock className="h-5 w-5 text-yellow-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {formatMonth(invoice.month, invoice.year)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {invoice.invoice_number} | Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900">
                                    ₹{parseFloat(invoice.net_amount?.toString() || '0').toLocaleString()}
                                  </p>
                                  {getStatusBadge(invoice.status)}
                                </div>
                              </div>

                              {/* Expanded Details */}
                              {selectedInvoice === invoice.id && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="space-y-2 mb-4">
                                    {invoice.fee_invoice_items?.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex justify-between text-sm text-gray-600"
                                      >
                                        <span>{item.fee_categories?.name || item.description}</span>
                                        <span>₹{parseFloat(item.net_amount?.toString() || '0').toLocaleString()}</span>
                                      </div>
                                    ))}
                                    {invoice.late_fee > 0 && (
                                      <div className="flex justify-between text-sm text-red-600">
                                        <span>Late Fee</span>
                                        <span>₹{invoice.late_fee.toLocaleString()}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between font-semibold pt-2 border-t">
                                      <span>Total</span>
                                      <span>₹{parseFloat(invoice.net_amount?.toString() || '0').toLocaleString()}</span>
                                    </div>
                                    {invoice.status !== 'paid' && (
                                      <div className="flex justify-between text-sm text-green-600">
                                        <span>Paid</span>
                                        <span>₹{parseFloat(invoice.paid_amount?.toString() || '0').toLocaleString()}</span>
                                      </div>
                                    )}
                                    {invoice.status !== 'paid' && (
                                      <div className="flex justify-between font-semibold text-primary">
                                        <span>Balance Due</span>
                                        <span>₹{parseFloat(invoice.balance_amount?.toString() || '0').toLocaleString()}</span>
                                      </div>
                                    )}
                                  </div>
                                  {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                    <Link href={`/parent/fees/pay/${invoice.id}?student_id=${selectedChild}`}>
                                      <Button className="w-full" size="sm">
                                        Pay ₹{parseFloat(invoice.balance_amount?.toString() || '0').toLocaleString()}
                                      </Button>
                                    </Link>
                                  )}
                                  {invoice.status === 'paid' && (
                                    <Button variant="outline" className="w-full" size="sm">
                                      <Download className="h-4 w-4 mr-2" />
                                      Download Receipt
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Payment History */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {payments.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">
                          No payments yet
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {payments.slice(0, 10).map((payment) => (
                            <div key={payment.id} className="px-6 py-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    ₹{parseFloat(payment.amount?.toString() || '0').toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(payment.payment_date).toLocaleDateString('en-IN')} • {payment.payment_mode}
                                  </p>
                                </div>
                                <button className="text-primary text-xs hover:underline">
                                  {payment.receipt_number}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Pay All Button */}
                  {totalDue > 0 && (
                    <Card className="mt-6 bg-gradient-to-r from-primary to-primary/80 text-white">
                      <CardContent className="p-6 text-center">
                        <p className="text-sm text-white/80 mb-2">Total Outstanding</p>
                        <p className="text-3xl font-bold mb-4">₹{totalDue.toLocaleString()}</p>
                        <Link href={`/parent/fees/pay?student_id=${selectedChild}`}>
                          <Button variant="secondary" className="w-full">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay All Dues
                          </Button>
                        </Link>
                        <p className="text-xs text-white/60 mt-3">
                          Secure payment via UPI, Cards, Net Banking
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
