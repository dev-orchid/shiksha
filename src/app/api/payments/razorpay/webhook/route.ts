import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature, mapPaymentStatus } from '@/lib/payments/razorpay';
import type { RazorpayConfig, RazorpayWebhookEvent } from '@/lib/payments/razorpay';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('[Razorpay Webhook] Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: RazorpayWebhookEvent;
    try {
      event = JSON.parse(rawBody);
    } catch {
      console.error('[Razorpay Webhook] Invalid JSON body');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('[Razorpay Webhook] Received event:', event.event);

    // Handle payment events
    if (event.event.startsWith('payment.')) {
      const payment = event.payload.payment?.entity;

      if (!payment) {
        return NextResponse.json({ error: 'No payment in payload' }, { status: 400 });
      }

      // Find transaction by Razorpay order ID
      const { data: transaction, error: txnError } = await supabase
        .from('payment_transactions')
        .select('*, fee_invoices(*)')
        .eq('razorpay_order_id', payment.order_id)
        .single();

      if (txnError || !transaction) {
        console.log('[Razorpay Webhook] Transaction not found for order:', payment.order_id);
        // Return 200 to acknowledge receipt (may be for a different merchant)
        return NextResponse.json({ received: true });
      }

      // Get Razorpay config for this school
      const { data: razorpayConfig, error: configError } = await supabase
        .from('razorpay_configs')
        .select('*')
        .eq('school_id', transaction.school_id)
        .single();

      if (configError || !razorpayConfig) {
        console.error('[Razorpay Webhook] Config not found for school:', transaction.school_id);
        return NextResponse.json({ error: 'Config not found' }, { status: 400 });
      }

      // Verify webhook signature
      if (razorpayConfig.webhook_secret_encrypted) {
        const isValid = verifyWebhookSignature(
          rawBody,
          signature,
          razorpayConfig as RazorpayConfig
        );

        if (!isValid) {
          console.error('[Razorpay Webhook] Invalid signature');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }
      }

      // Update webhook payload for audit
      await supabase
        .from('payment_transactions')
        .update({
          webhook_payload: event,
        })
        .eq('id', transaction.id);

      // Handle specific events
      switch (event.event) {
        case 'payment.captured':
          await handlePaymentCaptured(supabase, transaction, payment);
          break;

        case 'payment.failed':
          await handlePaymentFailed(supabase, transaction, payment);
          break;

        case 'payment.authorized':
          // Auto-capture is usually enabled, so this may transition to captured
          console.log('[Razorpay Webhook] Payment authorized:', payment.id);
          break;

        default:
          console.log('[Razorpay Webhook] Unhandled event:', event.event);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Razorpay Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handlePaymentCaptured(
  supabase: ReturnType<typeof createAdminClient>,
  transaction: {
    id: string;
    invoice_id: string;
    amount: number;
    school_id: string;
    status: string;
    fee_invoices: {
      id: string;
      paid_amount: number;
      balance_amount: number;
      net_amount: number;
      status: string;
    };
  },
  payment: { id: string; method: string; status: string }
) {
  // Skip if already processed
  if (transaction.status === 'success') {
    console.log('[Razorpay Webhook] Payment already processed:', payment.id);
    return;
  }

  // Update transaction
  await supabase
    .from('payment_transactions')
    .update({
      status: 'success',
      transaction_id: payment.id,
      razorpay_payment_id: payment.id,
      payment_mode: payment.method,
      completed_at: new Date().toISOString(),
    })
    .eq('id', transaction.id);

  // Check if fee_payment already exists (may have been created by verify endpoint)
  const { data: existingPayment } = await supabase
    .from('fee_payments')
    .select('id')
    .eq('payment_transaction_id', transaction.id)
    .single();

  if (existingPayment) {
    console.log('[Razorpay Webhook] Fee payment already exists:', existingPayment.id);
    return;
  }

  // Create fee_payment record
  const invoice = transaction.fee_invoices;
  const receiptNumber = `RCP-${Date.now()}`;

  const { data: feePayment, error: paymentError } = await supabase
    .from('fee_payments')
    .insert({
      school_id: transaction.school_id,
      invoice_id: transaction.invoice_id,
      receipt_number: receiptNumber,
      amount: transaction.amount,
      payment_date: new Date().toISOString(),
      payment_mode: 'online',
      transaction_id: payment.id,
      payment_transaction_id: transaction.id,
      remarks: `Online payment via Razorpay (${payment.method}) - Webhook`,
    })
    .select()
    .single();

  if (paymentError) {
    console.error('[Razorpay Webhook] Error creating fee_payment:', paymentError);
    return;
  }

  // Update invoice
  const newPaidAmount =
    parseFloat(invoice.paid_amount?.toString() || '0') + transaction.amount;
  const newBalanceAmount =
    parseFloat(invoice.net_amount?.toString() || '0') - newPaidAmount;
  const newStatus = newBalanceAmount <= 0 ? 'paid' : 'partial';

  await supabase
    .from('fee_invoices')
    .update({
      paid_amount: newPaidAmount,
      balance_amount: Math.max(0, newBalanceAmount),
      status: newStatus,
    })
    .eq('id', transaction.invoice_id);

  console.log('[Razorpay Webhook] Payment processed via webhook:', {
    payment_id: feePayment.id,
    receipt_number: receiptNumber,
    new_status: newStatus,
  });
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  transaction: { id: string; status: string },
  payment: { id: string; error_description: string | null }
) {
  // Skip if already processed
  if (transaction.status === 'failed') {
    return;
  }

  await supabase
    .from('payment_transactions')
    .update({
      status: 'failed',
      transaction_id: payment.id,
      razorpay_payment_id: payment.id,
      gateway_response: { error: payment.error_description },
      completed_at: new Date().toISOString(),
    })
    .eq('id', transaction.id);

  console.log('[Razorpay Webhook] Payment failed:', payment.id, payment.error_description);
}
