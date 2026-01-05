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

    // Get user details including school (use admin to bypass RLS)
    const { data: userData } = await adminSupabase
      .from('users')
      .select('id, email, role, school_id, schools(id, name, code)')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get parent record - simplified approach
    let parent = null

    // First try by user_id
    const { data: parentByUserId } = await adminSupabase
      .from('parents')
      .select('id, first_name, last_name, phone, email, user_id')
      .eq('user_id', userData.id)
      .maybeSingle()

    if (parentByUserId) {
      parent = parentByUserId
    }

    // If not found by user_id, try by email
    if (!parent && userData.email) {
      const { data: parentsByEmail } = await adminSupabase
        .from('parents')
        .select('id, first_name, last_name, phone, email, user_id')
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
      return NextResponse.json({
        user: userData,
        parent: null,
        children: [],
        stats: { childrenCount: 0, totalDueFees: 0, attendancePercent: 0 },
        recentUpdates: [],
      })
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
    const { data: studentParents } = await adminSupabase
      .from('student_parents')
      .select(`
        student_id,
        is_primary,
        students (
          id,
          first_name,
          last_name,
          admission_number,
          roll_number,
          photo_url,
          current_class:classes!current_class_id (id, name),
          current_section:sections!current_section_id (id, name)
        )
      `)
      .in('parent_id', parentIds)

    interface StudentData {
      id: string
      first_name: string
      last_name: string
      admission_number: string
      roll_number: string
      photo_url: string | null
      current_class: { id: string; name: string } | null
      current_section: { id: string; name: string } | null
    }

    const children = (studentParents || []).map(sp => ({
      ...(sp.students as unknown as StudentData),
      is_primary: sp.is_primary,
    }))

    const childrenIds = children.map(c => c.id)

    // Get fee statistics
    let totalDueFees = 0
    if (childrenIds.length > 0) {
      const { data: invoices } = await adminSupabase
        .from('fee_invoices')
        .select('balance_amount, status')
        .in('student_id', childrenIds)
        .neq('status', 'paid')
        .neq('status', 'cancelled')

      totalDueFees = (invoices || []).reduce(
        (sum, inv) => sum + parseFloat(inv.balance_amount?.toString() || '0'),
        0
      )
    }

    // Get attendance statistics (last 30 days)
    let attendancePercent = 0
    if (childrenIds.length > 0) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: attendance } = await adminSupabase
        .from('student_attendance')
        .select('status')
        .in('student_id', childrenIds)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

      if (attendance && attendance.length > 0) {
        const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length
        attendancePercent = Math.round((presentCount / attendance.length) * 100)
      }
    }

    // Get recent fee payments for updates
    const recentUpdates: Array<{ type: string; message: string; time: string; date: string }> = []

    if (childrenIds.length > 0) {
      // Recent payments
      const { data: recentPayments } = await adminSupabase
        .from('fee_payments')
        .select(`
          amount,
          payment_date,
          fee_invoices (
            students (first_name)
          )
        `)
        .in('invoice_id',
          (await adminSupabase
            .from('fee_invoices')
            .select('id')
            .in('student_id', childrenIds)
          ).data?.map(i => i.id) || []
        )
        .order('payment_date', { ascending: false })
        .limit(3)

      recentPayments?.forEach(payment => {
        const feeInvoice = payment.fee_invoices as unknown as { students: { first_name: string } } | null
        const studentName = feeInvoice?.students?.first_name || 'Student'
        recentUpdates.push({
          type: 'payment',
          message: `Payment of ₹${parseFloat(payment.amount?.toString() || '0').toLocaleString()} received for ${studentName}`,
          time: formatTimeAgo(new Date(payment.payment_date)),
          date: payment.payment_date,
        })
      })

      // Pending fee reminders
      const { data: pendingInvoices } = await adminSupabase
        .from('fee_invoices')
        .select(`
          due_date,
          balance_amount,
          month,
          year,
          students (first_name)
        `)
        .in('student_id', childrenIds)
        .in('status', ['pending', 'partial', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(2)

      pendingInvoices?.forEach(inv => {
        const student = inv.students as unknown as { first_name: string } | null
        const studentName = student?.first_name || 'Student'
        const monthName = inv.month ? new Date(2024, inv.month - 1).toLocaleString('en-IN', { month: 'long' }) : ''
        recentUpdates.push({
          type: 'fee',
          message: `Fee of ₹${parseFloat(inv.balance_amount?.toString() || '0').toLocaleString()} due for ${studentName} (${monthName})`,
          time: `Due: ${new Date(inv.due_date).toLocaleDateString('en-IN')}`,
          date: inv.due_date,
        })
      })
    }

    // Sort updates by date
    recentUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      user: userData,
      parent,
      children,
      stats: {
        childrenCount: children.length,
        totalDueFees,
        attendancePercent,
      },
      recentUpdates: recentUpdates.slice(0, 5),
    })

  } catch (error) {
    console.error('Error in parent dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-IN')
}
