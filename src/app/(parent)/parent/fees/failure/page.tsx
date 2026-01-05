'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import {
  XCircle,
  RefreshCw,
  Home,
  Receipt,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
} from 'lucide-react'

interface Transaction {
  id: string
  order_id: string
  amount: number
  status: string
  ntt_response_message: string
  fee_invoices?: {
    id: string
    invoice_number: string
  }
  students?: {
    id: string
    first_name: string
    last_name: string
  }
}

export default function PaymentFailurePage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const errorMessage = searchParams.get('error')

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

  const getRetryUrl = () => {
    if (transaction?.fee_invoices?.id && transaction?.students?.id) {
      return `/parent/fees/pay/${transaction.fee_invoices.id}?student_id=${transaction.students.id}`
    }
    return '/parent/fees'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          {/* Failure Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Failed</h1>
            <p className="text-gray-500 mt-2">
              We couldn't process your payment
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">What went wrong?</p>
                <p className="text-sm text-red-700 mt-1">
                  {transaction?.ntt_response_message ||
                    errorMessage ||
                    'The payment was declined or cancelled. This could be due to insufficient funds, network issues, or the transaction was cancelled by user.'}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          {transaction && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              {transaction.order_id && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-mono">{transaction.order_id}</span>
                </div>
              )}
              {transaction.amount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Amount</span>
                  <span>₹{parseFloat(transaction.amount?.toString() || '0').toLocaleString()}</span>
                </div>
              )}
              {transaction.fee_invoices && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Invoice</span>
                  <span>{transaction.fee_invoices.invoice_number}</span>
                </div>
              )}
              {transaction.students && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Student</span>
                  <span>
                    {transaction.students.first_name} {transaction.students.last_name}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link href={getRetryUrl()} className="block">
              <Button className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </Link>

            <Link href="/parent/fees" className="block">
              <Button variant="outline" className="w-full">
                <Receipt className="h-4 w-4 mr-2" />
                View All Fees
              </Button>
            </Link>

            <Link href="/parent" className="block">
              <Button variant="ghost" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">
              Need help? Contact the school office
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="ghost" size="sm" disabled>
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
              <Button variant="ghost" size="sm" disabled>
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            </div>
          </div>

          {/* Common Issues */}
          <div className="mt-6 text-xs text-gray-500">
            <p className="font-medium mb-2">Common reasons for payment failure:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Insufficient balance in your account</li>
              <li>Incorrect card details or expired card</li>
              <li>Bank server issues or network problems</li>
              <li>Transaction limit exceeded</li>
              <li>Payment cancelled by user</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
