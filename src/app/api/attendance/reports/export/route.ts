import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0]
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]
    const classId = searchParams.get('class_id')
    const type = searchParams.get('type') || 'student'

    if (type === 'staff') {
      // Export staff attendance for user's school
      const { data: staffAttendance } = await supabase
        .from('staff_attendance')
        .select(`
          *,
          staff (first_name, last_name, employee_id, designation, departments(name))
        `)
        .eq('school_id', authUser.schoolId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      const headers = [
        'Date',
        'Employee ID',
        'Staff Name',
        'Designation',
        'Department',
        'Status',
        'Check In',
        'Check Out',
        'Remarks',
      ]

      const rows = (staffAttendance || []).map(record => [
        record.date,
        record.staff?.employee_id || '',
        `${record.staff?.first_name || ''} ${record.staff?.last_name || ''}`.trim(),
        record.staff?.designation || '',
        record.staff?.departments?.name || '',
        record.status,
        record.check_in_time || '',
        record.check_out_time || '',
        record.remarks || '',
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="staff_attendance_${startDate}_${endDate}.csv"`,
        },
      })
    }

    // Export student attendance (default) for user's school
    let query = supabase
      .from('student_attendance')
      .select(`
        *,
        students (first_name, last_name, admission_number, roll_number),
        classes (name),
        sections (name)
      `)
      .eq('school_id', authUser.schoolId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data: studentAttendance } = await query

    const headers = [
      'Date',
      'Admission No',
      'Roll No',
      'Student Name',
      'Class',
      'Section',
      'Status',
      'Check In',
      'Check Out',
      'Remarks',
    ]

    const rows = (studentAttendance || []).map(record => [
      record.date,
      record.students?.admission_number || '',
      record.students?.roll_number || '',
      `${record.students?.first_name || ''} ${record.students?.last_name || ''}`.trim(),
      record.classes?.name || '',
      record.sections?.name || '',
      record.status,
      record.check_in_time || '',
      record.check_out_time || '',
      record.remarks || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="student_attendance_${startDate}_${endDate}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting attendance report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
