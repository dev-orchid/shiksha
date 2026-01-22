import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/platform/payments/info
 * Get payment information by payment_id
 * Used for pre-filling signup form after payment
 * Using POST to avoid exposing payment data in URL/logs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_id: paymentId } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Try to fetch from platform_payments table
    const { data: payment, error } = await supabase
      .from('platform_payments')
      .select('*')
      .or(`id.eq.${paymentId},razorpay_payment_id.eq.${paymentId}`)
      .single()

    if (error || !payment) {
      // Payment record not found
      return NextResponse.json({
        verified: false,
        message: 'Payment details not found. Please contact support.',
      })
    }

    // Check if payment was already used
    if (payment.status === 'used') {
      return NextResponse.json({
        verified: false,
        message: 'This payment has already been used to create an account.',
      })
    }

    // Return payment info (without sensitive Razorpay data)
    return NextResponse.json({
      verified: payment.status === 'verified',
      plan_type: payment.plan_type,
      school_name: payment.school_name,
      customer_name: payment.customer_name,
      customer_email: payment.customer_email,
      customer_phone: payment.customer_phone,
      student_count: payment.student_count,
    })
  } catch (error) {
    console.error('Error fetching payment info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
