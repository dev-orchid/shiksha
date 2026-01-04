import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'

// GET - Get payroll history grouped by month
export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { searchParams } = new URL(request.url)

    const schoolId = searchParams.get('school_id')
    const limit = parseInt(searchParams.get('limit') || '12')

    if (!schoolId) {
      return NextResponse.json({ error: 'school_id is required' }, { status: 400 })
    }

    // Get all payroll records grouped by month/year
    const { data: payrollData, error } = await supabase
      .from('salary_payroll')
      .select('month, year, gross_salary, total_deductions, net_salary, status')
      .eq('school_id', schoolId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (error) {
      console.error('Error fetching payroll history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group payroll data by month/year
    const monthlyData: Record<string, {
      month: number
      year: number
      totalStaff: number
      grossAmount: number
      deductions: number
      netAmount: number
      paidCount: number
      pendingCount: number
    }> = {}

    payrollData?.forEach(record => {
      const key = `${record.year}-${record.month}`
      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: record.month,
          year: record.year,
          totalStaff: 0,
          grossAmount: 0,
          deductions: 0,
          netAmount: 0,
          paidCount: 0,
          pendingCount: 0,
        }
      }
      monthlyData[key].totalStaff++
      monthlyData[key].grossAmount += parseFloat(String(record.gross_salary)) || 0
      monthlyData[key].deductions += parseFloat(String(record.total_deductions)) || 0
      monthlyData[key].netAmount += parseFloat(String(record.net_salary)) || 0
      if (record.status === 'paid') {
        monthlyData[key].paidCount++
      } else if (record.status === 'pending') {
        monthlyData[key].pendingCount++
      }
    })

    // Convert to array and sort
    const history = Object.values(monthlyData)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
      .slice(0, limit)
      .map(item => {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
        const allPaid = item.pendingCount === 0 && item.paidCount > 0
        return {
          id: `${item.year}-${item.month}`,
          month: `${monthNames[item.month - 1]} ${item.year}`,
          monthNumber: item.month,
          year: item.year,
          totalStaff: item.totalStaff,
          grossAmount: item.grossAmount,
          deductions: item.deductions,
          netAmount: item.netAmount,
          status: allPaid ? 'paid' : 'pending',
          paidCount: item.paidCount,
          pendingCount: item.pendingCount,
        }
      })

    return NextResponse.json({ data: history })
  } catch (error) {
    console.error('Error fetching payroll history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
