import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - Get the next employee ID for the authenticated user's school
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const currentYear = new Date().getFullYear()
    const prefix = `EMP-${currentYear}-`

    // Find the highest employee ID with the current year prefix for this school
    const { data: staff } = await supabase
      .from('staff')
      .select('employee_id')
      .eq('school_id', authUser.schoolId) // Always use authenticated user's school
      .like('employee_id', `${prefix}%`)
      .order('employee_id', { ascending: false })
      .limit(1)

    let nextNumber = 1

    if (staff && staff.length > 0) {
      // Extract the number from the last employee ID
      const lastEmployeeId = staff[0].employee_id
      const match = lastEmployeeId.match(/EMP-\d{4}-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    // Format with leading zeros (at least 2 digits)
    const formattedNumber = nextNumber.toString().padStart(2, '0')
    const nextEmployeeId = `${prefix}${formattedNumber}`

    return NextResponse.json({
      employee_id: nextEmployeeId,
      year: currentYear,
      sequence: nextNumber,
    })
  } catch (error) {
    console.error('Error generating next employee ID:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
