import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const adminSupabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const studentId = searchParams.get('student_id')
    const limit = parseInt(searchParams.get('limit') || '20')

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

    // Get invoice IDs for the children
    let invoiceIds: string[] = []

    if (studentId) {
      const { data: invoices } = await adminSupabase
        .from('fee_invoices')
        .select('id')
        .eq('student_id', studentId)

      invoiceIds = (invoices || []).map(inv => inv.id)
    } else if (childrenIds.length > 0) {
      const { data: invoices } = await adminSupabase
        .from('fee_invoices')
        .select('id')
        .in('student_id', childrenIds)

      invoiceIds = (invoices || []).map(inv => inv.id)
    }

    if (invoiceIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Fetch payments
    const { data: payments, error: paymentsError } = await adminSupabase
      .from('fee_payments')
      .select(`
        *,
        fee_invoices (
          id,
          invoice_number,
          month,
          year,
          student_id,
          students (
            id,
            first_name,
            last_name
          )
        )
      `)
      .in('invoice_id', invoiceIds)
      .order('payment_date', { ascending: false })
      .limit(limit)

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: payments || [] })

  } catch (error) {
    console.error('Error in parent payments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
