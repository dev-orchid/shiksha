import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt, isEncrypted } from '@/lib/utils/encryption'
import crypto from 'crypto'

interface VerifyPaymentRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  customer_info: {
    plan_type: string
    school_name: string
    customer_name: string
    customer_email: string
    customer_phone: string
    student_count: number
  }
}

/**
 * POST /api/platform/payments/verify
 * Verify payment after Razorpay checkout completion
 * No authentication required (public endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const body: VerifyPaymentRequest = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, customer_info } = body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification details' },
        { status: 400 }
      )
    }

    if (!customer_info) {
      return NextResponse.json(
        { error: 'Missing customer information' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch payment gateway settings
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'payment_gateway')
      .single()

    if (settingsError || !settings) {
      console.error('Error fetching payment settings:', settingsError)
      return NextResponse.json({ error: 'Payment configuration not found' }, { status: 500 })
    }

    const paymentGateway = settings.value as Record<string, unknown>

    // Get the key_secret for signature verification
    let keySecret = paymentGateway.key_secret as string
    if (isEncrypted(keySecret)) {
      keySecret = decrypt(keySecret)
    }

    // Verify the signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed')
      return NextResponse.json(
        { error: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      )
    }

    // Store the payment record in the database
    const { data: payment, error: paymentError } = await supabase
      .from('platform_payments')
      .insert({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        plan_type: customer_info.plan_type,
        school_name: customer_info.school_name,
        customer_name: customer_info.customer_name,
        customer_email: customer_info.customer_email,
        customer_phone: customer_info.customer_phone,
        student_count: customer_info.student_count,
        status: 'verified',
      })
      .select('id')
      .single()

    if (paymentError) {
      // Log detailed error for debugging
      console.error('Error storing payment record:', JSON.stringify(paymentError, null, 2))
      console.error('Insert data was:', JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        plan_type: customer_info.plan_type,
        school_name: customer_info.school_name,
        customer_name: customer_info.customer_name,
        customer_email: customer_info.customer_email,
        customer_phone: customer_info.customer_phone,
        student_count: customer_info.student_count,
      }, null, 2))
      // Continue anyway since payment is verified
    }

    // Return success with redirect URL - only include payment_id for security
    // Customer data will be fetched from database on signup page
    const paymentId = payment?.id || razorpay_payment_id

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: paymentId,
      redirect_url: `/signup?payment_id=${paymentId}`,
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
