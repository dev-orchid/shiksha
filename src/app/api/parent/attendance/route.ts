import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString()) + 1
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

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
      .select('id, email')
      .eq('user_id', userData.id)
      .maybeSingle()

    if (parentByUserId) {
      parent = parentByUserId
    }

    if (!parent && userData.email) {
      const { data: parentsByEmail } = await adminSupabase
        .from('parents')
        .select('id, email, user_id')
        .ilike('email', userData.email)

      if (parentsByEmail && parentsByEmail.length > 0) {
        parent = parentsByEmail[0]
      }
    }

    if (!parent) {
      return NextResponse.json({
        data: null,
        children: [],
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
      .select(`
        student_id,
        students (
          id,
          first_name,
          last_name,
          admission_number,
          current_class:classes!current_class_id (id, name),
          current_section:sections!current_section_id (id, name)
        )
      `)
      .in('parent_id', parentIds)

    interface StudentData {
      id: string
      first_name: string
      last_name: string
      admission_number: string
      current_class: { id: string; name: string } | null
      current_section: { id: string; name: string } | null
    }

    const childrenMap = new Map<string, StudentData>()
    ;(studentParents || []).forEach(sp => {
      const student = sp.students as unknown as StudentData
      if (student && student.id && !childrenMap.has(student.id)) {
        childrenMap.set(student.id, student)
      }
    })

    const children = Array.from(childrenMap.values())

    if (children.length === 0) {
      return NextResponse.json({
        data: null,
        children: [],
        message: 'No children linked'
      })
    }

    // Use first child if no student_id specified, or verify the student belongs to parent
    let selectedStudentId = studentId || children[0].id
    const isValidChild = children.some(c => c.id === selectedStudentId)
    if (!isValidChild) {
      selectedStudentId = children[0].id
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0) // Last day of month
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Get attendance for the selected student in the month
    const { data: attendanceRecords } = await adminSupabase
      .from('student_attendance')
      .select('id, date, status, check_in_time, check_out_time, remarks')
      .eq('student_id', selectedStudentId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })

    // Get overall attendance (full year or academic year)
    const yearStart = new Date(year, 3, 1) // April 1st (Indian academic year)
    const yearEnd = new Date(year + 1, 2, 31) // March 31st next year

    // If current date is before April, use previous academic year
    const now = new Date()
    let academicYearStart = yearStart
    let academicYearEnd = yearEnd
    if (now.getMonth() < 3) {
      academicYearStart = new Date(year - 1, 3, 1)
      academicYearEnd = new Date(year, 2, 31)
    }

    const { data: yearlyAttendance } = await adminSupabase
      .from('student_attendance')
      .select('status')
      .eq('student_id', selectedStudentId)
      .gte('date', academicYearStart.toISOString().split('T')[0])
      .lte('date', academicYearEnd.toISOString().split('T')[0])

    // Calculate overall summary
    const overallSummary = {
      totalDays: yearlyAttendance?.length || 0,
      present: yearlyAttendance?.filter(a => a.status === 'present').length || 0,
      absent: yearlyAttendance?.filter(a => a.status === 'absent').length || 0,
      late: yearlyAttendance?.filter(a => a.status === 'late').length || 0,
      halfDay: yearlyAttendance?.filter(a => a.status === 'half_day').length || 0,
      leave: yearlyAttendance?.filter(a => a.status === 'leave').length || 0,
      percentage: 0,
    }

    if (overallSummary.totalDays > 0) {
      const presentDays = overallSummary.present + overallSummary.late + (overallSummary.halfDay * 0.5)
      overallSummary.percentage = Math.round((presentDays / overallSummary.totalDays) * 100 * 100) / 100
    }

    // Calculate monthly summary
    const monthlyPresent = attendanceRecords?.filter(a => a.status === 'present').length || 0
    const monthlyAbsent = attendanceRecords?.filter(a => a.status === 'absent').length || 0
    const monthlyLate = attendanceRecords?.filter(a => a.status === 'late').length || 0
    const monthlyHalfDay = attendanceRecords?.filter(a => a.status === 'half_day').length || 0
    const monthlyLeave = attendanceRecords?.filter(a => a.status === 'leave').length || 0
    const monthlyTotal = attendanceRecords?.length || 0

    // Build calendar data for the month
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

    // Create attendance map for quick lookup
    interface AttendanceRecord {
      id: string
      date: string
      status: string
      check_in_time: string | null
      check_out_time: string | null
      remarks: string | null
    }
    const attendanceMap = new Map<string, AttendanceRecord>()
    attendanceRecords?.forEach(record => {
      const dateKey = new Date(record.date).getDate().toString()
      attendanceMap.set(dateKey, record as AttendanceRecord)
    })

    // Build days array
    const days: Array<{
      date: number
      day: string
      status: string
      time?: string
      reason?: string
    }> = []

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month - 1, i)
      const dayOfWeek = dayDate.getDay()
      const dayName = dayNames[dayOfWeek]

      const record = attendanceMap.get(i.toString())

      // Determine status
      let status = 'no_record'
      let time: string | undefined
      let reason: string | undefined

      if (record) {
        status = record.status
        time = record.check_in_time || undefined
        reason = record.remarks || undefined
      } else if (dayOfWeek === 0) {
        // Sunday - holiday
        status = 'holiday'
      } else if (dayDate > new Date()) {
        // Future date
        status = 'future'
      }

      days.push({
        date: i,
        day: dayName,
        status,
        time,
        reason,
      })
    }

    // Get recent absences
    const { data: recentAbsences } = await adminSupabase
      .from('student_attendance')
      .select('date, status, remarks')
      .eq('student_id', selectedStudentId)
      .in('status', ['absent', 'leave'])
      .order('date', { ascending: false })
      .limit(5)

    return NextResponse.json({
      children: children.map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        class: c.current_class?.name || 'N/A',
        section: c.current_section?.name || '',
      })),
      selectedStudent: selectedStudentId,
      month,
      year,
      summary: overallSummary,
      monthly: {
        totalDays: monthlyTotal,
        present: monthlyPresent,
        absent: monthlyAbsent,
        late: monthlyLate,
        halfDay: monthlyHalfDay,
        leave: monthlyLeave,
        percentage: monthlyTotal > 0
          ? Math.round(((monthlyPresent + monthlyLate + (monthlyHalfDay * 0.5)) / monthlyTotal) * 100 * 100) / 100
          : 0,
        days,
      },
      recentAbsences: (recentAbsences || []).map(a => ({
        date: a.date,
        reason: a.remarks || (a.status === 'leave' ? 'On Leave' : 'Absent'),
        status: 'recorded',
      })),
    })

  } catch (error) {
    console.error('Error in parent attendance API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
