import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { z } from 'zod'

const eventSchema = z.object({
  event_type_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  is_all_day: z.boolean().optional(),
})

// GET - List events
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const eventTypeId = searchParams.get('event_type_id')
    const upcoming = searchParams.get('upcoming')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('events')
      .select(`
        *,
        event_types (id, name, color)
      `)
      .eq('school_id', authUser.schoolId)
      .eq('is_active', true)
      .order('start_date', { ascending: true })

    // Filter by month and year for calendar view
    if (month && year) {
      const startOfMonth = `${year}-${month.padStart(2, '0')}-01`
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0)
        .toISOString()
        .split('T')[0]

      query = query
        .gte('start_date', startOfMonth)
        .lte('start_date', endOfMonth)
    }

    // Filter for upcoming events (dashboard)
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0]
      query = query.gte('start_date', today).limit(limit)
    }

    // Filter by event type
    if (eventTypeId) {
      query = query.eq('event_type_id', eventTypeId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create event
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = eventSchema.parse(body)

    // If event_type_id is provided, verify it belongs to the school
    if (validatedData.event_type_id) {
      const { data: eventType } = await supabase
        .from('event_types')
        .select('id')
        .eq('id', validatedData.event_type_id)
        .eq('school_id', authUser.schoolId)
        .single()

      if (!eventType) {
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        school_id: authUser.schoolId,
        event_type_id: validatedData.event_type_id || null,
        title: validatedData.title,
        description: validatedData.description || null,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date || validatedData.start_date,
        start_time: validatedData.start_time || null,
        end_time: validatedData.end_time || null,
        location: validatedData.location || null,
        is_all_day: validatedData.is_all_day ?? true,
        created_by: authUser.userId,
        is_active: true,
      })
      .select(`
        *,
        event_types (id, name, color)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
