import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - Get message logs with filtering and export
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const messageType = searchParams.get('type') || searchParams.get('message_type')
    const status = searchParams.get('status')
    const schoolId = searchParams.get('school_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const exportFormat = searchParams.get('export')

    // If no school_id, try to get the first school
    let targetSchoolId = schoolId
    if (!targetSchoolId) {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .single()
      targetSchoolId = school?.id
    }

    const offset = (page - 1) * limit

    let query = supabase
      .from('whatsapp_messages')
      .select(`
        id,
        school_id,
        message_type,
        recipient_phone,
        content,
        status,
        error_message,
        sent_at,
        delivered_at,
        read_at,
        created_at,
        whatsapp_templates (id, name, category),
        whatsapp_groups (id, name),
        users:sent_by (id, email)
      `, { count: 'exact' })

    if (targetSchoolId) {
      query = query.eq('school_id', targetSchoolId)
    }

    if (messageType) {
      query = query.eq('message_type', messageType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // For export, get all records (no pagination)
    if (exportFormat === 'csv') {
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Generate CSV
      const csv = generateCSV(data || [])
      const filename = `whatsapp_logs_${new Date().toISOString().split('T')[0]}.csv`

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // Regular paginated response
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data for frontend
    const transformedData = (data || []).map((log) => ({
      id: log.id,
      recipient_phone: log.recipient_phone,
      recipient_name: null, // Can be enhanced with student/parent lookup
      message_type: log.message_type,
      content: log.content,
      status: log.status,
      error_message: log.error_message,
      sent_at: log.sent_at,
      delivered_at: log.delivered_at,
      read_at: log.read_at,
      created_at: log.created_at,
      template: log.whatsapp_templates,
      group: log.whatsapp_groups,
      sent_by: log.users,
    }))

    return NextResponse.json({
      data: transformedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching message logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface MessageLogRecord {
  id: string
  message_type: string
  recipient_phone: string | null
  content: string
  status: string
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  created_at: string
  whatsapp_templates: { name: string; category: string }[] | { name: string; category: string } | null
  whatsapp_groups: { name: string }[] | { name: string } | null
}

function generateCSV(data: MessageLogRecord[]): string {
  const headers = [
    'ID',
    'Type',
    'Recipient',
    'Content',
    'Status',
    'Error',
    'Template',
    'Group',
    'Sent At',
    'Delivered At',
    'Read At',
    'Created At',
  ]

  const getTemplateName = (templates: MessageLogRecord['whatsapp_templates']) => {
    if (!templates) return ''
    if (Array.isArray(templates)) return templates[0]?.name || ''
    return templates.name || ''
  }

  const getGroupName = (groups: MessageLogRecord['whatsapp_groups']) => {
    if (!groups) return ''
    if (Array.isArray(groups)) return groups[0]?.name || ''
    return groups.name || ''
  }

  const rows = data.map((log) => [
    log.id,
    log.message_type,
    log.recipient_phone || '',
    `"${(log.content || '').replace(/"/g, '""')}"`, // Escape quotes in content
    log.status,
    log.error_message || '',
    getTemplateName(log.whatsapp_templates),
    getGroupName(log.whatsapp_groups),
    log.sent_at || '',
    log.delivered_at || '',
    log.read_at || '',
    log.created_at,
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}
