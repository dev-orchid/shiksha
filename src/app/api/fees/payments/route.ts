import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List payments
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const invoiceId = searchParams.get('invoice_id')
    const studentId = searchParams.get('student_id')
    const schoolId = searchParams.get('school_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const paymentMode = searchParams.get('payment_mode')

    const offset = (page - 1) * limit

    let query = supabase
      .from('fee_payments')
      .select(`
        *,
        fee_invoices (
          id,
          invoice_number,
          total_amount,
          net_amount,
          student_id,
          students (
            id,
            first_name,
            last_name,
            admission_number,
            classes:classes!current_class_id (id, name),
            sections:sections!current_section_id (id, name)
          )
        )
      `, { count: 'exact' })

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    if (invoiceId) {
      query = query.eq('invoice_id', invoiceId)
    }

    if (paymentMode) {
      query = query.eq('payment_mode', paymentMode)
    }

    if (startDate && endDate) {
      query = query.gte('payment_date', startDate).lte('payment_date', endDate)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter by student if specified and add default status
    let filteredData = data || []
    if (studentId && data) {
      filteredData = data.filter((item: any) => item.fee_invoices?.student_id === studentId)
    }

    // Add status field if not present (for backward compatibility)
    filteredData = filteredData.map((payment: any) => ({
      ...payment,
      status: payment.status || 'completed',
    }))

    return NextResponse.json({
      data: filteredData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Record payment
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // Validate required fields
    if (!body.invoice_id || !body.amount || !body.payment_mode) {
      return NextResponse.json(
        { error: 'invoice_id, amount, and payment_mode are required' },
        { status: 400 }
      )
    }

    // Get the invoice to validate payment amount
    const { data: invoice, error: invoiceError } = await supabase
      .from('fee_invoices')
      .select('*')
      .eq('id', body.invoice_id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'This invoice has already been fully paid' },
        { status: 400 }
      )
    }

    if (body.amount > invoice.balance_amount) {
      return NextResponse.json(
        { error: `Payment amount cannot exceed the balance amount of ${invoice.balance_amount}` },
        { status: 400 }
      )
    }

    // Get school_id if not provided
    const schoolId = body.school_id || invoice.school_id

    // Generate receipt number if not provided
    const receiptNumber = body.receipt_number || `RCP-${Date.now()}`

    const paymentData = {
      school_id: schoolId,
      invoice_id: body.invoice_id,
      receipt_number: receiptNumber,
      amount: body.amount,
      payment_date: body.payment_date || new Date().toISOString().split('T')[0],
      payment_mode: body.payment_mode,
      transaction_id: body.transaction_id || null,
      cheque_number: body.cheque_number || null,
      cheque_date: body.cheque_date || null,
      bank_name: body.bank_name || null,
      remarks: body.remarks || null,
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('fee_payments')
      .insert(paymentData)
      .select()
      .single()

    if (paymentError) {
      if (paymentError.code === '23505') {
        return NextResponse.json(
          { error: 'A payment with this receipt number already exists' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: paymentError.message }, { status: 500 })
    }

    // Update invoice amounts
    const newPaidAmount = (invoice.paid_amount || 0) + body.amount
    const newBalanceAmount = (invoice.net_amount || invoice.total_amount) - newPaidAmount
    const newStatus = newBalanceAmount <= 0 ? 'paid' : 'partial'

    const { error: updateError } = await supabase
      .from('fee_invoices')
      .update({
        paid_amount: newPaidAmount,
        balance_amount: Math.max(0, newBalanceAmount),
        status: newStatus,
      })
      .eq('id', body.invoice_id)

    if (updateError) {
      await supabase.from('fee_payments').delete().eq('id', payment.id)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: payment,
      invoice: {
        paid_amount: newPaidAmount,
        balance_amount: Math.max(0, newBalanceAmount),
        status: newStatus,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
