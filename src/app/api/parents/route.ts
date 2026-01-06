import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - List/Search parents
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('parents')
      .select(`
        id,
        first_name,
        last_name,
        relation,
        phone,
        email,
        user_id,
        student_parents (
          student_id,
          students (id, first_name, last_name, admission_number)
        )
      `)
      .eq('school_id', authUser.schoolId)
      .order('first_name')
      .limit(limit)

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching parents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
