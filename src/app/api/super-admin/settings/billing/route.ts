import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt, decrypt, isEncrypted } from '@/lib/utils/encryption'

const MASKED_VALUE = '••••••••••••••••'

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

    // Process payment gateway to mask secrets
    let paymentGateway = settingsMap.payment_gateway as Record<string, unknown> || {}
    if (paymentGateway && typeof paymentGateway === 'object') {
      const processedGateway = { ...paymentGateway }

      // Mask key_secret if it exists and is encrypted
      if (processedGateway.key_secret && typeof processedGateway.key_secret === 'string') {
        if (isEncrypted(processedGateway.key_secret)) {
          processedGateway.key_secret = MASKED_VALUE
        }
      }

      // Mask webhook_secret if it exists and is encrypted
      if (processedGateway.webhook_secret && typeof processedGateway.webhook_secret === 'string') {
        if (isEncrypted(processedGateway.webhook_secret)) {
          processedGateway.webhook_secret = MASKED_VALUE
        }
      }

      paymentGateway = processedGateway
    }

    return NextResponse.json({
      pricing_plans: settingsMap.pricing_plans || {},
      payment_gateway: paymentGateway,
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
      // Use upsert to handle case where row doesn't exist yet
      // Note: updated_by is omitted as super_admin may not be in users table
      const { error: plansError } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'pricing_plans',
          value: pricing_plans,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })

      if (plansError) {
        console.error('Error updating pricing plans:', plansError)
        return NextResponse.json({ error: 'Failed to update pricing plans' }, { status: 500 })
      }
    }

    // Update payment gateway if provided
    if (payment_gateway) {
      // Get existing settings to preserve encrypted values if masked
      const { data: existingSettings } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'payment_gateway')
        .single()

      const existingGateway = existingSettings?.value as Record<string, unknown> || {}
      const updatedGateway = { ...payment_gateway }

      // Handle key_secret: encrypt if new value, preserve if masked
      if (updatedGateway.key_secret === MASKED_VALUE) {
        // Keep existing encrypted value
        updatedGateway.key_secret = existingGateway.key_secret
      } else if (updatedGateway.key_secret && typeof updatedGateway.key_secret === 'string' && updatedGateway.key_secret.trim()) {
        // Encrypt new value
        updatedGateway.key_secret = encrypt(updatedGateway.key_secret)
      }

      // Handle webhook_secret: encrypt if new value, preserve if masked
      if (updatedGateway.webhook_secret === MASKED_VALUE) {
        // Keep existing encrypted value
        updatedGateway.webhook_secret = existingGateway.webhook_secret
      } else if (updatedGateway.webhook_secret && typeof updatedGateway.webhook_secret === 'string' && updatedGateway.webhook_secret.trim()) {
        // Encrypt new value
        updatedGateway.webhook_secret = encrypt(updatedGateway.webhook_secret)
      }

      // Set is_configured based on whether key_id and key_secret exist
      updatedGateway.is_configured = !!(updatedGateway.key_id && updatedGateway.key_secret)

      // Use upsert to handle case where row doesn't exist yet
      // Note: updated_by is omitted as super_admin may not be in users table
      const { error: gatewayError } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'payment_gateway',
          value: updatedGateway,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })

      if (gatewayError) {
        console.error('Error updating payment gateway:', gatewayError)
        return NextResponse.json({ error: 'Failed to update payment gateway' }, { status: 500 })
      }

      // Return masked values for secrets
      const responseGateway = { ...updatedGateway }
      if (responseGateway.key_secret && isEncrypted(responseGateway.key_secret as string)) {
        responseGateway.key_secret = MASKED_VALUE
      }
      if (responseGateway.webhook_secret && isEncrypted(responseGateway.webhook_secret as string)) {
        responseGateway.webhook_secret = MASKED_VALUE
      }

      return NextResponse.json({
        success: true,
        message: 'Billing settings updated successfully',
        payment_gateway: responseGateway
      })
    }

    return NextResponse.json({ success: true, message: 'Billing settings updated successfully' })
  } catch (error) {
    console.error('Error updating billing settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
