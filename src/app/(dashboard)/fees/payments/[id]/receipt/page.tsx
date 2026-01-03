'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Loader2,
} from 'lucide-react'

interface PaymentData {
  id: string
  receipt_number: string
  amount: number
  payment_date: string
  payment_mode: string
  transaction_id: string | null
  cheque_number: string | null
  bank_name: string | null
  remarks: string | null
  created_at: string
  fee_invoices: {
    id: string
    invoice_number: string
    total_amount: number
    net_amount: number
    discount_amount: number
    paid_amount: number
    balance_amount: number
    due_date: string
    status: string
    month: number
    year: number
    students: {
      id: string
      first_name: string
      last_name: string | null
      admission_number: string
      classes: { id: string; name: string } | null
      sections: { id: string; name: string } | null
    }
  }
  schools: {
    id: string
    name: string
    address: string | null
    phone: string | null
    email: string | null
  } | null
}

export default function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPayment()
  }, [id])

  const fetchPayment = async () => {
    try {
      const response = await fetch(`/api/fees/payments/${id}`)
      if (response.ok) {
        const data = await response.json()
        setPayment(data.data)
      } else {
        setError('Payment not found')
      }
    } catch {
      setError('Failed to load payment details')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getPaymentModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      cheque: 'Cheque',
      upi: 'UPI',
      card: 'Card',
      bank_transfer: 'Bank Transfer',
      online: 'Online',
    }
    return labels[mode] || mode
  }

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month - 1] || ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/fees/collect">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{error || 'Payment not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const student = payment.fee_invoices.students
  const invoice = payment.fee_invoices
  const school = payment.schools

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden;
          }

          body * {
            visibility: hidden;
          }

          .print-receipt, .print-receipt * {
            visibility: visible;
          }

          .print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            padding: 0;
            margin: 0;
            box-shadow: none !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .print-receipt .receipt-content {
            padding: 15px !important;
          }

          .print-receipt .text-2xl {
            font-size: 18px !important;
          }

          .print-receipt .text-xl {
            font-size: 16px !important;
          }

          .print-receipt .text-lg {
            font-size: 14px !important;
          }

          .print-receipt .mb-6 {
            margin-bottom: 10px !important;
          }

          .print-receipt .mb-4 {
            margin-bottom: 8px !important;
          }

          .print-receipt .pb-4 {
            padding-bottom: 8px !important;
          }

          .print-receipt .p-4 {
            padding: 8px !important;
          }

          .print-receipt .py-2 {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
          }

          .print-receipt .gap-4 {
            gap: 8px !important;
          }

          .print-receipt .mt-6 {
            margin-top: 10px !important;
          }

          .print-receipt .pt-6 {
            padding-top: 10px !important;
          }

          .print-receipt .h-12 {
            height: 30px !important;
          }

          .print-receipt .signature-line {
            width: 120px !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header - Hidden when printing */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <Link href="/fees/collect">
              <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Receipt</h1>
              <p className="text-gray-500">Receipt #{payment.receipt_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} icon={<Printer className="h-4 w-4" />}>
              Print
            </Button>
          </div>
        </div>

        {/* Success Message - Hidden when printing */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 no-print">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Payment Successful</p>
            <p className="text-sm text-green-600">The payment has been recorded successfully.</p>
          </div>
        </div>

        {/* Receipt Card */}
        <Card className="max-w-2xl mx-auto print-receipt">
          <CardContent className="p-6 receipt-content">
            {/* School Header */}
            <div className="text-center border-b pb-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">{school?.name || 'School'}</h2>
              {(school?.phone || school?.email) && (
                <p className="text-sm text-gray-600">
                  {school?.phone && `Phone: ${school.phone}`}
                  {school?.phone && school?.email && ' | '}
                  {school?.email && `Email: ${school.email}`}
                </p>
              )}
              <div className="mt-3 inline-block bg-gray-100 px-3 py-1 rounded">
                <p className="text-base font-bold">FEE RECEIPT</p>
              </div>
            </div>

            {/* Receipt & Student Details - Combined Row */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Receipt No.</span>
                <p className="font-medium">{payment.receipt_number}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-500">Date</span>
                <p className="font-medium">
                  {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Student Name</span>
                <p className="font-medium">{student.first_name} {student.last_name || ''}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-500">Admission No.</span>
                <p className="font-medium">{student.admission_number}</p>
              </div>
              <div>
                <span className="text-gray-500">Class</span>
                <p className="font-medium">
                  {student.classes?.name || 'N/A'} - {student.sections?.name || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-gray-500">Fee Period</span>
                <p className="font-medium">{getMonthName(invoice.month)} {invoice.year}</p>
              </div>
            </div>

            {/* Invoice Details - Compact Table */}
            <div className="mb-4">
              {(() => {
                const netAmount = invoice.net_amount || invoice.total_amount || 0
                const previouslyPaid = (invoice.paid_amount || 0) - payment.amount
                const balanceAfterPayment = invoice.balance_amount || 0

                return (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-1 text-gray-600 font-medium">Description</th>
                        <th className="text-right py-1 text-gray-600 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-1">Invoice #{invoice.invoice_number}</td>
                        <td className="text-right py-1">₹{(invoice.total_amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                      {(invoice.discount_amount || 0) > 0 && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-green-600">Discount</td>
                          <td className="text-right py-1 text-green-600">
                            -₹{invoice.discount_amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-200">
                        <td className="py-1">Net Amount</td>
                        <td className="text-right py-1">₹{netAmount.toLocaleString('en-IN')}</td>
                      </tr>
                      {previouslyPaid > 0 && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-green-600">Previously Paid</td>
                          <td className="text-right py-1 text-green-600">
                            -₹{previouslyPaid.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-300 font-medium bg-gray-50">
                        <td className="py-1">Due Before This Payment</td>
                        <td className="text-right py-1">₹{(netAmount - previouslyPaid).toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                )
              })()}
            </div>

            {/* Payment Details - Compact */}
            <div className="bg-green-50 p-3 rounded mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Amount Paid</span>
                  <p className="text-xl font-bold text-green-700">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-gray-500">Payment Mode</span>
                  <p className="font-medium">{getPaymentModeLabel(payment.payment_mode)}</p>
                </div>
                {payment.transaction_id && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Transaction ID: </span>
                    <span className="font-medium">{payment.transaction_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Balance Due - Compact */}
            {(invoice.balance_amount || 0) > 0 && (
              <div className="bg-yellow-50 p-3 rounded mb-4 flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Balance Due</span>
                <span className="text-lg font-bold text-red-600">
                  ₹{invoice.balance_amount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Footer - Compact */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-end text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Received by</p>
                  <div className="h-8 border-b border-dashed border-gray-400 w-28 signature-line mt-1"></div>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs">Authorized Signature</p>
                  <div className="h-8 border-b border-dashed border-gray-400 w-28 signature-line mt-1"></div>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">
                This is a computer generated receipt.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions - Hidden when printing */}
        <div className="flex justify-center gap-4 no-print">
          <Link href="/fees/collect">
            <Button variant="outline">Collect Another Payment</Button>
          </Link>
          <Link href="/fees/invoices">
            <Button>View All Invoices</Button>
          </Link>
        </div>
      </div>
    </>
  )
}
