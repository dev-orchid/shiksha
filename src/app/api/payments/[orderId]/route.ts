import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const supabase = createAdminClient()

    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        fee_invoices (
          id,
          invoice_number,
          total_amount,
          net_amount,
          paid_amount,
          balance_amount,
          status
        ),
        students (
          id,
          first_name,
          last_name,
          admission_number
        )
      `)
      .eq('order_id', orderId)
      .single()

    if (error || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: transaction })

  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
