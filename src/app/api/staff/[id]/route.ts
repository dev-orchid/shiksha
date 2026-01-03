import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - Get single staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('staff')
      .select(`
        *,
        department:departments!department_id (id, name),
        school:schools!school_id (id, name),
        user:users!user_id (id, email, role),
        teacher_assignments (
          id,
          class_id,
          section_id,
          subject_id,
          is_class_teacher,
          classes (id, name),
          sections (id, name),
          subjects (id, name)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const body = await request.json()

    // Map form fields to database fields
    const updateData: Record<string, unknown> = {}

    if (body.first_name !== undefined) updateData.first_name = body.first_name
    if (body.last_name !== undefined) updateData.last_name = body.last_name || null
    if (body.date_of_birth !== undefined) updateData.date_of_birth = body.date_of_birth || null
    if (body.gender !== undefined) updateData.gender = body.gender || null
    if (body.department_id !== undefined) updateData.department_id = body.department_id || null
    if (body.designation !== undefined) updateData.designation = body.designation
    if (body.highest_qualification !== undefined) updateData.highest_qualification = body.highest_qualification
    if (body.qualification !== undefined) updateData.highest_qualification = body.qualification
    if (body.specialization !== undefined) updateData.specialization = body.specialization || null
    if (body.experience_years !== undefined) updateData.experience_years = body.experience_years || 0
    if (body.joining_date !== undefined) updateData.joining_date = body.joining_date
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.email !== undefined) updateData.email = body.email || null
    if (body.address !== undefined) updateData.address = body.address || null
    if (body.city !== undefined) updateData.city = body.city || null
    if (body.state !== undefined) updateData.state = body.state || null
    if (body.pincode !== undefined) updateData.pincode = body.pincode || null
    if (body.blood_group !== undefined) updateData.blood_group = body.blood_group || null
    if (body.emergency_contact_name !== undefined) updateData.emergency_contact_name = body.emergency_contact_name || null
    if (body.emergency_contact_phone !== undefined) updateData.emergency_contact_phone = body.emergency_contact_phone || null
    if (body.bank_account_number !== undefined) updateData.bank_account_number = body.bank_account_number || null
    if (body.bank_name !== undefined) updateData.bank_name = body.bank_name || null
    if (body.ifsc_code !== undefined) updateData.ifsc_code = body.ifsc_code || null
    if (body.employee_type !== undefined) updateData.employee_type = body.employee_type
    if (body.staff_type !== undefined) updateData.employee_type = body.staff_type
    if (body.employment_type !== undefined) updateData.employment_type = body.employment_type || null
    if (body.status !== undefined) updateData.status = body.status

    const { data, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete staff member (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('staff')
      .update({ status: 'inactive' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Staff member deleted successfully', data })
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
