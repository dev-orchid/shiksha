import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { z } from 'zod'

const gradeSettingSchema = z.object({
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
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get('academic_year_id')

    let query = supabase
      .from('grade_settings')
      .select('*')
      .eq('school_id', authUser.schoolId)
      .order('min_percentage', { ascending: false })

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
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = bulkGradeSettingsSchema.parse(body)

    // Use authenticated user's school_id
    const schoolId = authUser.schoolId

    // Get academic_year_id if not provided
    let academicYearId = validatedData.grades[0]?.academic_year_id
    if (!academicYearId) {
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', authUser.schoolId)
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
