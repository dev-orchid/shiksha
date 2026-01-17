import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// Generate a random password
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

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
      enable_portal_access: z.boolean().optional().default(false),
    })

    const data = schema.parse(body)

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, school_id, first_name, last_name')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    let parentId = data.parent_id
    let portalResult: PortalAccessResult | null = null

    // If no parent_id provided, check if parent with same email exists, otherwise create new
    if (!parentId && data.first_name) {
      // First check if a parent with the same email already exists
      if (data.email) {
        const { data: existingParent } = await supabase
          .from('parents')
          .select('id, user_id')
          .eq('school_id', student.school_id)
          .ilike('email', data.email)
          .limit(1)
          .single()

        if (existingParent) {
          parentId = existingParent.id

          // If portal access requested but parent already exists without user_id, create access
          if (data.enable_portal_access && data.email) {
            portalResult = await createPortalAccess(
              supabase,
              existingParent.id,
              data.email,
              data.first_name!,
              data.last_name || '',
              student.school_id
            )
          }
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

        // Create portal access if requested and email is provided
        if (data.enable_portal_access && data.email) {
          portalResult = await createPortalAccess(
            supabase,
            newParent.id,
            data.email,
            data.first_name!,
            data.last_name || '',
            student.school_id
          )
        }
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
        parents (id, first_name, last_name, relation, phone, email, user_id)
      `)
      .single()

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: link,
      portal_credentials: portalResult?.credentials || null,
      portal_message: portalResult?.message || null,
      portal_already_exists: portalResult?.alreadyExists || false,
    }, { status: 201 })
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

interface PortalAccessResult {
  success: boolean
  credentials?: { email: string; password: string }
  message: string
  alreadyExists?: boolean
}

// Helper function to create portal access for a parent
async function createPortalAccess(
  supabase: ReturnType<typeof createAdminClient>,
  parentId: string,
  email: string,
  firstName: string,
  lastName: string,
  schoolId: string
): Promise<PortalAccessResult> {
  try {
    // Check if user with this email already exists in auth
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (existingAuthUser) {
      // Check if already linked to this parent
      const { data: parent } = await supabase
        .from('parents')
        .select('user_id')
        .eq('id', parentId)
        .single()

      if (parent?.user_id === existingAuthUser.id) {
        return {
          success: true,
          message: 'Parent already has portal access with this email.',
          alreadyExists: true,
        }
      }

      // Link existing user to parent
      await supabase
        .from('parents')
        .update({ user_id: existingAuthUser.id })
        .eq('id', parentId)

      // Make sure user exists in users table
      const { data: existingUserRecord } = await supabase
        .from('users')
        .select('id')
        .eq('id', existingAuthUser.id)
        .single()

      if (!existingUserRecord) {
        // Create users table record for existing auth user
        await supabase.from('users').insert({
          id: existingAuthUser.id,
          email: email,
          role: 'parent',
          school_id: schoolId,
          is_active: true,
          email_verified: true,
        })
      }

      return {
        success: true,
        message: 'A user with this email already exists. The parent has been linked to the existing account.',
        alreadyExists: true,
      }
    }

    // Generate password
    const password = generatePassword()
    const displayName = `${firstName} ${lastName}`.trim()

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        school_id: schoolId,
        role: 'parent',
      },
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user for parent:', authError)
      return {
        success: false,
        message: `Failed to create portal account: ${authError?.message || 'Unknown error'}`,
      }
    }

    // Create user record in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        role: 'parent',
        school_id: schoolId,
        is_active: true,
        email_verified: true,
      })

    if (userError) {
      console.error('Error creating user record for parent:', userError)
      // Cleanup: delete auth user if users table insert fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        message: `Failed to create user record: ${userError.message}`,
      }
    }

    // Link user to parent record
    await supabase
      .from('parents')
      .update({ user_id: authData.user.id })
      .eq('id', parentId)

    return {
      success: true,
      credentials: { email, password },
      message: 'Portal access created successfully',
    }
  } catch (error) {
    console.error('Error creating portal access:', error)
    return {
      success: false,
      message: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
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
