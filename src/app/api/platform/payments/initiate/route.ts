import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt, isEncrypted } from '@/lib/utils/encryption'

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1'

interface PlanConfig {
  name: string
  price: number | null
  currency: string
  period: string
  student_limit: number | null
  admin_limit: number | null
  features: string[]
}

interface InitiatePaymentRequest {
  plan_type: 'starter' | 'professional'
  customer_name: string
  customer_email: string
  customer_phone: string
  school_name: string
  student_count: number
}

/**
 * POST /api/platform/payments/initiate
 * Create Razorpay order for subscription payment
 * No authentication required (public endpoint for landing page)
 */
export async function POST(request: NextRequest) {
  try {
    const body: InitiatePaymentRequest = await request.json()
    const { plan_type, customer_name, customer_email, customer_phone, school_name, student_count } = body

    // Validate required fields
    if (!plan_type || !customer_name || !customer_email || !customer_phone || !school_name || !student_count) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate plan type
    if (!['starter', 'professional'].includes(plan_type)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Use starter or professional.' },
        { status: 400 }
      )
    }

    // Validate student count
    if (student_count < 1 || student_count > 10000) {
      return NextResponse.json(
        { error: 'Student count must be between 1 and 10000' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch payment gateway and pricing plans settings
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['payment_gateway', 'pricing_plans'])

    if (settingsError) {
      console.error('Error fetching settings:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
    }

    // Transform array to object
    const settingsMap: Record<string, unknown> = {}
    settings?.forEach((s: { key: string; value: unknown }) => {
      settingsMap[s.key] = s.value
    })

    const paymentGateway = settingsMap.payment_gateway as Record<string, unknown> || {}
    const pricingPlans = settingsMap.pricing_plans as Record<string, PlanConfig> || {}

    // Check if payments are enabled
    if (!paymentGateway.is_enabled || !paymentGateway.is_configured) {
      return NextResponse.json(
        { error: 'Online payments are not currently available' },
        { status: 503 }
      )
    }

    // Get the selected plan
    const selectedPlan = pricingPlans[plan_type]
    if (!selectedPlan || selectedPlan.price === null) {
      return NextResponse.json(
        { error: 'Selected plan is not available for online payment' },
        { status: 400 }
      )
    }

    // Validate student count against plan limits
    if (selectedPlan.student_limit && student_count > selectedPlan.student_limit) {
      return NextResponse.json(
        { error: `Student count exceeds plan limit of ${selectedPlan.student_limit}` },
        { status: 400 }
      )
    }

    // Calculate amount (price per student * number of students)
    // Razorpay expects amount in paise (smallest currency unit)
    const amount = selectedPlan.price * student_count * 100 // Convert to paise

    // Decrypt the key_secret
    let keySecret = paymentGateway.key_secret as string
    if (isEncrypted(keySecret)) {
      keySecret = decrypt(keySecret)
    }

    const keyId = paymentGateway.key_id as string

    // Create Razorpay order
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const orderPayload = {
      amount,
      currency: selectedPlan.currency || 'INR',
      receipt: `platform_${plan_type}_${Date.now()}`,
      notes: {
        plan_type,
        school_name,
        customer_name,
        customer_email,
        customer_phone,
        student_count: student_count.toString(),
        price_per_student: selectedPlan.price.toString(),
      },
    }

    const orderResponse = await fetch(`${RAZORPAY_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json()
      console.error('Razorpay order creation failed:', errorData)
      return NextResponse.json(
        { error: 'Failed to create payment order' },
        { status: 500 }
      )
    }

    const order = await orderResponse.json()

    // Return checkout options for the frontend
    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      checkout_options: {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: paymentGateway.display_name || 'Shiksha SMS',
        description: `${selectedPlan.name} Plan - ${student_count} students`,
        order_id: order.id,
        prefill: {
          name: customer_name,
          email: customer_email,
          contact: customer_phone,
        },
        notes: orderPayload.notes,
        theme: {
          color: paymentGateway.theme_color || '#f97316',
        },
      },
      plan_details: {
        name: selectedPlan.name,
        price_per_student: selectedPlan.price,
        student_count,
        total_amount: amount / 100, // Convert back to rupees for display
        currency: selectedPlan.currency,
      },
    })
  } catch (error) {
    console.error('Error initiating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
