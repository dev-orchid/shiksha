import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { z } from 'zod'

const templateSchema = z.object({
  school_id: z.string().uuid(),
  name: z.string().min(1),
  category: z.enum(['fee_reminder', 'attendance', 'exam', 'general', 'event', 'circular']),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
})

// GET - List templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { searchParams } = new URL(request.url)

    const schoolId = searchParams.get('school_id')
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')

    let query = supabase
      .from('whatsapp_templates')
      .select('*')

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query.order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const body = await request.json()

    const validatedData = templateSchema.parse(body)

    // Extract variables from content (e.g., {{variable_name}})
    const variableRegex = /\{\{(\w+)\}\}/g
    const extractedVars: string[] = []
    let match
    while ((match = variableRegex.exec(validatedData.content)) !== null) {
      if (!extractedVars.includes(match[1])) {
        extractedVars.push(match[1])
      }
    }

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .insert({
        ...validatedData,
        variables: extractedVars,
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
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
