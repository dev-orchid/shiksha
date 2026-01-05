import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['fee_reminder', 'attendance', 'exam', 'result', 'general', 'announcement']).optional(),
  content: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
})

// GET - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateTemplateSchema.parse(body)

    const supabase = createAdminClient()

    // If content is updated, extract variables
    let variables: string[] | undefined
    if (validatedData.content) {
      const variableRegex = /\{\{(\w+)\}\}/g
      const extractedVars: string[] = []
      let match
      while ((match = variableRegex.exec(validatedData.content)) !== null) {
        if (!extractedVars.includes(match[1])) {
          extractedVars.push(match[1])
        }
      }
      variables = extractedVars
    }

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .update({
        ...validatedData,
        ...(variables && { variables }),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Template name already exists' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('whatsapp_templates')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
