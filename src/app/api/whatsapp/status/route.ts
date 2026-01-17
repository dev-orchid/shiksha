import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { whatsappClientManager } from '@/lib/whatsapp/client-manager'

// GET - Get WhatsApp connection status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')

    // If no school_id provided, try to get the first school
    let targetSchoolId = schoolId

    if (!targetSchoolId) {
      const supabase = createAdminClient()
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .single()

      if (!school) {
        return NextResponse.json(
          { error: 'No school found' },
          { status: 404 }
        )
      }
      targetSchoolId = school.id
    }

    // First check in-memory status (most accurate for real-time)
    const liveStatus = targetSchoolId ? whatsappClientManager.getStatus(targetSchoolId) : null

    // If client is connected in memory, return that status
    if (liveStatus?.isConnected) {
      const isFullyReady = whatsappClientManager.isFullyReady(targetSchoolId!)
      return NextResponse.json({
        isConnected: true,
        isFullyReady,
        phoneNumber: liveStatus.phoneNumber,
        deviceName: liveStatus.deviceName,
        lastSeen: liveStatus.lastSeen,
        batteryLevel: liveStatus.batteryLevel,
      })
    }

    // Check if initializing
    if (targetSchoolId && whatsappClientManager.isInitializing(targetSchoolId)) {
      const qrCode = whatsappClientManager.getQRCode(targetSchoolId)
      return NextResponse.json({
        isConnected: false,
        isInitializing: true,
        qrCode,
        phoneNumber: null,
        deviceName: null,
        lastSeen: null,
        batteryLevel: null,
      })
    }

    // Fall back to database for stored status
    const supabase = createAdminClient()
    const { data: config } = await supabase
      .from('whatsapp_configs')
      .select('*')
      .eq('school_id', targetSchoolId)
      .single()

    if (!config) {
      return NextResponse.json({
        isConnected: false,
        phoneNumber: null,
        deviceName: null,
        lastSeen: null,
        batteryLevel: null,
      })
    }

    // If database shows connected but in-memory client isn't,
    // the session was lost (server restart). Update DB and return not connected.
    if (config.is_connected && !liveStatus?.isConnected) {
      await supabase
        .from('whatsapp_configs')
        .update({ is_connected: false })
        .eq('school_id', targetSchoolId)

      return NextResponse.json({
        isConnected: false,
        needsReconnect: true,
        phoneNumber: config.phone_number || null,
        deviceName: null,
        lastSeen: config.last_connected_at || null,
        batteryLevel: null,
        message: 'Session expired. Please reconnect by scanning the QR code.',
      })
    }

    return NextResponse.json({
      isConnected: false,
      phoneNumber: config.phone_number || null,
      deviceName: null,
      lastSeen: config.last_connected_at || null,
      batteryLevel: null,
      qrCode: config.qr_code || null,
    })
  } catch (error) {
    console.error('Error getting WhatsApp status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
