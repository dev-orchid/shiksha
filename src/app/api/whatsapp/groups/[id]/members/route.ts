import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { z } from 'zod'

const memberSchema = z.object({
  member_type: z.enum(['student', 'parent', 'teacher', 'staff', 'custom']),
  student_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  phone_number: z.string().min(10).optional(),
  name: z.string().optional(),
})

const bulkMemberSchema = z.object({
  members: z.array(memberSchema),
})

// GET - List group members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createApiClient()

    // First try with is_active filter, then without
    let { data, error } = await supabase
      .from('whatsapp_group_members')
      .select('*')
      .eq('group_id', id)

    console.log('[Members API] Raw query result:', { data, error })

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.warn('whatsapp_group_members table does not exist yet')
        return NextResponse.json({ data: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If we have data, try to get student/user details
    if (data && data.length > 0) {
      const studentIds = data.filter(m => m.student_id).map(m => m.student_id)

      let studentsMap: Record<string, { first_name: string; last_name: string; phone: string }> = {}
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('students')
          .select('id, first_name, last_name, phone')
          .in('id', studentIds)

        if (students) {
          for (const s of students) {
            studentsMap[s.id] = s
          }
        }
      }

      // Attach student info to members
      data = data.map(m => ({
        ...m,
        students: m.student_id ? studentsMap[m.student_id] : null
      }))
    }

    // Transform data for easier consumption
    const members = (data || []).map(member => ({
      id: member.id,
      member_type: member.member_type,
      phone_number: member.phone_number || member.students?.phone || null,
      name: member.name ||
        (member.students ? `${member.students.first_name} ${member.students.last_name || ''}`.trim() : null) ||
        (member.users ? `${member.users.first_name || ''} ${member.users.last_name || ''}`.trim() : null),
      student_id: member.student_id,
      user_id: member.user_id,
      student: member.students,
      user: member.users,
      added_at: member.added_at,
    }))

    return NextResponse.json({ data: members })
  } catch (error) {
    console.error('Error fetching group members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add member(s) to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createApiClient()
    const body = await request.json()

    // Check if bulk add or single add
    let membersToAdd: z.infer<typeof memberSchema>[] = []

    if (body.members) {
      const validated = bulkMemberSchema.parse(body)
      membersToAdd = validated.members
    } else {
      const validated = memberSchema.parse(body)
      membersToAdd = [validated]
    }

    // Prepare members for insertion
    const insertData = membersToAdd.map(member => ({
      group_id: id,
      member_type: member.member_type,
      student_id: member.student_id || null,
      user_id: member.user_id || null,
      phone_number: member.phone_number || null,
      name: member.name || null,
      is_active: true,
    }))

    console.log('[Members API] Inserting members:', insertData)

    // Use insert instead of upsert - the UI already filters out existing members
    const { data, error } = await supabase
      .from('whatsapp_group_members')
      .insert(insertData)
      .select()

    console.log('[Members API] Insert result:', { data, error })

    if (error) {
      // Handle duplicate key error gracefully
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'Some members are already in this group',
          details: error.message
        }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      message: `${data?.length || 0} member(s) added successfully`
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error adding group members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove member from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createApiClient()
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('member_id')

    if (!memberId) {
      return NextResponse.json({ error: 'member_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('whatsapp_group_members')
      .delete()
      .eq('id', memberId)
      .eq('group_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing group member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
