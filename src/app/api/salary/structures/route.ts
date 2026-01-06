import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { z } from 'zod'

const structureSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  employee_type: z.enum(['teaching', 'non_teaching', 'administrative', 'support']).optional().nullable(),
  is_active: z.boolean().default(true),
  components: z.array(z.object({
    component_id: z.string().uuid(),
    amount: z.number().optional(),
    percentage: z.number().optional(),
  })).optional(),
})

// GET - Get all salary structures
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const employeeType = searchParams.get('employee_type')
    const activeOnly = searchParams.get('active_only') !== 'false'

    let query = supabase
      .from('salary_structures')
      .select(`
        *,
        salary_structure_details (
          id,
          amount,
          percentage,
          salary_components (
            id,
            name,
            component_type,
            is_percentage,
            is_taxable
          )
        )
      `)
      .eq('school_id', authUser.schoolId)
      .order('name')

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    if (employeeType) {
      query = query.eq('employee_type', employeeType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching salary structures:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response
    const structures = data?.map(structure => ({
      ...structure,
      components: structure.salary_structure_details?.map((detail: any) => ({
        id: detail.id,
        componentId: detail.salary_components?.id,
        name: detail.salary_components?.name,
        type: detail.salary_components?.component_type,
        isPercentage: detail.salary_components?.is_percentage,
        isTaxable: detail.salary_components?.is_taxable,
        amount: detail.amount,
        percentage: detail.percentage,
      })) || [],
    }))

    return NextResponse.json({ data: structures })
  } catch (error) {
    console.error('Error fetching salary structures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new salary structure
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = structureSchema.parse(body)
    const { components, ...structureData } = validatedData

    // Create the structure with authenticated user's school_id
    const { data: structure, error: structureError } = await supabase
      .from('salary_structures')
      .insert({ ...structureData, school_id: authUser.schoolId })
      .select()
      .single()

    if (structureError) {
      if (structureError.code === '23505') {
        return NextResponse.json({ error: 'A structure with this name already exists' }, { status: 400 })
      }
      return NextResponse.json({ error: structureError.message }, { status: 500 })
    }

    // Create structure details if components provided
    if (components && components.length > 0) {
      const details = components.map(comp => ({
        salary_structure_id: structure.id,
        salary_component_id: comp.component_id,
        amount: comp.amount,
        percentage: comp.percentage,
      }))

      const { error: detailsError } = await supabase
        .from('salary_structure_details')
        .insert(details)

      if (detailsError) {
        // Rollback structure creation
        await supabase.from('salary_structures').delete().eq('id', structure.id)
        return NextResponse.json({ error: detailsError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ data: structure }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating salary structure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a salary structure
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    const { id, components, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Structure ID is required' }, { status: 400 })
    }

    // Update the structure - ensure it belongs to user's school
    const { data: structure, error: structureError } = await supabase
      .from('salary_structures')
      .update(updateData)
      .eq('id', id)
      .eq('school_id', authUser.schoolId)
      .select()
      .single()

    if (structureError) {
      return NextResponse.json({ error: structureError.message }, { status: 500 })
    }

    // Update components if provided
    if (components) {
      // Delete existing details
      await supabase
        .from('salary_structure_details')
        .delete()
        .eq('salary_structure_id', id)

      // Insert new details
      if (components.length > 0) {
        const details = components.map((comp: any) => ({
          salary_structure_id: id,
          salary_component_id: comp.component_id,
          amount: comp.amount,
          percentage: comp.percentage,
        }))

        const { error: detailsError } = await supabase
          .from('salary_structure_details')
          .insert(details)

        if (detailsError) {
          return NextResponse.json({ error: detailsError.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ data: structure })
  } catch (error) {
    console.error('Error updating salary structure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a salary structure
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
      return NextResponse.json({ error: 'Structure ID is required' }, { status: 400 })
    }

    // Soft delete by setting is_active to false - ensure it belongs to user's school
    const { error } = await supabase
      .from('salary_structures')
      .update({ is_active: false })
      .eq('id', id)
      .eq('school_id', authUser.schoolId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Structure deleted successfully' })
  } catch (error) {
    console.error('Error deleting salary structure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
