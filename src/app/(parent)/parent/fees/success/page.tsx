'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import {
  CheckCircle,
  Download,
  Home,
  Receipt,
  Loader2,
  IndianRupee,
  Calendar,
  Hash,
} from 'lucide-react'

interface Transaction {
  id: string
  order_id: string
  transaction_id: string
  amount: number
  status: string
  payment_mode: string
  completed_at: string
  fee_invoices?: {
    id: string
    invoice_number: string
    total_amount: number
    net_amount: number
    status: string
  }
  students?: {
    id: string
    first_name: string
    last_name: string
    admission_number: string
  }
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!orderId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/payments/${orderId}`)
        if (response.ok) {
          const data = await response.json()
          setTransaction(data.data)
        }
      } catch (err) {
        console.error('Error fetching transaction:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-gray-500 mt-2">
              Your payment has been processed successfully
            </p>
          </div>

          {/* Transaction Details */}
          {transaction ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <IndianRupee className="h-4 w-4" />
                  <span className="text-sm">Amount Paid</span>
                </div>
                <span className="font-bold text-lg">
                  ₹{parseFloat(transaction.amount?.toString() || '0').toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Hash className="h-4 w-4" />
                  <span className="text-sm">Transaction ID</span>
                </div>
                <span className="font-mono text-sm">
                  {transaction.transaction_id || transaction.order_id}
                </span>
              </div>

              {transaction.fee_invoices && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Receipt className="h-4 w-4" />
                    <span className="text-sm">Invoice</span>
                  </div>
                  <span className="text-sm">
                    {transaction.fee_invoices.invoice_number}
                  </span>
                </div>
              )}

              {transaction.completed_at && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Date</span>
                  </div>
                  <span className="text-sm">
                    {new Date(transaction.completed_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {transaction.payment_mode && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment Mode</span>
                  <span className="text-sm capitalize">{transaction.payment_mode}</span>
                </div>
              )}

              {transaction.students && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Paid for</p>
                  <p className="font-medium">
                    {transaction.students.first_name} {transaction.students.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.students.admission_number}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 text-green-800 rounded-lg p-4 mb-6 text-center">
              <p>Your payment was successful.</p>
              <p className="text-sm mt-1">A receipt has been sent to your registered email.</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button variant="outline" className="w-full" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>

            <Link href="/parent/fees" className="block">
              <Button variant="outline" className="w-full">
                <Receipt className="h-4 w-4 mr-2" />
                View All Fees
              </Button>
            </Link>

            <Link href="/parent" className="block">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-gray-500 mt-6">
            If you have any questions about this payment, please contact the school office.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
