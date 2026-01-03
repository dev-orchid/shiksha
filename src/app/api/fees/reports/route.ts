import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('start_date') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]

    // Fetch all payments in date range
    const { data: payments, error: paymentsError } = await supabase
      .from('fee_payments')
      .select(`
        *,
        fee_invoices (
          id,
          student_id,
          total_amount,
          net_amount,
          balance_amount,
          status,
          month,
          year,
          students (
            id,
            current_class_id,
            classes:classes!current_class_id (id, name)
          )
        )
      `)
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
    }

    // Fetch all invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('fee_invoices')
      .select(`
        *,
        students (
          id,
          current_class_id,
          classes:classes!current_class_id (id, name)
        )
      `)

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
    }

    // Fetch fee categories
    const { data: categories } = await supabase
      .from('fee_categories')
      .select('id, name')

    // Fetch classes
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .order('name')

    // Calculate totals
    const totalCollected = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)

    const pendingInvoices = (invoices || []).filter(inv => inv.status === 'pending' || inv.status === 'partial')
    const overdueInvoices = (invoices || []).filter(inv => inv.status === 'overdue')

    const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0)
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0)

    const totalFees = totalCollected + totalPending + totalOverdue
    const collectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 1000) / 10 : 0

    // Calculate monthly trend (last 6 months)
    const monthlyTrend: Array<{ month: string; collected: number; pending: number }> = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // Get data for last 6 months
    const today = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthNum = monthDate.getMonth()
      const yearNum = monthDate.getFullYear()

      // Filter payments for this month
      const monthPayments = (payments || []).filter(p => {
        const paymentDate = new Date(p.payment_date)
        return paymentDate.getMonth() === monthNum && paymentDate.getFullYear() === yearNum
      })

      // Filter invoices for this month
      const monthInvoices = (invoices || []).filter(inv => {
        return inv.month === monthNum + 1 && inv.year === yearNum
      })

      const collected = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const pending = monthInvoices.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0)

      monthlyTrend.push({
        month: monthNames[monthNum],
        collected,
        pending,
      })
    }

    // Category wise collection (from invoice items if available, otherwise estimate)
    const categoryWise: Array<{ category: string; collected: number; percentage: number }> = []

    if (categories && categories.length > 0) {
      // Get invoice items to understand category breakdown
      const { data: invoiceItems } = await supabase
        .from('fee_invoice_items')
        .select(`
          *,
          fee_invoices!inner (id, paid_amount, net_amount, status)
        `)

      for (const category of categories) {
        const categoryItems = (invoiceItems || []).filter(item => item.fee_category_id === category.id)
        const totalCategoryAmount = categoryItems.reduce((sum, item) => sum + (item.net_amount || item.amount || 0), 0)

        // Estimate collected based on payment ratio
        const avgPaymentRatio = totalFees > 0 ? totalCollected / totalFees : 0
        const collected = Math.round(totalCategoryAmount * avgPaymentRatio)

        if (totalCategoryAmount > 0) {
          categoryWise.push({
            category: category.name,
            collected,
            percentage: totalCollected > 0 ? Math.round((collected / totalCollected) * 1000) / 10 : 0,
          })
        }
      }
    }

    // If no category data, provide a default
    if (categoryWise.length === 0) {
      categoryWise.push({
        category: 'General Fee',
        collected: totalCollected,
        percentage: 100,
      })
    }

    // Class wise collection
    const classWise: Array<{ className: string; collected: number; pending: number }> = []

    if (classes && classes.length > 0) {
      for (const cls of classes) {
        // Filter invoices by class
        const classInvoices = (invoices || []).filter(inv =>
          inv.students?.current_class_id === cls.id
        )

        // Filter payments by class
        const classPayments = (payments || []).filter(p =>
          p.fee_invoices?.students?.current_class_id === cls.id
        )

        const collected = classPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
        const pending = classInvoices.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0)

        if (collected > 0 || pending > 0) {
          classWise.push({
            className: cls.name,
            collected,
            pending,
          })
        }
      }
    }

    // Sort class wise by collected (descending)
    classWise.sort((a, b) => b.collected - a.collected)

    return NextResponse.json({
      totalCollected,
      totalPending,
      totalOverdue,
      collectionRate,
      monthlyTrend,
      categoryWise,
      classWise,
    })
  } catch (error) {
    console.error('Error generating fee reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
