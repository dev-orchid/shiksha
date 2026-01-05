import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List/Search parents
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const schoolId = searchParams.get('school_id')
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
      .order('first_name')
      .limit(limit)

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

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
