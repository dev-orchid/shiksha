import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/super-admin/schools/[id]
 * Get detailed information about a specific school
 * Only accessible by super_admin
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (authUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const { id: schoolId } = await params

    // Fetch school details
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single()

    if (schoolError || !school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Fetch usage stats
    const { data: usageData } = await supabase
      .rpc('get_school_current_usage', { p_school_id: schoolId })
      .single()

    // Fetch additional stats
    const { count: teachersCount } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('is_active', true)

    const { data: feesData } = await supabase
      .from('fee_payments')
      .select('amount')
      .eq('school_id', schoolId)
      .eq('status', 'paid')

    const totalFeesCollected = feesData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0

    return NextResponse.json({
      ...school,
      active_students: usageData?.active_students || 0,
      admin_users: usageData?.admin_users || 0,
      total_teachers: teachersCount || 0,
      total_fees_collected: totalFeesCollected,
    })
  } catch (error) {
    console.error('Error fetching school details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/super-admin/schools/[id]
 * Delete a school and all associated data
 * Only accessible by super_admin
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (authUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const { id: schoolId } = await params

    // Get query params for options
    const url = new URL(req.url)
    const forceDelete = url.searchParams.get('force') === 'true'
    const cleanupOrphaned = url.searchParams.get('cleanup_orphaned') === 'true'

    // Check if school exists
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', schoolId)
      .single()

    if (cleanupOrphaned && !school) {
      // Clean up orphaned data for a school that no longer exists
      const deletionResults = await cleanupOrphanedSchoolData(supabase, schoolId)
      return NextResponse.json({
        message: 'Orphaned data cleaned up successfully',
        schoolId,
        deletedRecords: deletionResults,
      })
    }

    if (schoolError || !school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Check for existing data
    const { count: studentsCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)

    const { count: staffCount } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)

    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)

    const totalRecords = (studentsCount || 0) + (staffCount || 0) + (usersCount || 0)

    if (totalRecords > 0 && !forceDelete) {
      return NextResponse.json({
        error: 'School has associated data',
        message: `This school has ${studentsCount || 0} students, ${staffCount || 0} staff members, and ${usersCount || 0} users. Use force=true to delete all data.`,
        studentsCount,
        staffCount,
        usersCount,
      }, { status: 400 })
    }

    // Delete related data first to avoid foreign key constraint issues
    // Delete in order of dependencies (children first, then parents)

    try {
      // Get student IDs for this school
      const { data: studentIds } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
      const studentIdList = studentIds?.map(s => s.id) || []

      // Get staff IDs for this school
      const { data: staffIds } = await supabase
        .from('staff')
        .select('id')
        .eq('school_id', schoolId)
      const staffIdList = staffIds?.map(s => s.id) || []

      // Get class IDs for this school
      const { data: classIds } = await supabase
        .from('classes')
        .select('id')
        .eq('school_id', schoolId)
      const classIdList = classIds?.map(c => c.id) || []

      // Get exam IDs for this school
      const { data: examIds } = await supabase
        .from('exams')
        .select('id')
        .eq('school_id', schoolId)
      const examIdList = examIds?.map(e => e.id) || []

      // Delete student-related data
      if (studentIdList.length > 0) {
        await supabase.from('student_documents').delete().in('student_id', studentIdList)
        await supabase.from('student_parents').delete().in('student_id', studentIdList)
        await supabase.from('student_academic_history').delete().in('student_id', studentIdList)
        await supabase.from('fee_invoices').delete().in('student_id', studentIdList)
        await supabase.from('exam_results').delete().in('student_id', studentIdList)
      }

      // Delete staff-related data
      if (staffIdList.length > 0) {
        await supabase.from('staff_documents').delete().in('staff_id', staffIdList)
        await supabase.from('teacher_assignments').delete().in('staff_id', staffIdList)
      }

      // Delete class-related data
      if (classIdList.length > 0) {
        await supabase.from('class_subjects').delete().in('class_id', classIdList)
      }

      // Delete exam-related data
      if (examIdList.length > 0) {
        await supabase.from('exam_schedules').delete().in('exam_id', examIdList)
      }

      // Delete data with direct school_id references
      await supabase.from('student_attendance').delete().eq('school_id', schoolId)
      await supabase.from('staff_attendance').delete().eq('school_id', schoolId)
      await supabase.from('leave_applications').delete().eq('school_id', schoolId)
      await supabase.from('exams').delete().eq('school_id', schoolId)
      await supabase.from('exam_types').delete().eq('school_id', schoolId)
      await supabase.from('grade_settings').delete().eq('school_id', schoolId)
      await supabase.from('events').delete().eq('school_id', schoolId)
      await supabase.from('leave_types').delete().eq('school_id', schoolId)
      await supabase.from('sections').delete().eq('school_id', schoolId)
      await supabase.from('subjects').delete().eq('school_id', schoolId)

      // Delete students
      await supabase.from('students').delete().eq('school_id', schoolId)

      // Delete parents
      await supabase.from('parents').delete().eq('school_id', schoolId)

      // Clear department head references before deleting staff
      await supabase.from('departments').update({ head_id: null }).eq('school_id', schoolId)

      // Delete staff
      await supabase.from('staff').delete().eq('school_id', schoolId)

      // Delete departments
      await supabase.from('departments').delete().eq('school_id', schoolId)

      // Delete classes
      await supabase.from('classes').delete().eq('school_id', schoolId)

      // Delete academic years
      await supabase.from('academic_years').delete().eq('school_id', schoolId)

      // Delete users associated with this school
      await supabase.from('users').delete().eq('school_id', schoolId)

    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError)
      // Continue to try deleting the school anyway
    }

    // Finally, delete the school
    const { error: deleteError } = await supabase
      .from('schools')
      .delete()
      .eq('id', schoolId)

    if (deleteError) {
      console.error('Error deleting school:', deleteError)
      return NextResponse.json({ error: `Failed to delete school: ${deleteError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      message: 'School deleted successfully',
      schoolId,
      schoolName: school.name,
      deletedRecords: {
        students: studentsCount || 0,
        staff: staffCount || 0,
        users: usersCount || 0,
      },
    })
  } catch (error) {
    console.error('Error deleting school:', error)
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}

/**
 * Clean up orphaned data for a school that no longer exists
 */
async function cleanupOrphanedSchoolData(supabase: ReturnType<typeof createAdminClient>, schoolId: string) {
  const results: Record<string, number> = {}

  // Tables that might have orphaned data with school_id references
  const tables = [
    'students',
    'staff',
    'users',
    'academic_years',
    'classes',
    'sections',
    'subjects',
    'departments',
    'student_attendance',
    'staff_attendance',
    'leave_types',
    'leave_applications',
    'exam_types',
    'exams',
    'fee_structures',
    'fee_invoices',
    'events',
  ]

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .eq('school_id', schoolId)
        .select('id')

      if (!error && data) {
        results[table] = data.length
      }
    } catch (e) {
      // Table might not have school_id column, skip
      console.log(`Skipping table ${table}:`, e)
    }
  }

  return results
}
