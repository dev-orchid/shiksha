import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - Get salary reports/analytics
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Get all payroll records for the year for user's school
    const { data: payrollData, error: payrollError } = await supabase
      .from('salary_payroll')
      .select(`
        month,
        year,
        gross_salary,
        total_deductions,
        net_salary,
        status,
        staff (
          id,
          department_id,
          departments (id, name)
        )
      `)
      .eq('school_id', authUser.schoolId)
      .eq('year', year)

    if (payrollError) {
      console.error('Error fetching payroll data:', payrollError)
      return NextResponse.json({ error: payrollError.message }, { status: 500 })
    }

    // Get total staff count for user's school
    const { count: totalStaff } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', authUser.schoolId)
      .eq('status', 'active')

    // Calculate yearly totals
    const totalPaid = payrollData
      ?.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (parseFloat(String(p.net_salary)) || 0), 0) || 0

    const totalPending = payrollData
      ?.filter(p => p.status === 'pending' || p.status === 'processed')
      .reduce((sum, p) => sum + (parseFloat(String(p.net_salary)) || 0), 0) || 0

    // Calculate average salary (from unique staff)
    const staffSalaries: Record<string, number> = {}
    payrollData?.forEach(p => {
      const staffId = (p.staff as any)?.id
      if (staffId) {
        staffSalaries[staffId] = parseFloat(String(p.net_salary)) || 0
      }
    })
    const uniqueSalaries = Object.values(staffSalaries)
    const averageSalary = uniqueSalaries.length > 0
      ? Math.round(uniqueSalaries.reduce((a, b) => a + b, 0) / uniqueSalaries.length)
      : 0

    // Calculate monthly trend
    const monthlyTrend: Record<number, number> = {}
    for (let m = 1; m <= 12; m++) {
      monthlyTrend[m] = 0
    }
    payrollData?.forEach(p => {
      if (p.status === 'paid') {
        monthlyTrend[p.month] = (monthlyTrend[p.month] || 0) + (parseFloat(String(p.net_salary)) || 0)
      }
    })

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    const monthlyData = Object.entries(monthlyTrend).map(([month, amount]) => ({
      month: monthNames[parseInt(month) - 1],
      amount,
    }))

    // Calculate department-wise distribution
    const departmentSalaries: Record<string, { name: string; total: number; count: number }> = {}
    payrollData?.forEach(p => {
      const dept = (p.staff as any)?.departments
      if (dept) {
        if (!departmentSalaries[dept.id]) {
          departmentSalaries[dept.id] = { name: dept.name, total: 0, count: 0 }
        }
        departmentSalaries[dept.id].total += parseFloat(String(p.net_salary)) || 0
        departmentSalaries[dept.id].count++
      }
    })

    const departmentData = Object.values(departmentSalaries)
      .map(d => ({
        name: d.name,
        total: d.total,
        count: d.count,
        average: d.count > 0 ? Math.round(d.total / d.count) : 0,
      }))
      .sort((a, b) => b.total - a.total)

    // Calculate total for percentage
    const totalDeptSalary = departmentData.reduce((sum, d) => sum + d.total, 0)
    const departmentWithPercentage = departmentData.map(d => ({
      ...d,
      percentage: totalDeptSalary > 0 ? Math.round((d.total / totalDeptSalary) * 100) : 0,
    }))

    return NextResponse.json({
      data: {
        totalPaid,
        totalPending,
        averageSalary,
        totalStaff: totalStaff || 0,
        year,
        monthlyTrend: monthlyData,
        departmentWise: departmentWithPercentage,
      }
    })
  } catch (error) {
    console.error('Error fetching salary reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
