import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const staffSchema = z.object({
  school_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional().nullable(),
  employee_id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  designation: z.string().min(1),
  qualification: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  experience_years: z.number().int().min(0).optional().nullable(),
  joining_date: z.string(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  blood_group: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  bank_account_number: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  ifsc_code: z.string().optional().nullable(),
  pan_number: z.string().optional().nullable(),
  aadhar_number: z.string().optional().nullable(),
  staff_type: z.enum(['teaching', 'non-teaching', 'admin']).default('teaching'),
  employment_type: z.enum(['permanent', 'contract', 'temporary']).optional().nullable(),
})

// GET - List staff with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const departmentId = searchParams.get('department_id')
    const staffType = searchParams.get('staff_type')
    const status = searchParams.get('status')
    const schoolId = searchParams.get('school_id')

    const offset = (page - 1) * limit

    let query = supabase
      .from('staff')
      .select(`
        *,
        department:departments!department_id (id, name)
      `, { count: 'exact' })

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    if (departmentId) {
      query = query.eq('department_id', departmentId)
    }

    if (staffType) {
      query = query.eq('employee_type', staffType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,employee_id.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // Get school_id if not provided
    let schoolId = body.school_id
    if (!schoolId) {
      const { data: schools } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .single()
      schoolId = schools?.id
    }

    // Validate required fields
    if (!body.employee_id || !body.first_name || !body.designation || !body.joining_date || !body.phone) {
      return NextResponse.json(
        { error: 'Missing required fields: employee_id, first_name, designation, joining_date, and phone are required' },
        { status: 400 }
      )
    }

    // Map form fields to database fields
    const staffData = {
      school_id: schoolId,
      employee_id: body.employee_id,
      first_name: body.first_name,
      last_name: body.last_name || null,
      date_of_birth: body.date_of_birth || null,
      gender: body.gender || null,
      department_id: body.department_id || null,
      designation: body.designation,
      highest_qualification: body.highest_qualification || null,
      specialization: body.specialization || null,
      experience_years: body.experience_years || 0,
      joining_date: body.joining_date,
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      pincode: body.pincode || null,
      blood_group: body.blood_group || null,
      emergency_contact_name: body.emergency_contact_name || null,
      emergency_contact_phone: body.emergency_contact_phone || null,
      bank_account_number: body.bank_account_number || null,
      bank_name: body.bank_name || null,
      ifsc_code: body.ifsc_code || null,
      employee_type: body.employee_type || 'teaching',
      employment_type: body.employment_type || 'permanent',
      status: 'active',
    }

    const { data, error } = await supabase
      .from('staff')
      .insert(staffData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A staff member with this employee ID already exists' },
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
    console.error('Error creating staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
