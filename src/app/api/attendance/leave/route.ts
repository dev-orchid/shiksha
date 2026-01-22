import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - List leave applications
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser || !authUser.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') // pending, approved, rejected, all
    const classId = searchParams.get('class_id')
    const studentId = searchParams.get('student_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('leave_applications')
      .select(`
        id,
        applicant_type,
        student_id,
        leave_type_id,
        applied_by_parent_id,
        start_date,
        end_date,
        reason,
        status,
        approved_by,
        approved_at,
        rejection_reason,
        created_at,
        updated_at,
        students:student_id (
          id,
          first_name,
          last_name,
          admission_number,
          current_class_id,
          current_section_id,
          current_class:classes!current_class_id (id, name),
          current_section:sections!current_section_id (id, name)
        ),
        leave_types:leave_type_id (
          id,
          name
        ),
        approved_by_user:users!approved_by (
          id,
          email
        )
      `, { count: 'exact' })
      .eq('school_id', authUser.schoolId)
      .eq('applicant_type', 'student')
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    const { data: applications, error, count } = await query

    if (error) {
      console.error('Error fetching leave applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leave applications' },
        { status: 500 }
      )
    }

    // Filter by class if provided (after fetching since we need to join)
    let filteredApplications = applications || []
    if (classId) {
      filteredApplications = filteredApplications.filter((app: any) =>
        app.students?.current_class_id === classId
      )
    }

    // Get leave types for the school
    const { data: leaveTypes } = await supabase
      .from('leave_types')
      .select('id, name, description')
      .eq('school_id', authUser.schoolId)
      .eq('is_active', true)
      .order('name')

    return NextResponse.json({
      applications: filteredApplications,
      leaveTypes: leaveTypes || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })

  } catch (error) {
    console.error('Error in leave applications API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update leave application (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser || !authUser.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()
    const { id, action, rejection_reason } = body

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: id, action' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    if (action === 'reject' && !rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a leave application' },
        { status: 400 }
      )
    }

    // Check if the leave application exists and belongs to the school
    interface LeaveApplicationRow {
      id: string
      status: string
      student_id: string | null
      start_date: string
      end_date: string
    }

    const { data: existingLeaveData, error: fetchError } = await supabase
      .from('leave_applications')
      .select('id, status, student_id, start_date, end_date')
      .eq('id', id)
      .eq('school_id', authUser.schoolId)
      .single()

    const existingLeave = existingLeaveData as LeaveApplicationRow | null

    if (fetchError || !existingLeave) {
      return NextResponse.json(
        { error: 'Leave application not found' },
        { status: 404 }
      )
    }

    if (existingLeave.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending applications can be approved or rejected' },
        { status: 400 }
      )
    }

    // Update the leave application using raw query approach for type safety
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const now = new Date().toISOString()
    const rejectionReasonValue = action === 'reject' ? rejection_reason : null

    // Use type assertion to bypass strict typing for tables not in generated types
    const leaveTable = supabase.from('leave_applications') as any

    const { data: updatedLeave, error: updateError } = await leaveTable
      .update({
        status: newStatus,
        approved_by: authUser.userId,
        approved_at: now,
        updated_at: now,
        rejection_reason: rejectionReasonValue,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating leave application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update leave application' },
        { status: 500 }
      )
    }

    // If approved, update attendance records for the leave period
    if (action === 'approve' && existingLeave.student_id) {
      const startDate = new Date(existingLeave.start_date)
      const endDate = new Date(existingLeave.end_date)

      // Get student's class and section
      interface StudentRow {
        current_class_id: string | null
        current_section_id: string | null
      }

      const { data: studentData } = await supabase
        .from('students')
        .select('current_class_id, current_section_id')
        .eq('id', existingLeave.student_id)
        .single()

      const student = studentData as StudentRow | null

      if (student) {
        // Generate dates for the leave period
        const dates: string[] = []
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          dates.push(currentDate.toISOString().split('T')[0])
          currentDate.setDate(currentDate.getDate() + 1)
        }

        // Upsert attendance records as 'leave' for each day
        for (const date of dates) {
          await supabase
            .from('student_attendance')
            .upsert({
              school_id: authUser.schoolId,
              student_id: existingLeave.student_id,
              class_id: student.current_class_id,
              section_id: student.current_section_id,
              date,
              status: 'leave',
              remarks: `Leave approved: ${existingLeave.start_date} to ${existingLeave.end_date}`,
              marked_by: authUser.userId,
            } as any, {
              onConflict: 'student_id,date',
            })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve'
        ? 'Leave application approved successfully'
        : 'Leave application rejected',
      application: updatedLeave,
    })

  } catch (error) {
    console.error('Error in leave applications API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
