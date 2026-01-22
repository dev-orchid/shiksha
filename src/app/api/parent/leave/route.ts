import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List leave applications for parent's children
export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const adminSupabase = createAdminClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    // Get user details
    const { data: userData } = await adminSupabase
      .from('users')
      .select('id, email')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get parent record
    let parent = null

    const { data: parentByUserId } = await adminSupabase
      .from('parents')
      .select('id, email, school_id')
      .eq('user_id', userData.id)
      .maybeSingle()

    if (parentByUserId) {
      parent = parentByUserId
    }

    if (!parent && userData.email) {
      const { data: parentsByEmail } = await adminSupabase
        .from('parents')
        .select('id, email, user_id, school_id')
        .ilike('email', userData.email)

      if (parentsByEmail && parentsByEmail.length > 0) {
        parent = parentsByEmail[0]
      }
    }

    if (!parent) {
      return NextResponse.json({
        applications: [],
        message: 'No parent record found'
      })
    }

    // Get all parent IDs with same email
    let parentIds = [parent.id]
    if (parent.email) {
      const { data: allParentsWithEmail } = await adminSupabase
        .from('parents')
        .select('id')
        .ilike('email', parent.email)

      if (allParentsWithEmail && allParentsWithEmail.length > 0) {
        parentIds = allParentsWithEmail.map(p => p.id)
      }
    }

    // Get children
    const { data: studentParents } = await adminSupabase
      .from('student_parents')
      .select('student_id')
      .in('parent_id', parentIds)

    const studentIds = studentParents?.map(sp => sp.student_id) || []

    if (studentIds.length === 0) {
      return NextResponse.json({
        applications: [],
        message: 'No children linked'
      })
    }

    // Build query for leave applications
    let query = adminSupabase
      .from('leave_applications')
      .select(`
        id,
        applicant_type,
        student_id,
        leave_type_id,
        start_date,
        end_date,
        reason,
        status,
        rejection_reason,
        created_at,
        updated_at,
        students:student_id (
          id,
          first_name,
          last_name
        ),
        leave_types:leave_type_id (
          id,
          name
        )
      `)
      .eq('applicant_type', 'student')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false })

    // Filter by specific student if provided
    if (studentId && studentIds.includes(studentId)) {
      query = query.eq('student_id', studentId)
    }

    const { data: applications, error: applicationsError } = await query

    if (applicationsError) {
      console.error('Error fetching leave applications:', applicationsError)
      return NextResponse.json(
        { error: 'Failed to fetch leave applications' },
        { status: 500 }
      )
    }

    // Get leave types for the school
    const { data: leaveTypes } = await adminSupabase
      .from('leave_types')
      .select('id, name, description')
      .eq('school_id', parent.school_id)
      .eq('is_active', true)
      .order('name')

    return NextResponse.json({
      applications: applications || [],
      leaveTypes: leaveTypes || [],
    })

  } catch (error) {
    console.error('Error in parent leave API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Submit a new leave application
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const adminSupabase = createAdminClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { student_id, leave_type_id, start_date, end_date, reason } = body

    // Validate required fields
    if (!student_id || !start_date || !end_date || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, start_date, end_date, reason' },
        { status: 400 }
      )
    }

    // Validate dates
    const startDateObj = new Date(start_date)
    const endDateObj = new Date(end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDateObj > endDateObj) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      )
    }

    // Get user details
    const { data: userData } = await adminSupabase
      .from('users')
      .select('id, email')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get parent record
    let parent = null

    const { data: parentByUserId } = await adminSupabase
      .from('parents')
      .select('id, email, school_id')
      .eq('user_id', userData.id)
      .maybeSingle()

    if (parentByUserId) {
      parent = parentByUserId
    }

    if (!parent && userData.email) {
      const { data: parentsByEmail } = await adminSupabase
        .from('parents')
        .select('id, email, user_id, school_id')
        .ilike('email', userData.email)

      if (parentsByEmail && parentsByEmail.length > 0) {
        parent = parentsByEmail[0]
      }
    }

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent record not found' },
        { status: 404 }
      )
    }

    // Get all parent IDs with same email
    let parentIds = [parent.id]
    if (parent.email) {
      const { data: allParentsWithEmail } = await adminSupabase
        .from('parents')
        .select('id')
        .ilike('email', parent.email)

      if (allParentsWithEmail && allParentsWithEmail.length > 0) {
        parentIds = allParentsWithEmail.map(p => p.id)
      }
    }

    // Verify parent has access to this student
    const { data: studentParent } = await adminSupabase
      .from('student_parents')
      .select('student_id')
      .in('parent_id', parentIds)
      .eq('student_id', student_id)
      .maybeSingle()

    if (!studentParent) {
      return NextResponse.json(
        { error: 'You do not have permission to apply leave for this student' },
        { status: 403 }
      )
    }

    // Get student to fetch class and section
    const { data: student } = await adminSupabase
      .from('students')
      .select('id, school_id, current_class_id, current_section_id')
      .eq('id', student_id)
      .single()

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check for overlapping leave applications
    const { data: existingLeave } = await adminSupabase
      .from('leave_applications')
      .select('id, start_date, end_date, status')
      .eq('student_id', student_id)
      .in('status', ['pending', 'approved'])
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`)

    if (existingLeave && existingLeave.length > 0) {
      return NextResponse.json(
        { error: 'A leave application already exists for the selected dates' },
        { status: 400 }
      )
    }

    // Create the leave application
    const { data: application, error: insertError } = await adminSupabase
      .from('leave_applications')
      .insert({
        school_id: student.school_id,
        applicant_type: 'student',
        student_id,
        leave_type_id: leave_type_id || null,
        applied_by_parent_id: parent.id,
        start_date,
        end_date,
        reason,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating leave application:', insertError)
      return NextResponse.json(
        { error: 'Failed to create leave application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Leave application submitted successfully',
      application,
    })

  } catch (error) {
    console.error('Error in parent leave API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
