import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/super-admin/settings/billing
 * Get billing settings (pricing plans and payment gateway config)
 */
export async function GET() {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (authUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Fetch pricing plans and payment gateway settings
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['pricing_plans', 'payment_gateway'])

    if (error) {
      console.error('Error fetching billing settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Transform array to object
    const settingsMap: Record<string, unknown> = {}
    settings?.forEach((s: { key: string; value: unknown }) => {
      settingsMap[s.key] = s.value
    })

    return NextResponse.json({
      pricing_plans: settingsMap.pricing_plans || {},
      payment_gateway: settingsMap.payment_gateway || {},
    })
  } catch (error) {
    console.error('Error in billing settings API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/super-admin/settings/billing
 * Update billing settings
 */
export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (authUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const body = await req.json()
    const { pricing_plans, payment_gateway } = body

    // Update pricing plans if provided
    if (pricing_plans) {
      const { error: plansError } = await supabase
        .from('platform_settings')
        .update({
          value: pricing_plans,
          updated_by: authUser.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'pricing_plans')

      if (plansError) {
        console.error('Error updating pricing plans:', plansError)
        return NextResponse.json({ error: 'Failed to update pricing plans' }, { status: 500 })
      }
    }

    // Update payment gateway if provided
    if (payment_gateway) {
      const { error: gatewayError } = await supabase
        .from('platform_settings')
        .update({
          value: payment_gateway,
          updated_by: authUser.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'payment_gateway')

      if (gatewayError) {
        console.error('Error updating payment gateway:', gatewayError)
        return NextResponse.json({ error: 'Failed to update payment gateway' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Billing settings updated successfully' })
  } catch (error) {
    console.error('Error updating billing settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
