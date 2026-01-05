'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Receipt,
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
    month: number
    year: number
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
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch children
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await fetch('/api/parent/children')
        if (response.ok) {
          const data = await response.json()
          setChildren(data.data || [])
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

  const formatMonth = (month: number | null, year: number | null) => {
    if (!month || !year) return 'N/A'
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }

  // Calculate totals
  const totalDue = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + parseFloat(inv.balance_amount?.toString() || '0'), 0)

  const pendingInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
  const paidInvoices = invoices.filter(inv => inv.status === 'paid')

  const childOptions = children.map(c => ({
    value: c.id,
    label: `${c.first_name} ${c.last_name} - ${c.current_class?.name || 'N/A'}${c.current_section?.name ? `-${c.current_section.name}` : ''}`,
  }))

  const selectedChildData = children.find(c => c.id === selectedChild)

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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/parent">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">School Fees</h1>
              {selectedChildData && (
                <p className="text-sm text-gray-500">
                  {selectedChildData.first_name} {selectedChildData.last_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Child Selector - Only show if multiple children */}
          {children.length > 1 && (
            <Select
              options={childOptions}
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full"
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
              {/* Outstanding Amount Card */}
              {totalDue > 0 && (
                <Card className="bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm">Total Outstanding</p>
                        <p className="text-4xl font-bold mt-1">
                          {'\u20B9'}{totalDue.toLocaleString('en-IN')}
                        </p>
                        <p className="text-white/60 text-xs mt-2">
                          {pendingInvoices.length} pending invoice{pendingInvoices.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Link href={`/parent/fees/pay/${pendingInvoices[0]?.id}?student_id=${selectedChild}`}>
                        <button className="bg-white text-primary font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Pay Now
                        </button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Paid Message */}
              {totalDue === 0 && invoices.length > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-full">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">All Fees Paid</p>
                        <p className="text-sm text-green-600">No outstanding dues</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pending Invoices */}
              {pendingInvoices.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide px-1">
                    Pending Fees
                  </h2>
                  {pendingInvoices.map((invoice) => (
                    <Card key={invoice.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Invoice Header */}
                        <button
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              invoice.status === 'overdue' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                              {invoice.status === 'overdue' ? (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-yellow-600" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900">
                                {formatMonth(invoice.month, invoice.year)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Due: {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold text-gray-900">
                                {'\u20B9'}{parseFloat(invoice.balance_amount?.toString() || '0').toLocaleString('en-IN')}
                              </p>
                              <Badge variant={invoice.status === 'overdue' ? 'danger' : 'warning'} className="text-xs">
                                {invoice.status === 'partial' ? 'Partial' : invoice.status === 'overdue' ? 'Overdue' : 'Pending'}
                              </Badge>
                            </div>
                            {expandedInvoice === invoice.id ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {expandedInvoice === invoice.id && (
                          <div className="px-4 pb-4 border-t border-gray-100">
                            <div className="pt-4 space-y-2">
                              {invoice.fee_invoice_items?.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{item.fee_categories?.name || item.description}</span>
                                  <span className="text-gray-900">{'\u20B9'}{parseFloat(item.net_amount?.toString() || '0').toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                              {invoice.late_fee > 0 && (
                                <div className="flex justify-between text-sm text-red-600">
                                  <span>Late Fee</span>
                                  <span>{'\u20B9'}{invoice.late_fee.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-medium pt-2 border-t border-gray-100">
                                <span>Total</span>
                                <span>{'\u20B9'}{parseFloat(invoice.net_amount?.toString() || '0').toLocaleString('en-IN')}</span>
                              </div>
                              {parseFloat(invoice.paid_amount?.toString() || '0') > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                  <span>Paid</span>
                                  <span>-{'\u20B9'}{parseFloat(invoice.paid_amount?.toString() || '0').toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-primary">
                                <span>Balance</span>
                                <span>{'\u20B9'}{parseFloat(invoice.balance_amount?.toString() || '0').toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            <Link href={`/parent/fees/pay/${invoice.id}?student_id=${selectedChild}`}>
                              <Button className="w-full mt-4">
                                Pay {'\u20B9'}{parseFloat(invoice.balance_amount?.toString() || '0').toLocaleString('en-IN')}
                              </Button>
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Payment History */}
              {payments.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide px-1">
                    Recent Payments
                  </h2>
                  <Card>
                    <CardContent className="p-0 divide-y divide-gray-100">
                      {payments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatMonth(payment.fee_invoices?.month || null, payment.fee_invoices?.year || null)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(payment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              {'\u20B9'}{parseFloat(payment.amount?.toString() || '0').toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-400">{payment.payment_mode}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Paid Invoices */}
              {paidInvoices.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide px-1">
                    Paid Invoices
                  </h2>
                  <Card>
                    <CardContent className="p-0 divide-y divide-gray-100">
                      {paidInvoices.map((invoice) => (
                        <div key={invoice.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Receipt className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatMonth(invoice.month, invoice.year)}
                              </p>
                              <p className="text-xs text-gray-500">{invoice.invoice_number}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-600">
                              {'\u20B9'}{parseFloat(invoice.net_amount?.toString() || '0').toLocaleString('en-IN')}
                            </p>
                            <Badge variant="success" className="text-xs">Paid</Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* No invoices at all */}
              {invoices.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <Receipt className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No fee invoices generated yet</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
