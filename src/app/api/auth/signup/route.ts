import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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

    // Check if user already exists
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

    // Hash the password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create the user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: email,
        password_hash: passwordHash,
        role: 'admin', // First user of school becomes admin
        school_id: schoolId,
        is_active: true,
      })
      .select('id, email, role')
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create staff profile for the user
    await supabase
      .from('staff')
      .insert({
        school_id: schoolId,
        user_id: newUser.id,
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
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
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
