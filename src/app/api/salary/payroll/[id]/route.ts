import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'

// GET - Get single payroll record with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createApiClient()
    const { id } = await params

    // Get payroll record with staff details
    const { data: payroll, error: payrollError } = await supabase
      .from('salary_payroll')
      .select(`
        *,
        staff (
          id,
          first_name,
          last_name,
          employee_id,
          designation,
          department_id,
          departments (id, name)
        )
      `)
      .eq('id', id)
      .single()

    if (payrollError) {
      console.error('Error fetching payroll:', payrollError)
      return NextResponse.json({ error: payrollError.message }, { status: 500 })
    }

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
    }

    // Get payroll component details
    const { data: details, error: detailsError } = await supabase
      .from('salary_payroll_details')
      .select('*')
      .eq('payroll_id', id)
      .order('component_type', { ascending: true })
      .order('component_name', { ascending: true })

    if (detailsError) {
      console.error('Error fetching payroll details:', detailsError)
    }

    // Separate earnings and deductions
    const earnings = (details || []).filter(d => d.component_type === 'earning')
    const deductions = (details || []).filter(d => d.component_type === 'deduction')

    return NextResponse.json({
      data: {
        ...payroll,
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
