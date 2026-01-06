import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { z } from 'zod'

const componentSchema = z.object({
  name: z.string().min(1).max(100),
  component_type: z.enum(['earning', 'deduction']),
  is_percentage: z.boolean().default(false),
  percentage_of: z.string().max(50).optional(),
  default_value: z.number().min(0).optional(),
  is_taxable: z.boolean().default(true),
  is_active: z.boolean().default(true),
})

// GET - Get all salary components
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') // 'earning' or 'deduction'
    const activeOnly = searchParams.get('active_only') !== 'false'

    let query = supabase
      .from('salary_components')
      .select('*')
      .eq('school_id', authUser.schoolId)
      .order('name')

    if (type) {
      query = query.eq('component_type', type)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching salary components:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching salary components:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new salary component
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = componentSchema.parse(body)

    const { data, error } = await supabase
      .from('salary_components')
      .insert({ ...validatedData, school_id: authUser.schoolId })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A component with this name already exists' }, { status: 400 })
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
    console.error('Error creating salary component:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a salary component
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Component ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('salary_components')
      .update(updateData)
      .eq('id', id)
      .eq('school_id', authUser.schoolId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating salary component:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a salary component
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Component ID is required' }, { status: 400 })
    }

    // Soft delete by setting is_active to false - ensure it belongs to user's school
    const { error } = await supabase
      .from('salary_components')
      .update({ is_active: false })
      .eq('id', id)
      .eq('school_id', authUser.schoolId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Component deleted successfully' })
  } catch (error) {
    console.error('Error deleting salary component:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
