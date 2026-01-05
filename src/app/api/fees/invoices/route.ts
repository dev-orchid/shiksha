import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - List invoices with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const studentId = searchParams.get('student_id')
    const classId = searchParams.get('class_id')
    const status = searchParams.get('status')
    const schoolId = searchParams.get('school_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    const offset = (page - 1) * limit

    let query = supabase
      .from('fee_invoices')
      .select(`
        *,
        students (
          id,
          first_name,
          last_name,
          admission_number,
          current_class_id,
          current_section_id,
          classes:classes!current_class_id (id, name),
          sections:sections!current_section_id (id, name)
        )
      `, { count: 'exact' })

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (status) {
      // Support comma-separated status values (e.g., "pending,partial")
      const statuses = status.split(',').map(s => s.trim())
      if (statuses.length > 1) {
        query = query.in('status', statuses)
      } else {
        query = query.eq('status', status)
      }
    }

    if (startDate && endDate) {
      query = query.gte('invoice_date', startDate).lte('invoice_date', endDate)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter by class if specified
    let filteredData = data
    if (classId && data) {
      filteredData = data.filter((item: any) => item.students?.current_class_id === classId)
    }

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
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // Validate required fields
    if (!body.student_id || !body.due_date || !body.total_amount) {
      return NextResponse.json(
        { error: 'student_id, due_date, and total_amount are required' },
        { status: 400 }
      )
    }

    const month = body.month || new Date().getMonth() + 1
    const year = body.year || new Date().getFullYear()

    // Check if invoice already exists for this student/month/year
    // Use .limit(1) instead of .maybeSingle() to handle cases where duplicates already exist
    const { data: existingInvoices } = await supabase
      .from('fee_invoices')
      .select('id, invoice_number, status')
      .eq('student_id', body.student_id)
      .eq('month', month)
      .eq('year', year)
      .limit(1)

    if (existingInvoices && existingInvoices.length > 0) {
      return NextResponse.json(
        {
          error: 'Invoice already exists for this student for the selected month/year',
          existing_invoice: existingInvoices[0],
          skipped: true,
        },
        { status: 409 }
      )
    }

    // Get school_id and academic_year_id if not provided
    let schoolId = body.school_id
    let academicYearId = body.academic_year_id

    if (!schoolId || !academicYearId) {
      const { data: schools } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .single()
      schoolId = schoolId || schools?.id

      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .limit(1)
        .single()
      academicYearId = academicYearId || academicYear?.id
    }

    // Generate invoice number if not provided
    const invoiceNumber = body.invoice_number || `INV-${Date.now()}`

    const invoiceData = {
      school_id: schoolId,
      academic_year_id: academicYearId,
      student_id: body.student_id,
      invoice_number: invoiceNumber,
      month: body.month || new Date().getMonth() + 1,
      year: body.year || new Date().getFullYear(),
      total_amount: body.total_amount,
      discount_amount: body.discount_amount || 0,
      late_fee: body.late_fee || 0,
      net_amount: body.net_amount || body.total_amount - (body.discount_amount || 0),
      paid_amount: 0,
      balance_amount: body.net_amount || body.total_amount - (body.discount_amount || 0),
      due_date: body.due_date,
      status: 'pending',
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('fee_invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (invoiceError) {
      if (invoiceError.code === '23505') {
        return NextResponse.json(
          { error: 'An invoice with this number already exists' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: invoiceError.message }, { status: 500 })
    }

    // Insert invoice items if provided
    if (body.items && body.items.length > 0) {
      const invoiceItems = body.items.map((item: any) => ({
        invoice_id: invoice.id,
        fee_category_id: item.fee_category_id,
        description: item.description || '',
        amount: item.amount,
        discount_amount: item.discount_amount || 0,
        net_amount: item.amount - (item.discount_amount || 0),
      }))

      const { error: itemsError } = await supabase
        .from('fee_invoice_items')
        .insert(invoiceItems)

      if (itemsError) {
        await supabase.from('fee_invoices').delete().eq('id', invoice.id)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
