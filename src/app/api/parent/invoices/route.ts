import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const adminSupabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const studentId = searchParams.get('student_id')
    const status = searchParams.get('status') // pending, partial, paid, overdue

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

    // Get ALL parent IDs with the same email
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

    // Get children IDs for all parent records
    const { data: studentParents } = await adminSupabase
      .from('student_parents')
      .select('student_id')
      .in('parent_id', parentIds)

    const childrenIds = [...new Set((studentParents || []).map(sp => sp.student_id))]

    if (childrenIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // If specific student requested, verify it belongs to this parent
    if (studentId && !childrenIds.includes(studentId)) {
      return NextResponse.json(
        { error: 'Access denied to this student' },
        { status: 403 }
      )
    }

    // Build query
    let query = adminSupabase
      .from('fee_invoices')
      .select(`
        *,
        students (
          id,
          first_name,
          last_name,
          admission_number,
          current_class:classes!current_class_id (name),
          current_section:sections!current_section_id (name)
        ),
        fee_invoice_items (
          id,
          description,
          amount,
          discount_amount,
          net_amount,
          fee_categories (id, name)
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by student
    if (studentId) {
      query = query.eq('student_id', studentId)
    } else {
      query = query.in('student_id', childrenIds)
    }

    // Filter by status
    if (status) {
      const statuses = status.split(',')
      query = query.in('status', statuses)
    }

    const { data: invoices, error: invoicesError } = await query

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: invoices || [] })

  } catch (error) {
    console.error('Error in parent invoices API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
