import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - Get single payment with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('fee_payments')
      .select(`
        *,
        fee_invoices (
          id,
          invoice_number,
          total_amount,
          net_amount,
          discount_amount,
          paid_amount,
          balance_amount,
          due_date,
          status,
          month,
          year,
          students (
            id,
            first_name,
            last_name,
            admission_number,
            classes:classes!current_class_id (id, name),
            sections:sections!current_section_id (id, name)
          )
        ),
        schools (
          id,
          name,
          address,
          phone,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
