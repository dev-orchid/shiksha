import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parsePaymentResponse, mapPaymentStatus } from '@/lib/payments/ntt-data'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Parse form data or JSON body
    let data: Record<string, string> = {}

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      formData.forEach((value, key) => {
        data[key] = value.toString()
      })
    } else {
      data = await request.json()
    }

    console.log('[Payment Callback] Received data:', data)

    // Parse and verify the response
    const { valid, response, error } = parsePaymentResponse(data)

    if (!valid || !response) {
      console.error('[Payment Callback] Invalid response:', error)
      // Redirect to failure page
      return NextResponse.redirect(
        new URL(`/parent/fees/failure?error=${encodeURIComponent(error || 'Invalid response')}`, request.url)
      )
    }

    const orderId = response.orderId
    const status = mapPaymentStatus(response.status)

    // Find the transaction
    const { data: transaction, error: txnError } = await supabase
      .from('payment_transactions')
      .select('*, fee_invoices(*)')
      .eq('order_id', orderId)
      .single()

    if (txnError || !transaction) {
      console.error('[Payment Callback] Transaction not found:', orderId)
      return NextResponse.redirect(
        new URL('/parent/fees/failure?error=Transaction not found', request.url)
      )
    }

    // Update transaction with response
    await supabase
      .from('payment_transactions')
      .update({
        status,
        transaction_id: response.transactionId,
        payment_mode: response.paymentMode,
        ntt_order_id: response.orderId,
        ntt_response_code: response.responseCode,
        ntt_response_message: response.responseMessage,
        gateway_response: response,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)

    // If payment successful, create fee_payment and update invoice
    if (status === 'success') {
      await processSuccessfulPayment(supabase, transaction, response)

      return NextResponse.redirect(
        new URL(`/parent/fees/success?order_id=${orderId}`, request.url)
      )
    } else if (status === 'pending') {
      return NextResponse.redirect(
        new URL(`/parent/fees/pending?order_id=${orderId}`, request.url)
      )
    } else {
      return NextResponse.redirect(
        new URL(`/parent/fees/failure?order_id=${orderId}&reason=${encodeURIComponent(response.responseMessage || 'Payment failed')}`, request.url)
      )
    }

  } catch (error) {
    console.error('[Payment Callback] Error:', error)
    return NextResponse.redirect(
      new URL('/parent/fees/failure?error=Processing error', request.url)
    )
  }
}

// Also handle GET for redirect-based callbacks
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const data: Record<string, string> = {}

  searchParams.forEach((value, key) => {
    data[key] = value
  })

  // Convert to POST-like handling
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(data),
  })

  return POST(postRequest)
}

async function processSuccessfulPayment(
  supabase: ReturnType<typeof createAdminClient>,
  transaction: {
    id: string
    invoice_id: string
    amount: number
    school_id: string
    fee_invoices: {
      id: string
      paid_amount: number
      balance_amount: number
      net_amount: number
      status: string
    }
  },
  response: { transactionId: string; paymentMode: string }
) {
  const invoice = transaction.fee_invoices

  // Create fee_payment record
  const receiptNumber = `RCP-${Date.now()}`

  const { data: payment, error: paymentError } = await supabase
    .from('fee_payments')
    .insert({
      school_id: transaction.school_id,
      invoice_id: transaction.invoice_id,
      receipt_number: receiptNumber,
      amount: transaction.amount,
      payment_date: new Date().toISOString(),
      payment_mode: 'online',
      transaction_id: response.transactionId,
      payment_transaction_id: transaction.id,
      remarks: `Online payment via ${response.paymentMode || 'gateway'}`,
    })
    .select()
    .single()

  if (paymentError) {
    console.error('[Payment Callback] Error creating fee_payment:', paymentError)
    return
  }

  // Update invoice
  const newPaidAmount = parseFloat(invoice.paid_amount?.toString() || '0') + transaction.amount
  const newBalanceAmount = parseFloat(invoice.net_amount?.toString() || '0') - newPaidAmount
  const newStatus = newBalanceAmount <= 0 ? 'paid' : 'partial'

  await supabase
    .from('fee_invoices')
    .update({
      paid_amount: newPaidAmount,
      balance_amount: Math.max(0, newBalanceAmount),
      status: newStatus,
    })
    .eq('id', transaction.invoice_id)

  console.log('[Payment Callback] Payment processed successfully:', {
    payment_id: payment.id,
    receipt_number: receiptNumber,
    new_status: newStatus,
  })
}
