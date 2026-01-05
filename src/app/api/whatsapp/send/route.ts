import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { whatsappClientManager } from '@/lib/whatsapp/client-manager'

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
    const supabase = createAdminClient()
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
    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = sendMessageSchema.parse(body)

    // Check live status from client manager (in-memory state is the source of truth)
    const liveStatus = whatsappClientManager.getStatus(validatedData.school_id)

    if (!liveStatus.isConnected) {
      // Check database to see if it THINKS we're connected (stale state after server restart)
      const { data: config } = await supabase
        .from('whatsapp_configs')
        .select('is_connected')
        .eq('school_id', validatedData.school_id)
        .single()

      if (config?.is_connected) {
        // Database shows connected but client isn't - server was restarted
        // Update database to reflect actual state
        await supabase
          .from('whatsapp_configs')
          .update({ is_connected: false })
          .eq('school_id', validatedData.school_id)

        return NextResponse.json(
          { error: 'WhatsApp session expired. Please reconnect by scanning the QR code again at /whatsapp/connect' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'WhatsApp is not connected. Please connect at /whatsapp/connect' },
        { status: 400 }
      )
    }

    // Handle different message types
    const results: Array<{ success: boolean; recipient: string; messageId?: string; error?: string }> = []

    if (validatedData.message_type === 'individual' && validatedData.recipient) {
      // Send to single recipient
      const result = await sendSingleMessage(
        validatedData.school_id,
        validatedData.recipient,
        validatedData.message,
        validatedData.media_url,
        validatedData.media_type
      )
      results.push({ ...result, recipient: validatedData.recipient })
    } else if (validatedData.message_type === 'group' && validatedData.group_id) {
      // Fetch group members and send to all
      const { data: members, error: membersError } = await supabase
        .from('whatsapp_group_members')
        .select('phone_number, name, student_id')
        .eq('group_id', validatedData.group_id)
        .eq('is_active', true)

      if (membersError) {
        console.error('Error fetching group members:', membersError)
        return NextResponse.json(
          { error: 'Failed to fetch group members' },
          { status: 500 }
        )
      }

      // If members have student_id but no phone, try to get phone from students table
      const membersWithPhones: string[] = []

      for (const member of members || []) {
        if (member.phone_number) {
          membersWithPhones.push(member.phone_number)
        } else if (member.student_id) {
          // Fetch student phone
          const { data: student } = await supabase
            .from('students')
            .select('phone')
            .eq('id', member.student_id)
            .single()

          if (student?.phone) {
            membersWithPhones.push(student.phone)
          }
        }
      }

      if (membersWithPhones.length === 0) {
        return NextResponse.json(
          { error: 'No group members have phone numbers' },
          { status: 400 }
        )
      }

      // Send to all members with phone numbers
      for (const phone of membersWithPhones) {
        const result = await sendSingleMessage(
          validatedData.school_id,
          phone,
          validatedData.message,
          validatedData.media_url,
          validatedData.media_type
        )
        results.push({ ...result, recipient: phone })

        // Add small delay between messages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } else if (validatedData.message_type === 'broadcast' && validatedData.recipients) {
      // Send to multiple recipients
      for (const recipient of validatedData.recipients) {
        const result = await sendSingleMessage(
          validatedData.school_id,
          recipient,
          validatedData.message,
          validatedData.media_url,
          validatedData.media_type
        )
        results.push({ ...result, recipient })

        // Add small delay between messages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Determine recipient_phone based on message type
    // Note: recipient_phone VARCHAR(20) in DB, so we truncate or summarize for groups
    let recipientPhone: string | null = validatedData.recipient || null
    if (validatedData.message_type === 'group' && results.length > 0) {
      // For group messages, just store the count (DB column is VARCHAR(20))
      recipientPhone = `${results.length} recipients`
    } else if (validatedData.message_type === 'broadcast' && validatedData.recipients) {
      recipientPhone = `${validatedData.recipients.length} recipients`
    }

    // Create message log entry
    const messageLog = {
      school_id: validatedData.school_id,
      message_type: validatedData.message_type,
      recipient_phone: recipientPhone,
      group_id: validatedData.group_id || null,
      template_id: validatedData.template_id || null,
      content: validatedData.message,
      sent_by: validatedData.sent_by,
      status: results.some((r) => r.success) ? 'sent' : 'failed',
      sent_at: results.some((r) => r.success) ? new Date().toISOString() : null,
      error_message: results.find((r) => !r.success)?.error || null,
    }

    console.log('[WhatsApp Send] Creating message log:', messageLog)

    const { data: logEntry, error: logError } = await supabase
      .from('whatsapp_messages')
      .insert(messageLog)
      .select()
      .single()

    if (logError) {
      console.error('[WhatsApp Send] Error creating message log:', logError)
    } else {
      console.log('[WhatsApp Send] Message log created:', logEntry)
    }

    // Determine overall success
    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      data: logEntry,
      results: {
        total: results.length,
        successful: successCount,
        failed: failCount,
        details: results,
      },
      message: successCount > 0 ? 'Message(s) sent successfully' : 'Failed to send message(s)',
    }, { status: successCount > 0 ? 201 : 500 })
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

async function sendSingleMessage(
  schoolId: string,
  recipient: string,
  message: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'document' | 'video'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (mediaUrl) {
      return await whatsappClientManager.sendMediaMessage(
        schoolId,
        recipient,
        mediaUrl,
        message,
        mediaType
      )
    } else {
      return await whatsappClientManager.sendMessage(schoolId, recipient, message)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}
