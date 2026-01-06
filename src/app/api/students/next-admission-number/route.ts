import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - Get the next admission number for the authenticated user's school
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const currentYear = new Date().getFullYear()
    const prefix = `STU-${currentYear}-`

    // Find the highest admission number with the current year prefix for this school
    const { data: students } = await supabase
      .from('students')
      .select('admission_number')
      .eq('school_id', authUser.schoolId) // Always use authenticated user's school
      .like('admission_number', `${prefix}%`)
      .order('admission_number', { ascending: false })
      .limit(1)

    let nextNumber = 1

    if (students && students.length > 0) {
      // Extract the number from the last admission number
      const lastAdmissionNumber = students[0].admission_number
      const match = lastAdmissionNumber.match(/STU-\d{4}-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    // Format with leading zeros (at least 2 digits)
    const formattedNumber = nextNumber.toString().padStart(2, '0')
    const nextAdmissionNumber = `${prefix}${formattedNumber}`

    return NextResponse.json({
      admission_number: nextAdmissionNumber,
      year: currentYear,
      sequence: nextNumber,
    })
  } catch (error) {
    console.error('Error generating next admission number:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
