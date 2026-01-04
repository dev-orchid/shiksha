import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { z } from 'zod'

const processSchema = z.object({
  school_id: z.string().uuid(),
  payroll_ids: z.array(z.string().uuid()).min(1),
  action: z.enum(['process', 'pay', 'cancel']).default('process'),
  payment_mode: z.enum(['bank_transfer', 'cheque', 'cash']).optional(),
  payment_date: z.string().optional(),
  remarks: z.string().optional(),
})

// POST - Process/pay payroll for selected staff
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const body = await request.json()

    const validatedData = processSchema.parse(body)
    const { school_id, payroll_ids, action, payment_mode, payment_date, remarks } = validatedData

    // Get current user from users table (not just auth)
    const { data: { user: authUser } } = await supabase.auth.getUser()

    // Get the user record from users table
    let userId = null
    if (authUser?.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single()
      userId = userData?.id || null
    }

    if (action === 'process') {
      // Update payroll status to 'processed'
      const updateData: any = {
        status: 'processed',
        processed_at: new Date().toISOString(),
      }
      // Only set processed_by if user exists in users table
      if (userId) {
        updateData.processed_by = userId
      }

      const { data, error } = await supabase
        .from('salary_payroll')
        .update(updateData)
        .in('id', payroll_ids)
        .eq('school_id', school_id)
        .eq('status', 'pending')
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        data,
        message: `${data?.length || 0} payroll records processed successfully`,
      })
    }

    if (action === 'pay') {
      if (!payment_mode) {
        return NextResponse.json({ error: 'payment_mode is required for payment' }, { status: 400 })
      }

      // Get payroll records to process payment
      const { data: payrollRecords, error: fetchError } = await supabase
        .from('salary_payroll')
        .select('id, net_salary')
        .in('id', payroll_ids)
        .eq('school_id', school_id)
        .in('status', ['pending', 'processed'])

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }

      // Create payment records
      const paymentRecords = payrollRecords?.map(record => {
        const paymentRecord: any = {
          school_id,
          payroll_id: record.id,
          payment_date: payment_date || new Date().toISOString().split('T')[0],
          amount: record.net_salary,
          payment_mode,
          remarks,
        }
        if (userId) {
          paymentRecord.paid_by = userId
        }
        return paymentRecord
      }) || []

      if (paymentRecords.length > 0) {
        const { error: paymentError } = await supabase
          .from('salary_payments')
          .insert(paymentRecords)

        if (paymentError) {
          return NextResponse.json({ error: paymentError.message }, { status: 500 })
        }
      }

      // Update payroll status to 'paid'
      const paidUpdateData: any = {
        status: 'paid',
        processed_at: new Date().toISOString(),
      }
      if (userId) {
        paidUpdateData.processed_by = userId
      }

      const { data, error } = await supabase
        .from('salary_payroll')
        .update(paidUpdateData)
        .in('id', payroll_ids)
        .eq('school_id', school_id)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        data,
        message: `${data?.length || 0} salary payments completed successfully`,
      })
    }

    if (action === 'cancel') {
      // Update payroll status to 'cancelled'
      const { data, error } = await supabase
        .from('salary_payroll')
        .update({
          status: 'cancelled',
        })
        .in('id', payroll_ids)
        .eq('school_id', school_id)
        .neq('status', 'paid')
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        data,
        message: `${data?.length || 0} payroll records cancelled`,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error processing payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
