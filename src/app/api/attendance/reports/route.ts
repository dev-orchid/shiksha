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
    const type = searchParams.get('type') || 'student' // 'student' or 'staff'

    if (type === 'staff') {
      // Staff attendance report for user's school
      const { data: staffAttendance, error: staffError } = await supabase
        .from('staff_attendance')
        .select(`
          *,
          staff!staff_id (id, first_name, last_name, employee_id, designation, department_id, department:departments!department_id(id, name))
        `)
        .eq('school_id', authUser.schoolId)
        .gte('date', startDate)
        .lte('date', endDate)

      if (staffError) {
        return NextResponse.json({ error: staffError.message }, { status: 500 })
      }

      // Get total staff count for user's school
      const { count: totalStaff } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', authUser.schoolId)
        .eq('status', 'active')

      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const todayAttendance = staffAttendance?.filter(a => a.date === today) || []

      const stats = {
        totalStaff: totalStaff || 0,
        presentToday: todayAttendance.filter(a => a.status === 'present').length,
        absentToday: todayAttendance.filter(a => a.status === 'absent').length,
        attendanceRate: todayAttendance.length > 0
          ? Math.round((todayAttendance.filter(a => a.status === 'present').length / todayAttendance.length) * 100)
          : 0,
      }

      // Group by department
      const departmentWise: Record<string, { name: string; present: number; absent: number; late: number; total: number }> = {}

      for (const record of staffAttendance || []) {
        const deptName = record.staff?.department?.name || 'Unknown'
        if (!departmentWise[deptName]) {
          departmentWise[deptName] = { name: deptName, present: 0, absent: 0, late: 0, total: 0 }
        }
        departmentWise[deptName].total++
        if (record.status === 'present') departmentWise[deptName].present++
        else if (record.status === 'absent') departmentWise[deptName].absent++
        else if (record.status === 'late') departmentWise[deptName].late++
      }

      return NextResponse.json({
        stats,
        departmentWise: Object.values(departmentWise),
        data: staffAttendance,
      })
    }

    // Student attendance report (default) for user's school
    let attendanceQuery = supabase
      .from('student_attendance')
      .select(`
        *,
        students (id, first_name, last_name, admission_number, roll_number),
        classes (id, name),
        sections (id, name)
      `)
      .eq('school_id', authUser.schoolId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (classId) {
      attendanceQuery = attendanceQuery.eq('class_id', classId)
    }

    const { data: studentAttendance, error } = await attendanceQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get total active students for user's school
    let studentCountQuery = supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', authUser.schoolId)
      .eq('status', 'active')

    if (classId) {
      studentCountQuery = studentCountQuery.eq('current_class_id', classId)
    }

    const { count: totalStudents } = await studentCountQuery

    // Calculate stats for today
    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = studentAttendance?.filter(a => a.date === today) || []

    const stats = {
      totalStudents: totalStudents || 0,
      presentToday: todayAttendance.filter(a => a.status === 'present').length,
      absentToday: todayAttendance.filter(a => a.status === 'absent').length,
      attendanceRate: todayAttendance.length > 0
        ? Math.round((todayAttendance.filter(a => a.status === 'present').length / todayAttendance.length) * 100)
        : 0,
    }

    // Group by class
    const classWise: Record<string, { className: string; present: number; absent: number; late: number; total: number }> = {}

    for (const record of studentAttendance || []) {
      const className = record.classes?.name || 'Unknown'
      if (!classWise[className]) {
        classWise[className] = { className, present: 0, absent: 0, late: 0, total: 0 }
      }
      classWise[className].total++
      if (record.status === 'present') classWise[className].present++
      else if (record.status === 'absent') classWise[className].absent++
      else if (record.status === 'late') classWise[className].late++
    }

    return NextResponse.json({
      stats,
      classWise: Object.values(classWise).sort((a, b) => a.className.localeCompare(b.className)),
      data: studentAttendance,
    })
  } catch (error) {
    console.error('Error fetching attendance report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
