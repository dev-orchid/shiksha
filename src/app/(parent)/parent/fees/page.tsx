'use client'

import { useState } from 'react'
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
} from 'lucide-react'

// Mock data
const children = [
  { value: '1', label: 'Rahul Kumar - Class 10-A' },
  { value: '2', label: 'Priya Kumar - Class 7-B' },
]

const feeDetails = {
  '1': {
    name: 'Rahul Kumar',
    class: 'Class 10-A',
    totalAnnualFee: 85000,
    paidAmount: 65000,
    dueAmount: 20000,
    invoices: [
      {
        id: 'INV-2025-001',
        month: 'January 2025',
        amount: 10000,
        dueDate: '2025-01-10',
        status: 'pending',
        breakdown: [
          { item: 'Tuition Fee', amount: 6000 },
          { item: 'Transport Fee', amount: 2500 },
          { item: 'Activity Fee', amount: 1500 },
        ],
      },
      {
        id: 'INV-2024-012',
        month: 'December 2024',
        amount: 10000,
        dueDate: '2024-12-10',
        status: 'overdue',
        breakdown: [
          { item: 'Tuition Fee', amount: 6000 },
          { item: 'Transport Fee', amount: 2500 },
          { item: 'Activity Fee', amount: 1500 },
        ],
      },
      {
        id: 'INV-2024-011',
        month: 'November 2024',
        amount: 10000,
        dueDate: '2024-11-10',
        paidDate: '2024-11-08',
        status: 'paid',
        breakdown: [
          { item: 'Tuition Fee', amount: 6000 },
          { item: 'Transport Fee', amount: 2500 },
          { item: 'Activity Fee', amount: 1500 },
        ],
      },
      {
        id: 'INV-2024-010',
        month: 'October 2024',
        amount: 10000,
        dueDate: '2024-10-10',
        paidDate: '2024-10-05',
        status: 'paid',
        breakdown: [
          { item: 'Tuition Fee', amount: 6000 },
          { item: 'Transport Fee', amount: 2500 },
          { item: 'Activity Fee', amount: 1500 },
        ],
      },
    ],
    paymentHistory: [
      { date: '2024-11-08', amount: 10000, method: 'Online', receipt: 'RCP-2024-089' },
      { date: '2024-10-05', amount: 10000, method: 'Online', receipt: 'RCP-2024-078' },
      { date: '2024-09-10', amount: 10000, method: 'Cash', receipt: 'RCP-2024-065' },
      { date: '2024-08-08', amount: 10000, method: 'Online', receipt: 'RCP-2024-052' },
      { date: '2024-07-10', amount: 25000, method: 'Cheque', receipt: 'RCP-2024-001' },
    ],
  },
}

export default function ParentFeesPage() {
  const searchParams = useSearchParams()
  const childParam = searchParams.get('child')
  const [selectedChild, setSelectedChild] = useState(childParam || '1')
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)

  const data = feeDetails['1'] // In production, use selectedChild

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const pendingInvoices = data.invoices.filter((inv) => inv.status !== 'paid')
  const totalDue = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0)

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
          <Select
            label="Select Child"
            options={children}
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="max-w-xs"
          />

          {/* Fee Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <IndianRupee className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₹{data.totalAnnualFee.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Annual Fee</p>
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
                    <p className="text-2xl font-bold">₹{data.paidAmount.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold">₹{data.dueAmount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Due</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₹{totalDue.toLocaleString()}</p>
                    <p className="text-xs text-white/80">Pay Now</p>
                  </div>
                </div>
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
                  <div className="divide-y divide-gray-200">
                    {data.invoices.map((invoice) => (
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
                              <p className="font-medium text-gray-900">{invoice.month}</p>
                              <p className="text-sm text-gray-500">
                                {invoice.id} | Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              ₹{invoice.amount.toLocaleString()}
                            </p>
                            {getStatusBadge(invoice.status)}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {selectedInvoice === invoice.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="space-y-2 mb-4">
                              {invoice.breakdown.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between text-sm text-gray-600"
                                >
                                  <span>{item.item}</span>
                                  <span>₹{item.amount.toLocaleString()}</span>
                                </div>
                              ))}
                              <div className="flex justify-between font-semibold pt-2 border-t">
                                <span>Total</span>
                                <span>₹{invoice.amount.toLocaleString()}</span>
                              </div>
                            </div>
                            {invoice.status !== 'paid' && (
                              <Button className="w-full" size="sm">
                                Pay ₹{invoice.amount.toLocaleString()}
                              </Button>
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
                  <div className="divide-y divide-gray-200">
                    {data.paymentHistory.map((payment, index) => (
                      <div key={index} className="px-6 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              ₹{payment.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.date).toLocaleDateString('en-IN')} • {payment.method}
                            </p>
                          </div>
                          <button className="text-primary text-xs hover:underline">
                            {payment.receipt}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pay All Button */}
              {totalDue > 0 && (
                <Card className="mt-6 bg-gradient-to-r from-primary to-primary/80 text-white">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-white/80 mb-2">Total Outstanding</p>
                    <p className="text-3xl font-bold mb-4">₹{totalDue.toLocaleString()}</p>
                    <Button variant="secondary" className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay All Dues
                    </Button>
                    <p className="text-xs text-white/60 mt-3">
                      Secure payment via UPI, Cards, Net Banking
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
