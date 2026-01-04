import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { z } from 'zod'

const assignmentSchema = z.object({
  staff_id: z.string().uuid(),
  salary_structure_id: z.string().uuid().optional().nullable(),
  basic_salary: z.number().min(0),
  effective_from: z.string().optional(),
})

// GET - Get staff salary assignments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { searchParams } = new URL(request.url)

    const schoolId = searchParams.get('school_id')
    const staffId = searchParams.get('staff_id')
    const currentOnly = searchParams.get('current_only') !== 'false'

    if (!schoolId && !staffId) {
      return NextResponse.json({ error: 'school_id or staff_id is required' }, { status: 400 })
    }

    // Use different query depending on whether we need school filtering
    if (staffId) {
      // Simple query when filtering by staff_id
      let query = supabase
        .from('staff_salary_assignments')
        .select(`
          *,
          salary_structures (
            id,
            name,
            description
          )
        `)
        .eq('staff_id', staffId)
        .order('effective_from', { ascending: false })

      if (currentOnly) {
        query = query.eq('is_current', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching salary assignments:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }

    // Query with staff join when filtering by school_id
    let query = supabase
      .from('staff_salary_assignments')
      .select(`
        *,
        staff!inner (
          id,
          employee_id,
          first_name,
          last_name,
          designation,
          department_id,
          school_id,
          departments (id, name)
        ),
        salary_structures (
          id,
          name,
          description
        )
      `)
      .eq('staff.school_id', schoolId)
      .order('effective_from', { ascending: false })

    if (currentOnly) {
      query = query.eq('is_current', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching salary assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching salary assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update staff salary assignment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const body = await request.json()

    // Handle empty string salary_structure_id as null
    if (body.salary_structure_id === '') {
      body.salary_structure_id = null
    }

    const validatedData = assignmentSchema.parse(body)

    // Deactivate current assignment if exists
    const { error: updateError } = await supabase
      .from('staff_salary_assignments')
      .update({
        is_current: false,
        effective_to: validatedData.effective_from || new Date().toISOString().split('T')[0]
      })
      .eq('staff_id', validatedData.staff_id)
      .eq('is_current', true)

    if (updateError) {
      console.error('Error deactivating old assignment:', updateError)
      // Continue anyway - might not have existing assignment
    }

    // Create new assignment
    const { data, error } = await supabase
      .from('staff_salary_assignments')
      .insert({
        staff_id: validatedData.staff_id,
        salary_structure_id: validatedData.salary_structure_id || null,
        basic_salary: validatedData.basic_salary,
        effective_from: validatedData.effective_from || new Date().toISOString().split('T')[0],
        is_current: true,
      })
      .select(`
        *,
        salary_structures (id, name)
      `)
      .single()

    if (error) {
      console.error('Error creating salary assignment:', error)
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
    console.error('Error creating salary assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update salary assignment
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const body = await request.json()

    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('staff_salary_assignments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating salary assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
