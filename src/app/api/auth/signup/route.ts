import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, schoolName, password } = body

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

    // Check if school exists, if not create it
    let schoolId: string

    const { data: existingSchool } = await supabase
      .from('schools')
      .select('id')
      .eq('name', schoolName)
      .single()

    if (existingSchool) {
      schoolId = existingSchool.id
    } else {
      // Create new school
      const { data: newSchool, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: schoolName,
          code: schoolName.substring(0, 10).toUpperCase().replace(/\s/g, ''),
          email: email,
          phone: phone || null,
          is_active: true,
        })
        .select('id')
        .single()

      if (schoolError) {
        console.error('Error creating school:', schoolError)
        return NextResponse.json(
          { error: 'Failed to create school' },
          { status: 500 }
        )
      }

      schoolId = newSchool.id
    }

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
    await supabase
      .from('staff')
      .insert({
        school_id: schoolId,
        user_id: authData.user.id,
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || '',
        email: email,
        phone: phone || null,
        designation: 'Administrator',
        department: 'Administration',
        employment_type: 'full_time',
        join_date: new Date().toISOString().split('T')[0],
        is_active: true,
      })

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
