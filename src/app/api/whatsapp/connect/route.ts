import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { whatsappClientManager } from '@/lib/whatsapp/client-manager'

const connectSchema = z.object({
  school_id: z.string().uuid().optional(),
})

// POST - Initialize WhatsApp connection
export async function POST(request: NextRequest) {
  try {
    // Check if running on Vercel/serverless (no persistent filesystem)
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return NextResponse.json(
        {
          error: 'WhatsApp Web integration is not available on serverless platforms (Vercel). WhatsApp requires a persistent server to maintain browser sessions. Please deploy to a VPS (DigitalOcean, AWS EC2, Railway) or use a cloud WhatsApp API service.',
          isServerless: true
        },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const parsed = connectSchema.parse(body)

    const supabase = createAdminClient()

    // Auto-detect school_id if not provided
    let schoolId = parsed.school_id
    if (!schoolId) {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .single()

      if (!school) {
        return NextResponse.json(
          { error: 'No school found. Please create a school first.' },
          { status: 404 }
        )
      }
      schoolId = school.id
    }

    // At this point schoolId is guaranteed to be a string
    const school_id = schoolId as string

    // Check if already connected
    const status = whatsappClientManager.getStatus(school_id)
    if (status.isConnected) {
      return NextResponse.json({
        success: true,
        isConnected: true,
        phoneNumber: status.phoneNumber,
      })
    }

    // Check if already initializing and has QR
    if (whatsappClientManager.isInitializing(school_id)) {
      const existingQR = whatsappClientManager.getQRCode(school_id)
      if (existingQR) {
        return NextResponse.json({
          success: true,
          qrCode: existingQR,
        })
      }
      // Check if initialization is stuck (will be handled in initializeClient)
      // Don't return early here - let initializeClient detect and handle stuck state
      const initStartedAt = whatsappClientManager.getInitStartedAt(school_id)
      const isStuck = initStartedAt && (Date.now() - initStartedAt > 30000)
      if (!isStuck) {
        return NextResponse.json({
          success: true,
          message: 'Initializing, please wait...',
        })
      }
      // If stuck, fall through to initializeClient which will cleanup and retry
      console.log(`[WhatsApp] Detected stuck initialization for school: ${school_id}, retrying...`)
    }

    // Initialize client
    const result = await whatsappClientManager.initializeClient(
      school_id,
      // onQR callback - save QR to database
      async (qrCode: string) => {
        await supabase
          .from('whatsapp_configs')
          .upsert({
            school_id,
            phone_number: '',
            qr_code: qrCode,
            is_connected: false,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'school_id',
          })
      },
      // onReady callback - save connection info to database
      async (info) => {
        await supabase
          .from('whatsapp_configs')
          .upsert({
            school_id,
            phone_number: info.phoneNumber || '',
            is_connected: true,
            last_connected_at: new Date().toISOString(),
            qr_code: null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'school_id',
          })
      },
      // onDisconnect callback - update database
      async () => {
        await supabase
          .from('whatsapp_configs')
          .update({
            is_connected: false,
            updated_at: new Date().toISOString(),
          })
          .eq('school_id', school_id)
      }
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to initialize WhatsApp' },
        { status: 500 }
      )
    }

    // Return QR code if available
    if (result.qrCode) {
      return NextResponse.json({
        success: true,
        qrCode: result.qrCode,
      })
    }

    // Already connected (session restored)
    const newStatus = whatsappClientManager.getStatus(school_id)
    return NextResponse.json({
      success: true,
      isConnected: newStatus.isConnected,
      phoneNumber: newStatus.phoneNumber,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error connecting WhatsApp:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
