import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const examTypeSchema = z.object({
  school_id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  weightage: z.number().optional(),
  is_active: z.boolean().optional(),
})

// GET - List exam types
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')

    let query = supabase
      .from('exam_types')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching exam types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create exam type
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = examTypeSchema.parse(body)

    // Get school_id if not provided
    let schoolId = validatedData.school_id
    if (!schoolId) {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .single()
      schoolId = school?.id
    }

    const { data, error } = await supabase
      .from('exam_types')
      .insert({
        ...validatedData,
        school_id: schoolId,
        is_active: validatedData.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An exam type with this name already exists' },
          { status: 400 }
        )
      }
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
    console.error('Error creating exam type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
