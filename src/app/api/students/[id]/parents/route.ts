import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// POST - Link a parent to a student
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params
    const supabase = createAdminClient()
    const body = await request.json()

    const schema = z.object({
      parent_id: z.string().uuid().optional(),
      // For creating new parent
      first_name: z.string().min(1).optional(),
      last_name: z.string().optional(),
      relation: z.enum(['father', 'mother', 'guardian']),
      phone: z.string().min(10).optional(),
      email: z.string().email().optional().or(z.literal('')),
      is_primary: z.boolean().optional().default(false),
    })

    const data = schema.parse(body)

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, school_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    let parentId = data.parent_id

    // If no parent_id provided, check if parent with same email exists, otherwise create new
    if (!parentId && data.first_name) {
      // First check if a parent with the same email already exists
      if (data.email) {
        const { data: existingParent } = await supabase
          .from('parents')
          .select('id')
          .eq('school_id', student.school_id)
          .ilike('email', data.email)
          .limit(1)
          .single()

        if (existingParent) {
          parentId = existingParent.id
        }
      }

      // If still no parent found, create new one
      if (!parentId) {
        const { data: newParent, error: createError } = await supabase
          .from('parents')
          .insert({
            school_id: student.school_id,
            first_name: data.first_name,
            last_name: data.last_name || '',
            relation: data.relation,
            phone: data.phone || '',
            email: data.email || null,
            is_primary_contact: data.is_primary,
          })
          .select('id')
          .single()

        if (createError) {
          return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        parentId = newParent.id
      }
    }

    if (!parentId) {
      return NextResponse.json(
        { error: 'Either parent_id or parent details required' },
        { status: 400 }
      )
    }

    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('student_parents')
      .select('id')
      .eq('student_id', studentId)
      .eq('parent_id', parentId)
      .single()

    if (existingLink) {
      return NextResponse.json(
        { error: 'Parent already linked to this student' },
        { status: 409 }
      )
    }

    // Create the link
    const { data: link, error: linkError } = await supabase
      .from('student_parents')
      .insert({
        student_id: studentId,
        parent_id: parentId,
        is_primary: data.is_primary,
      })
      .select(`
        *,
        parents (id, first_name, last_name, relation, phone, email)
      `)
      .single()

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }

    return NextResponse.json({ data: link }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error linking parent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Unlink a parent from a student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parent_id')

    if (!parentId) {
      return NextResponse.json(
        { error: 'parent_id query parameter required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('student_parents')
      .delete()
      .eq('student_id', studentId)
      .eq('parent_id', parentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Parent unlinked successfully' })
  } catch (error) {
    console.error('Error unlinking parent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
