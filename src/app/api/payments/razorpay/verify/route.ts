import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { verifyPaymentSignature, mapPaymentStatus, RazorpayClient } from '@/lib/payments/razorpay';
import type { RazorpayConfig } from '@/lib/payments/razorpay';

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const validatedData = verifySchema.parse(body);

    // Find the transaction by Razorpay order ID
    const { data: transaction, error: txnError } = await supabase
      .from('payment_transactions')
      .select('*, fee_invoices(*)')
      .eq('razorpay_order_id', validatedData.razorpay_order_id)
      .single();

    if (txnError || !transaction) {
      console.error('[Razorpay Verify] Transaction not found:', validatedData.razorpay_order_id);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Get Razorpay config for this school
    const { data: razorpayConfig, error: configError } = await supabase
      .from('razorpay_configs')
      .select('*')
      .eq('school_id', transaction.school_id)
      .single();

    if (configError || !razorpayConfig) {
      console.error('[Razorpay Verify] Config not found for school:', transaction.school_id);
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 400 }
      );
    }

    // Verify the payment signature
    const isValid = verifyPaymentSignature(validatedData, razorpayConfig as RazorpayConfig);

    if (!isValid) {
      console.error('[Razorpay Verify] Invalid signature');

      // Update transaction as failed
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          razorpay_payment_id: validatedData.razorpay_payment_id,
          razorpay_signature: validatedData.razorpay_signature,
          gateway_response: { error: 'Invalid signature' },
          completed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const client = new RazorpayClient(razorpayConfig as RazorpayConfig);
    const payment = await client.fetchPayment(validatedData.razorpay_payment_id);

    const paymentStatus = payment ? mapPaymentStatus(payment.status) : 'success';

    // Update transaction with success
    await supabase
      .from('payment_transactions')
      .update({
        status: paymentStatus,
        transaction_id: validatedData.razorpay_payment_id,
        razorpay_payment_id: validatedData.razorpay_payment_id,
        razorpay_signature: validatedData.razorpay_signature,
        payment_mode: payment?.method || 'razorpay',
        gateway_response: payment || { verified: true },
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    // If payment successful, create fee_payment and update invoice
    if (paymentStatus === 'success') {
      await processSuccessfulPayment(supabase, transaction, {
        paymentId: validatedData.razorpay_payment_id,
        method: payment?.method || 'razorpay',
      });

      return NextResponse.json({
        success: true,
        redirect_url: `/parent/fees/success?order_id=${transaction.order_id}`,
      });
    } else {
      return NextResponse.json({
        success: false,
        redirect_url: `/parent/fees/failure?order_id=${transaction.order_id}&reason=Payment not captured`,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Razorpay Verify] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processSuccessfulPayment(
  supabase: ReturnType<typeof createAdminClient>,
  transaction: {
    id: string;
    invoice_id: string;
    amount: number;
    school_id: string;
    fee_invoices: {
      id: string;
      paid_amount: number;
      balance_amount: number;
      net_amount: number;
      status: string;
    };
  },
  paymentDetails: { paymentId: string; method: string }
) {
  const invoice = transaction.fee_invoices;

  // Create fee_payment record
  const receiptNumber = `RCP-${Date.now()}`;

  const { data: payment, error: paymentError } = await supabase
    .from('fee_payments')
    .insert({
      school_id: transaction.school_id,
      invoice_id: transaction.invoice_id,
      receipt_number: receiptNumber,
      amount: transaction.amount,
      payment_date: new Date().toISOString(),
      payment_mode: 'online',
      transaction_id: paymentDetails.paymentId,
      payment_transaction_id: transaction.id,
      remarks: `Online payment via Razorpay (${paymentDetails.method})`,
    })
    .select()
    .single();

  if (paymentError) {
    console.error('[Razorpay Verify] Error creating fee_payment:', paymentError);
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

  console.log('[Razorpay Verify] Payment processed successfully:', {
    payment_id: payment.id,
    receipt_number: receiptNumber,
    new_status: newStatus,
  });
}
