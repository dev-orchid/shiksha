import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const adminSupabase = createAdminClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user details (use admin to bypass RLS)
    const { data: userData } = await adminSupabase
      .from('users')
      .select('id, email')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get parent record - try by user_id first, then by email
    let parent = null

    // First try by user_id
    const { data: parentByUserId } = await adminSupabase
      .from('parents')
      .select('id, email')
      .eq('user_id', userData.id)
      .maybeSingle()

    if (parentByUserId) {
      parent = parentByUserId
    }

    // If not found by user_id, try by email
    if (!parent && userData.email) {
      const { data: parentsByEmail } = await adminSupabase
        .from('parents')
        .select('id, email, user_id')
        .ilike('email', userData.email)

      if (parentsByEmail && parentsByEmail.length > 0) {
        parent = parentsByEmail[0]

        // Auto-link if not linked
        if (!parent.user_id) {
          await adminSupabase
            .from('parents')
            .update({ user_id: userData.id })
            .eq('id', parent.id)
        }
      }
    }

    if (!parent) {
      return NextResponse.json({ data: [] })
    }

    // Get ALL parent IDs with the same email (handles duplicate parent records)
    let parentIds = [parent.id]
    if (parent.email) {
      const { data: allParentsWithEmail } = await adminSupabase
        .from('parents')
        .select('id')
        .ilike('email', parent.email)

      if (allParentsWithEmail && allParentsWithEmail.length > 0) {
        parentIds = allParentsWithEmail.map(p => p.id)
      }
    }

    // Get children linked to ANY of these parent IDs
    const { data: studentParents, error: spError } = await adminSupabase
      .from('student_parents')
      .select(`
        student_id,
        is_primary,
        students (
          id,
          first_name,
          last_name,
          admission_number,
          date_of_birth,
          gender,
          photo_url,
          phone,
          email,
          school_id,
          current_class:classes!current_class_id (
            id,
            name
          ),
          current_section:sections!current_section_id (
            id,
            name
          )
        )
      `)
      .in('parent_id', parentIds)

    if (spError) {
      console.error('Error fetching children:', spError)
      return NextResponse.json(
        { error: 'Failed to fetch children' },
        { status: 500 }
      )
    }

    interface StudentData {
      id: string
      first_name: string
      last_name: string
      admission_number: string
      date_of_birth: string | null
      gender: string | null
      photo_url: string | null
      phone: string | null
      email: string | null
      school_id: string
      current_class: { id: string; name: string } | null
      current_section: { id: string; name: string } | null
    }

    // Transform and dedupe the data (same student might be linked to multiple parent records)
    const childrenMap = new Map<string, StudentData & { is_primary: boolean }>()
    ;(studentParents || []).forEach(sp => {
      const student = sp.students as unknown as StudentData
      if (student && student.id && !childrenMap.has(student.id)) {
        childrenMap.set(student.id, {
          ...student,
          is_primary: sp.is_primary,
        })
      }
    })

    const children = Array.from(childrenMap.values())

    return NextResponse.json({ data: children })

  } catch (error) {
    console.error('Error in parent children API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
