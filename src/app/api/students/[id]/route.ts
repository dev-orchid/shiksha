import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const updateStudentSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional().nullable(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  current_class_id: z.string().uuid().optional().nullable(),
  current_section_id: z.string().uuid().optional().nullable(),
  roll_number: z.string().optional().nullable(),
  blood_group: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  previous_school: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'transferred', 'graduated']).optional(),
  photo_url: z.string().url().optional().nullable(),
})

// GET - Get single student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        current_class:classes!current_class_id (id, name, grade_level),
        current_section:sections!current_section_id (id, name),
        school:schools!school_id (id, name),
        student_parents (
          is_primary,
          can_pickup,
          parents (
            id,
            first_name,
            last_name,
            relation,
            phone,
            email,
            occupation
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = updateStudentSchema.parse(body)

    const { data, error } = await supabase
      .from('students')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
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
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete student (soft delete by changing status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Soft delete - set status to inactive
    const { data, error } = await supabase
      .from('students')
      .update({ status: 'inactive' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Student deleted successfully', data })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
