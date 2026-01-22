import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/platform/payments/config
 * Public endpoint - Returns payment configuration for landing page
 * No authentication required
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch payment gateway and pricing plans settings
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['payment_gateway', 'pricing_plans'])

    if (error) {
      console.error('Error fetching payment config:', error)
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
    }

    // Transform array to object
    const settingsMap: Record<string, unknown> = {}
    settings?.forEach((s: { key: string; value: unknown }) => {
      settingsMap[s.key] = s.value
    })

    const paymentGateway = settingsMap.payment_gateway as Record<string, unknown> || {}
    const pricingPlans = settingsMap.pricing_plans as Record<string, unknown> || {}

    // Only return public-safe information
    // Never expose key_secret or webhook_secret
    const isEnabled = paymentGateway.is_enabled === true && paymentGateway.is_configured === true

    return NextResponse.json({
      is_enabled: isEnabled,
      key_id: isEnabled ? paymentGateway.key_id : null,
      display_name: paymentGateway.display_name || 'Shiksha SMS',
      theme_color: paymentGateway.theme_color || '#f97316',
      mode: paymentGateway.mode || 'test',
      pricing_plans: pricingPlans,
    })
  } catch (error) {
    console.error('Error in payment config API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
