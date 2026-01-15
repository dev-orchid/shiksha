import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { z } from 'zod'

// Parent schema for creating parent accounts
const parentSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  relation: z.enum(['father', 'mother', 'guardian']),
  create_account: z.boolean().optional().default(false),
}).optional()

const studentSchema = z.object({
  // Required fields (school_id is now provided by authentication)
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
  // Parent info
  father: parentSchema,
  mother: parentSchema,
})

// Helper to generate a random password
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Helper to create parent account
async function createParentAccount(
  supabase: ReturnType<typeof createAdminClient>,
  parentData: z.infer<typeof parentSchema>,
  schoolId: string,
  studentId: string
): Promise<{ success: boolean; email?: string; password?: string; error?: string }> {
  if (!parentData || !parentData.email || !parentData.create_account) {
    // Just create parent record without login account
    if (parentData && parentData.name) {
      const nameParts = parentData.name.split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || ''

      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .insert({
          school_id: schoolId,
          first_name: firstName,
          last_name: lastName,
          relation: parentData.relation,
          phone: parentData.phone,
          email: parentData.email || null,
          is_primary_contact: parentData.relation === 'father',
        })
        .select('id')
        .single()

      if (parentError) {
        console.error('Error creating parent record:', parentError)
        return { success: false, error: parentError.message }
      }

      // Link parent to student
      await supabase.from('student_parents').insert({
        student_id: studentId,
        parent_id: parent.id,
        is_primary: parentData.relation === 'father',
      })
    }
    return { success: true }
  }

  const password = generatePassword()
  const nameParts = parentData.name.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || ''

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: parentData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: parentData.name,
        school_id: schoolId,
        role: 'parent',
      },
    })

    if (authError) {
      // If user already exists, try to find them
      if (authError.message.includes('already registered')) {
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id')
          .eq('email', parentData.email)
          .single()

        if (existingUsers) {
          // Link existing parent to this student
          const { data: existingParent } = await supabase
            .from('parents')
            .select('id')
            .eq('user_id', existingUsers.id)
            .single()

          if (existingParent) {
            await supabase.from('student_parents').insert({
              student_id: studentId,
              parent_id: existingParent.id,
              is_primary: parentData.relation === 'father',
            })
            return { success: true, email: parentData.email }
          }
        }
        return { success: false, error: 'Parent email already registered' }
      }
      return { success: false, error: authError.message }
    }

    // Create user record
    await supabase.from('users').insert({
      id: authData.user.id,
      school_id: schoolId,
      email: parentData.email,
      role: 'parent',
      is_active: true,
    })

    // Create parent record
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .insert({
        school_id: schoolId,
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        relation: parentData.relation,
        phone: parentData.phone,
        email: parentData.email,
        is_primary_contact: parentData.relation === 'father',
      })
      .select('id')
      .single()

    if (parentError) {
      console.error('Error creating parent record:', parentError)
      return { success: false, error: parentError.message }
    }

    // Link parent to student
    await supabase.from('student_parents').insert({
      student_id: studentId,
      parent_id: parent.id,
      is_primary: parentData.relation === 'father',
    })

    return { success: true, email: parentData.email, password }
  } catch (error) {
    console.error('Error creating parent account:', error)
    return { success: false, error: 'Failed to create parent account' }
  }
}

// GET - List students with pagination and filters for the authenticated user's school
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const classId = searchParams.get('class_id')
    const sectionId = searchParams.get('section_id')
    const status = searchParams.get('status')

    const offset = (page - 1) * limit

    let query = supabase
      .from('students')
      .select(`
        *,
        current_class:classes!current_class_id (id, name),
        current_section:sections!current_section_id (id, name),
        school:schools!school_id (id, name)
      `, { count: 'exact' })
      .eq('school_id', authUser.schoolId) // Always filter by authenticated user's school

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

// POST - Create new student for the authenticated user's school
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    const validatedData = studentSchema.parse(body)

    // Extract parent data before creating student
    const { father, mother, ...studentFields } = validatedData

    // Add school_id from authenticated user
    const studentData = {
      ...studentFields,
      school_id: authUser.schoolId, // Always use authenticated user's school
    }

    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
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

    // Create parent accounts if provided (only for school admins with schoolId)
    const parentAccounts: Array<{ relation: string; email?: string; password?: string }> = []

    if (authUser.schoolId && father && father.name) {
      const result = await createParentAccount(supabase, father, authUser.schoolId, data.id)
      if (result.success && result.email && result.password) {
        parentAccounts.push({ relation: 'Father', email: result.email, password: result.password })
      }
    }

    if (authUser.schoolId && mother && mother.name) {
      const result = await createParentAccount(supabase, mother, authUser.schoolId, data.id)
      if (result.success && result.email && result.password) {
        parentAccounts.push({ relation: 'Mother', email: result.email, password: result.password })
      }
    }

    return NextResponse.json({
      data,
      parentAccounts: parentAccounts.length > 0 ? parentAccounts : undefined,
    }, { status: 201 })
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
