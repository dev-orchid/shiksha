import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import {
  RazorpayClient,
  generateOrderReceipt,
  type RazorpayConfig,
  type CheckoutOptions,
} from '@/lib/payments/razorpay';

const initiateSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  student_id: z.string().uuid(),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(10),
});

function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD_${timestamp}${random}`.toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const validatedData = initiateSchema.parse(body);

    // Verify invoice exists and is not fully paid
    const { data: invoice, error: invoiceError } = await supabase
      .from('fee_invoices')
      .select('*, students(id, first_name, last_name, school_id)')
      .eq('id', validatedData.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice is already fully paid' },
        { status: 400 }
      );
    }

    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Invoice has been cancelled' },
        { status: 400 }
      );
    }

    // Verify amount doesn't exceed balance
    const balanceAmount = parseFloat(
      invoice.balance_amount || invoice.net_amount
    );
    if (validatedData.amount > balanceAmount) {
      return NextResponse.json(
        { error: `Amount exceeds balance. Maximum payable: ${balanceAmount}` },
        { status: 400 }
      );
    }

    const schoolId = invoice.students?.school_id || invoice.school_id;

    // Check if Razorpay is configured for this school
    const { data: razorpayConfig, error: configError } = await supabase
      .from('razorpay_configs')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_enabled', true)
      .single();

    if (configError || !razorpayConfig) {
      return NextResponse.json(
        {
          error:
            'Payment gateway not configured. Please contact the school administration.',
        },
        { status: 400 }
      );
    }

    // Check for pending transactions for this invoice (within last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: pendingTxn } = await supabase
      .from('payment_transactions')
      .select('id, order_id, razorpay_order_id')
      .eq('invoice_id', validatedData.invoice_id)
      .eq('status', 'initiated')
      .gte('initiated_at', thirtyMinutesAgo)
      .single();

    if (pendingTxn) {
      return NextResponse.json(
        {
          error:
            'A payment is already in progress for this invoice. Please wait or try again later.',
        },
        { status: 409 }
      );
    }

    // Create Razorpay order
    const client = new RazorpayClient(razorpayConfig as RazorpayConfig);
    const orderId = generateOrderId();
    const receipt = generateOrderReceipt(validatedData.invoice_id);
    const amountInPaise = Math.round(validatedData.amount * 100);

    const orderResult = await client.createOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      notes: {
        invoice_id: validatedData.invoice_id,
        student_id: validatedData.student_id,
        order_id: orderId,
      },
    });

    if (!orderResult.success || !orderResult.order) {
      console.error('Failed to create Razorpay order:', orderResult.error);
      return NextResponse.json(
        { error: orderResult.error || 'Failed to initiate payment' },
        { status: 500 }
      );
    }

    // Create transaction record
    const { data: transaction, error: txnError } = await supabase
      .from('payment_transactions')
      .insert({
        school_id: schoolId,
        invoice_id: validatedData.invoice_id,
        student_id: validatedData.student_id,
        order_id: orderId,
        amount: validatedData.amount,
        currency: 'INR',
        status: 'initiated',
        payment_gateway: 'razorpay',
        razorpay_order_id: orderResult.order.id,
        customer_name: validatedData.customer_name,
        customer_email: validatedData.customer_email,
        customer_phone: validatedData.customer_phone,
        gateway_request: {
          amount: amountInPaise,
          receipt: receipt,
          razorpay_order_id: orderResult.order.id,
        },
      })
      .select()
      .single();

    if (txnError) {
      console.error('Error creating transaction:', txnError);
      return NextResponse.json(
        { error: 'Failed to initiate payment' },
        { status: 500 }
      );
    }

    // Build checkout options for the frontend
    const checkoutOptions: CheckoutOptions = {
      key: client.getKeyId(),
      amount: amountInPaise,
      currency: 'INR',
      name: razorpayConfig.display_name || 'School Fees',
      description: `Fee Payment - Invoice ${invoice.invoice_number}`,
      order_id: orderResult.order.id,
      prefill: {
        name: validatedData.customer_name,
        email: validatedData.customer_email,
        contact: validatedData.customer_phone,
      },
      notes: {
        invoice_id: validatedData.invoice_id,
        student_id: validatedData.student_id,
        order_id: orderId,
      },
      theme: razorpayConfig.theme_color
        ? { color: razorpayConfig.theme_color }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        transaction_id: transaction.id,
        razorpay_order_id: orderResult.order.id,
        checkout_options: checkoutOptions,
        amount: validatedData.amount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error initiating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
