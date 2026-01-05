import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { whatsappClientManager } from '@/lib/whatsapp/client-manager'

const disconnectSchema = z.object({
  school_id: z.string().uuid().optional(),
})

// POST - Disconnect WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = disconnectSchema.parse(body)

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
          { error: 'No school found' },
          { status: 404 }
        )
      }
      schoolId = school.id
    }

    // At this point schoolId is guaranteed to be a string
    const school_id = schoolId as string

    // Disconnect the client
    await whatsappClientManager.disconnectClient(school_id)

    // Update database
    const { error } = await supabase
      .from('whatsapp_configs')
      .update({
        is_connected: false,
        session_data: null,
        qr_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq('school_id', school_id)

    if (error) {
      console.error('Error updating config:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp disconnected successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error disconnecting WhatsApp:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
