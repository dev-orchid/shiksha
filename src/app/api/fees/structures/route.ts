import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List fee structures
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')
    const academicYearId = searchParams.get('academic_year_id')

    let query = supabase
      .from('fee_structures')
      .select(`
        *,
        classes (id, name, grade_level),
        fee_categories (id, name)
      `)
      .order('created_at', { ascending: false })

    if (classId) {
      query = query.eq('class_id', classId)
    }

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching fee structures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create fee structure
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    if (!body.class_id || !body.fee_category_id || !body.amount) {
      return NextResponse.json(
        { error: 'class_id, fee_category_id, and amount are required' },
        { status: 400 }
      )
    }

    // Get school_id and academic_year_id if not provided
    let schoolId = body.school_id
    let academicYearId = body.academic_year_id

    if (!schoolId || !academicYearId) {
      const { data: schools } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .single()
      schoolId = schoolId || schools?.id

      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .limit(1)
        .single()
      academicYearId = academicYearId || academicYear?.id
    }

    const structureData = {
      school_id: schoolId,
      academic_year_id: academicYearId,
      class_id: body.class_id,
      fee_category_id: body.fee_category_id,
      amount: body.amount,
      frequency: body.frequency || 'monthly',
      due_day: body.due_day || 10,
      late_fee_per_day: body.late_fee || 0,
      max_late_fee: body.max_late_fee || 0,
      is_active: body.is_active ?? true,
    }

    const { data, error } = await supabase
      .from('fee_structures')
      .insert(structureData)
      .select(`
        *,
        classes (id, name),
        fee_categories (id, name)
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This fee structure already exists for the class' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error creating fee structure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
