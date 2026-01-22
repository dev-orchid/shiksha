import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, schoolName, password, payment_id, plan_type, student_count } = body

    // Validate required fields
    if (!name || !email || !password || !schoolName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if email is already registered
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // ALWAYS create a new school for each admin signup
    // Each organization gets their own isolated school/tenant
    // Only parent accounts should share the same school_id (handled separately)
    const schoolCode = `${schoolName.substring(0, 6).toUpperCase().replace(/\s/g, '')}${Date.now().toString(36).toUpperCase()}`

    // Build school data with optional payment info
    const schoolData: Record<string, unknown> = {
      name: schoolName,
      code: schoolCode,
      email: email,
      phone: phone || null,
      is_active: true,
    }

    // Add subscription info if payment was made
    if (payment_id && plan_type) {
      schoolData.subscription_plan = plan_type
      schoolData.subscription_status = 'active'
      schoolData.payment_id = payment_id
      if (student_count) {
        schoolData.student_limit = student_count
      }
    }

    const { data: newSchool, error: schoolError } = await supabase
      .from('schools')
      .insert(schoolData)
      .select('id')
      .single()

    if (schoolError) {
      console.error('Error creating school:', schoolError)
      return NextResponse.json(
        { error: 'Failed to create school' },
        { status: 500 }
      )
    }

    const schoolId = newSchool.id

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name,
        school_id: schoolId,
        role: 'admin',
      },
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: authError.message || 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create the user record in users table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id, // Use the Supabase Auth user ID
        email: email,
        role: 'admin', // First user of school becomes admin
        school_id: schoolId,
        is_active: true,
      })
      .select('id, email, role')
      .single()

    if (userError) {
      console.error('Error creating user record:', userError)
      // Don't fail - user can still login, the record can be created later
    }

    // Create staff profile for the user
    const employeeId = `ADMIN-${Date.now().toString(36).toUpperCase()}`
    await supabase
      .from('staff')
      .insert({
        school_id: schoolId,
        user_id: authData.user.id,
        employee_id: employeeId,
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || '',
        email: email,
        phone: phone || '0000000000', // Phone is required in schema
        designation: 'Administrator',
        employee_type: 'admin', // Required field
        employment_type: 'permanent',
        joining_date: new Date().toISOString().split('T')[0], // Correct column name
        status: 'active',
      })

    // Update payment status to 'used' if payment_id was provided
    if (payment_id) {
      await supabase
        .from('platform_payments')
        .update({
          status: 'used',
          school_id: schoolId,
          used_at: new Date().toISOString(),
        })
        .or(`id.eq.${payment_id},razorpay_payment_id.eq.${payment_id}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'admin',
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
