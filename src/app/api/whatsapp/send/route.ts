import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { z } from 'zod'

const sendMessageSchema = z.object({
  school_id: z.string().uuid(),
  message_type: z.enum(['individual', 'group', 'broadcast']),
  recipient: z.string().optional(), // Phone number for individual
  group_id: z.string().uuid().optional(), // For group messages
  recipients: z.array(z.string()).optional(), // For broadcast
  template_id: z.string().uuid().optional(),
  message: z.string().min(1),
  media_url: z.string().optional(),
  media_type: z.enum(['image', 'document', 'video']).optional(),
  sent_by: z.string().uuid(),
})

// GET - Get message logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const messageType = searchParams.get('message_type')
    const status = searchParams.get('status')
    const schoolId = searchParams.get('school_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    const offset = (page - 1) * limit

    let query = supabase
      .from('whatsapp_messages')
      .select(`
        *,
        whatsapp_templates (id, name, category),
        whatsapp_groups (id, name)
      `, { count: 'exact' })

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    if (messageType) {
      query = query.eq('message_type', messageType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Send message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const body = await request.json()

    const validatedData = sendMessageSchema.parse(body)

    // Check if WhatsApp is connected for this school
    const { data: config, error: configError } = await supabase
      .from('whatsapp_configs')
      .select('*')
      .eq('school_id', validatedData.school_id)
      .eq('status', 'connected')
      .single()

    if (configError || !config) {
      return NextResponse.json(
        { error: 'WhatsApp is not connected for this school' },
        { status: 400 }
      )
    }

    // Create message log entry
    const messageLog = {
      school_id: validatedData.school_id,
      message_type: validatedData.message_type,
      recipient: validatedData.recipient,
      group_id: validatedData.group_id,
      template_id: validatedData.template_id,
      message: validatedData.message,
      media_url: validatedData.media_url,
      media_type: validatedData.media_type,
      sent_by: validatedData.sent_by,
      status: 'pending',
    }

    const { data: logEntry, error: logError } = await supabase
      .from('whatsapp_messages')
      .insert(messageLog)
      .select()
      .single()

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 })
    }

    // TODO: Integrate with actual WhatsApp Web.js client
    // For now, we'll simulate sending
    // In production, this would be handled by a background job/worker

    // Simulate message sent
    const { error: updateError } = await supabase
      .from('whatsapp_messages')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', logEntry.id)

    if (updateError) {
      console.error('Error updating message status:', updateError)
    }

    return NextResponse.json({
      data: {
        ...logEntry,
        status: 'sent',
      },
      message: 'Message sent successfully',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
