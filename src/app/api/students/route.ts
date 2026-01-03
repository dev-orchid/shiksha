import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const studentSchema = z.object({
  // Required fields
  school_id: z.string().uuid(),
  admission_number: z.string().min(1),
  first_name: z.string().min(1),
  date_of_birth: z.string(),
  admission_date: z.string(),
  // Optional fields
  last_name: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  current_class_id: z.string().uuid().optional(),
  current_section_id: z.string().uuid().optional(),
  roll_number: z.string().optional(),
  blood_group: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  previous_school: z.string().optional(),
  photo_url: z.string().url().optional(),
})

// GET - List students with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const classId = searchParams.get('class_id')
    const sectionId = searchParams.get('section_id')
    const status = searchParams.get('status')
    const schoolId = searchParams.get('school_id')

    const offset = (page - 1) * limit

    let query = supabase
      .from('students')
      .select(`
        *,
        current_class:classes!current_class_id (id, name),
        current_section:sections!current_section_id (id, name),
        school:schools!school_id (id, name)
      `, { count: 'exact' })

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    if (classId) {
      query = query.eq('current_class_id', classId)
    }

    if (sectionId) {
      query = query.eq('current_section_id', sectionId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_number.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch fee status for students
    let studentsWithFees = data || []
    if (data && data.length > 0) {
      const studentIds = data.map(s => s.id)

      // Get all invoices for these students
      const { data: invoices } = await supabase
        .from('fee_invoices')
        .select('student_id, balance_amount, status')
        .in('student_id', studentIds)
        .neq('status', 'paid')

      // Calculate fee status for each student
      const feeMap: Record<string, { pendingAmount: number; hasOverdue: boolean }> = {}

      if (invoices) {
        for (const inv of invoices) {
          if (!feeMap[inv.student_id]) {
            feeMap[inv.student_id] = { pendingAmount: 0, hasOverdue: false }
          }
          feeMap[inv.student_id].pendingAmount += inv.balance_amount || 0
          if (inv.status === 'overdue') {
            feeMap[inv.student_id].hasOverdue = true
          }
        }
      }

      // Add fee status to students
      studentsWithFees = data.map(student => ({
        ...student,
        fee_status: feeMap[student.id]
          ? (feeMap[student.id].hasOverdue ? 'overdue' : feeMap[student.id].pendingAmount > 0 ? 'pending' : 'clear')
          : 'clear',
        pending_fee_amount: feeMap[student.id]?.pendingAmount || 0,
      }))
    }

    return NextResponse.json({
      data: studentsWithFees,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new student
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = studentSchema.parse(body)

    const { data, error } = await supabase
      .from('students')
      .insert(validatedData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A student with this admission number already exists' },
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
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
