import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('start_date') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]
    const reportType = searchParams.get('type') || 'monthly'

    // Fetch payments with details for user's school
    const { data: payments } = await supabase
      .from('fee_payments')
      .select(`
        *,
        fee_invoices (
          id,
          invoice_number,
          month,
          year,
          total_amount,
          net_amount,
          students (
            id,
            first_name,
            last_name,
            admission_number,
            classes:classes!current_class_id (id, name)
          )
        )
      `)
      .eq('school_id', authUser.schoolId)
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .order('payment_date', { ascending: false })

    // Generate CSV
    const headers = [
      'Receipt No',
      'Payment Date',
      'Student Name',
      'Admission No',
      'Class',
      'Invoice No',
      'Fee Period',
      'Amount Paid',
      'Payment Mode',
      'Transaction ID',
    ]

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const rows = (payments || []).map(payment => {
      const invoice = payment.fee_invoices
      const student = invoice?.students
      const feePeriod = invoice ? `${monthNames[invoice.month - 1]} ${invoice.year}` : ''

      return [
        payment.receipt_number || '',
        new Date(payment.payment_date).toLocaleDateString('en-IN'),
        student ? `${student.first_name} ${student.last_name || ''}` : '',
        student?.admission_number || '',
        student?.classes?.name || '',
        invoice?.invoice_number || '',
        feePeriod,
        payment.amount || 0,
        payment.payment_mode || '',
        payment.transaction_id || '',
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="fee_report_${reportType}_${startDate}_${endDate}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting fee report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
