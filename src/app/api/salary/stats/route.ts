import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'

// GET - Get salary dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { searchParams } = new URL(request.url)

    const schoolId = searchParams.get('school_id')
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    if (!schoolId) {
      return NextResponse.json({ error: 'school_id is required' }, { status: 400 })
    }

    // Get current month payroll data
    const { data: payrollData, error: payrollError } = await supabase
      .from('salary_payroll')
      .select('gross_salary, total_deductions, net_salary, status')
      .eq('school_id', schoolId)
      .eq('month', month)
      .eq('year', year)

    if (payrollError) {
      console.error('Error fetching payroll data:', payrollError)
      return NextResponse.json({ error: payrollError.message }, { status: 500 })
    }

    // Get total staff count
    const { count: totalStaff, error: staffError } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('is_active', true)

    if (staffError) {
      console.error('Error fetching staff count:', staffError)
    }

    // Calculate stats
    const totalGross = payrollData?.reduce((sum, p) => sum + (parseFloat(String(p.gross_salary)) || 0), 0) || 0
    const totalDeductions = payrollData?.reduce((sum, p) => sum + (parseFloat(String(p.total_deductions)) || 0), 0) || 0
    const totalNet = payrollData?.reduce((sum, p) => sum + (parseFloat(String(p.net_salary)) || 0), 0) || 0
    const pendingCount = payrollData?.filter(p => p.status === 'pending').length || 0
    const staffWithPayroll = payrollData?.length || 0

    return NextResponse.json({
      data: {
        thisMonthPayroll: totalGross,
        totalDeductions: totalDeductions,
        netPayable: totalNet,
        pendingPayments: pendingCount,
        staffWithPayroll: staffWithPayroll,
        totalStaff: totalStaff || 0,
        month,
        year,
      }
    })
  } catch (error) {
    console.error('Error fetching salary stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
