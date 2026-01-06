import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - Get single payroll record with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { id } = await params

    // Get payroll record first - ensure it belongs to user's school
    const { data: payroll, error: payrollError } = await supabase
      .from('salary_payroll')
      .select('*')
      .eq('id', id)
      .eq('school_id', authUser.schoolId)
      .single()

    if (payrollError) {
      console.error('Error fetching payroll:', payrollError)
      return NextResponse.json({ error: payrollError.message }, { status: 500 })
    }

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
    }

    // Get staff details separately to avoid relationship ambiguity
    let staffData = null
    if (payroll.staff_id) {
      const { data: staff } = await supabase
        .from('staff')
        .select('id, first_name, last_name, employee_id, designation, department_id')
        .eq('id', payroll.staff_id)
        .single()

      if (staff?.department_id) {
        const { data: dept } = await supabase
          .from('departments')
          .select('id, name')
          .eq('id', staff.department_id)
          .single()
        staffData = { ...staff, departments: dept }
      } else {
        staffData = staff
      }
    }

    // Get payroll component details
    const { data: details, error: detailsError } = await supabase
      .from('salary_payroll_details')
      .select('*')
      .eq('payroll_id', id)
      .order('component_type', { ascending: true })
      .order('component_name', { ascending: true })

    console.log('Fetching payroll details for id:', id)
    console.log('Details found:', details?.length || 0, details)

    if (detailsError) {
      console.error('Error fetching payroll details:', detailsError)
    }

    // Separate earnings and deductions
    const earnings = (details || []).filter(d => d.component_type === 'earning')
    const deductions = (details || []).filter(d => d.component_type === 'deduction')

    return NextResponse.json({
      data: {
        ...payroll,
        staff: staffData,
        details: details || [],
        earnings,
        deductions,
      }
    })
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
