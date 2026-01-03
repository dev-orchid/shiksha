import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const gradeSettingSchema = z.object({
  school_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
  grade: z.string().min(1),
  min_percentage: z.number().min(0).max(100),
  max_percentage: z.number().min(0).max(100),
  grade_point: z.number().optional(),
  remarks: z.string().optional(),
})

const bulkGradeSettingsSchema = z.object({
  grades: z.array(gradeSettingSchema),
})

// GET - List grade settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    const academicYearId = searchParams.get('academic_year_id')

    let query = supabase
      .from('grade_settings')
      .select('*')
      .order('min_percentage', { ascending: false })

    if (schoolId) {
      query = query.eq('school_id', schoolId)
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
    console.error('Error fetching grade settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create/Update grade settings (bulk)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = bulkGradeSettingsSchema.parse(body)

    // Get school_id if not provided
    let schoolId = validatedData.grades[0]?.school_id
    if (!schoolId) {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .single()
      schoolId = school?.id
    }

    // Get academic_year_id if not provided
    let academicYearId = validatedData.grades[0]?.academic_year_id
    if (!academicYearId) {
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .limit(1)
        .single()
      academicYearId = academicYear?.id
    }

    // Delete existing grade settings for this school/academic year
    await supabase
      .from('grade_settings')
      .delete()
      .eq('school_id', schoolId)
      .eq('academic_year_id', academicYearId)

    // Insert new grade settings
    const records = validatedData.grades.map(grade => ({
      school_id: schoolId,
      academic_year_id: academicYearId,
      grade: grade.grade,
      min_percentage: grade.min_percentage,
      max_percentage: grade.max_percentage,
      grade_point: grade.grade_point,
      remarks: grade.remarks,
    }))

    const { data, error } = await supabase
      .from('grade_settings')
      .insert(records)
      .select()

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
    console.error('Error saving grade settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
