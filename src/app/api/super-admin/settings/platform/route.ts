import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/super-admin/settings/platform
 * Get platform settings (general and feature flags)
 */
export async function GET() {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (authUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Fetch general settings and feature flags
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['general', 'feature_flags'])

    if (error) {
      console.error('Error fetching platform settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Transform array to object
    const settingsMap: Record<string, unknown> = {}
    settings?.forEach((s: { key: string; value: unknown }) => {
      settingsMap[s.key] = s.value
    })

    return NextResponse.json({
      general: settingsMap.general || {},
      feature_flags: settingsMap.feature_flags || {},
    })
  } catch (error) {
    console.error('Error in platform settings API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/super-admin/settings/platform
 * Update platform settings
 */
export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (authUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const body = await req.json()
    const { general, feature_flags } = body

    // Update general settings if provided
    if (general) {
      const { error: generalError } = await supabase
        .from('platform_settings')
        .update({
          value: general,
          updated_by: authUser.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'general')

      if (generalError) {
        console.error('Error updating general settings:', generalError)
        return NextResponse.json({ error: 'Failed to update general settings' }, { status: 500 })
      }
    }

    // Update feature flags if provided
    if (feature_flags) {
      const { error: flagsError } = await supabase
        .from('platform_settings')
        .update({
          value: feature_flags,
          updated_by: authUser.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'feature_flags')

      if (flagsError) {
        console.error('Error updating feature flags:', flagsError)
        return NextResponse.json({ error: 'Failed to update feature flags' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating platform settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
