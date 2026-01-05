import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { z } from 'zod'

const groupSchema = z.object({
  school_id: z.string().uuid(),
  name: z.string().min(1),
  group_type: z.enum(['class', 'teachers', 'parents', 'custom']),
  description: z.string().optional(),
  class_id: z.string().uuid().optional(),
  section_id: z.string().uuid().optional(),
})

// GET - List groups
export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { searchParams } = new URL(request.url)

    const schoolId = searchParams.get('school_id')
    const groupType = searchParams.get('group_type')

    let query = supabase
      .from('whatsapp_groups')
      .select(`
        *,
        classes (id, name),
        sections (id, name)
      `)

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    if (groupType) {
      query = query.eq('group_type', groupType)
    }

    const { data, error } = await query.order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create group
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const body = await request.json()

    const validatedData = groupSchema.parse(body)

    // Generate a unique group_id (this is for internal tracking, not actual WhatsApp group)
    const group_id = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const { data, error } = await supabase
      .from('whatsapp_groups')
      .insert({
        ...validatedData,
        group_id,
      })
      .select()
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
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
