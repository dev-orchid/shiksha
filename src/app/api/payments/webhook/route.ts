import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parsePaymentResponse, mapPaymentStatus } from '@/lib/payments/ntt-data'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Parse webhook data
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

    console.log('[Payment Webhook] Received data:', data)

    // Parse and verify the response
    const { valid, response, error } = parsePaymentResponse(data)

    if (!valid || !response) {
      console.error('[Payment Webhook] Invalid response:', error)
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
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
      console.error('[Payment Webhook] Transaction not found:', orderId)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Idempotency check - if already processed successfully, acknowledge
    if (transaction.status === 'success') {
      console.log('[Payment Webhook] Transaction already processed:', orderId)
      return NextResponse.json({ message: 'Already processed' })
    }

    // Update transaction with webhook data
    await supabase
      .from('payment_transactions')
      .update({
        status,
        transaction_id: response.transactionId,
        payment_mode: response.paymentMode,
        ntt_order_id: response.orderId,
        ntt_response_code: response.responseCode,
        ntt_response_message: response.responseMessage,
        webhook_payload: response,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)

    // If payment successful and not already processed via callback
    if (status === 'success') {
      // Check if fee_payment already exists
      const { data: existingPayment } = await supabase
        .from('fee_payments')
        .select('id')
        .eq('payment_transaction_id', transaction.id)
        .single()

      if (!existingPayment) {
        await processSuccessfulPayment(supabase, transaction, response)
      }
    }

    // Acknowledge webhook
    return NextResponse.json({ message: 'Webhook processed' })

  } catch (error) {
    console.error('[Payment Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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
      remarks: `Online payment via ${response.paymentMode || 'gateway'} (webhook)`,
    })
    .select()
    .single()

  if (paymentError) {
    console.error('[Payment Webhook] Error creating fee_payment:', paymentError)
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

  console.log('[Payment Webhook] Payment processed successfully:', {
    payment_id: payment.id,
    receipt_number: receiptNumber,
    new_status: newStatus,
  })
}
