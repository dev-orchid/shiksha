import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'
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
    const authUser = await getAuthenticatedUserSchool()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    // First verify the group belongs to the user's school
    const { data: group, error: groupError } = await supabase
      .from('whatsapp_groups')
      .select('school_id')
      .eq('id', id)
      .single()

    console.log('[Members API] Group lookup:', { id, group, groupError, authSchoolId: authUser.schoolId })

    if (!group || group.school_id !== authUser.schoolId) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Fetch members - try without any filters first to debug
    let { data, error } = await supabase
      .from('whatsapp_group_members')
      .select('*')
      .eq('group_id', id)

    console.log('[Members API] Members query for group_id:', id)
    console.log('[Members API] Raw query result:', { dataCount: data?.length, data, error })

    // Debug: check if any members exist in the table at all
    if (!data || data.length === 0) {
      const { data: allMembers, error: allError } = await supabase
        .from('whatsapp_group_members')
        .select('id, group_id, student_id, phone_number')
        .limit(10)
      console.log('[Members API] Debug - All members in table:', { allMembers, allError })
    }

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
    const authUser = await getAuthenticatedUserSchool()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    // Verify the group belongs to the user's school
    const { data: group } = await supabase
      .from('whatsapp_groups')
      .select('school_id')
      .eq('id', id)
      .single()

    if (!group || group.school_id !== authUser.schoolId) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

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

    // Get existing members to check for duplicates
    const { data: existingMembers } = await supabase
      .from('whatsapp_group_members')
      .select('student_id, phone_number')
      .eq('group_id', id)

    const existingStudentIds = new Set((existingMembers || []).filter(m => m.student_id).map(m => m.student_id))
    // Only track phone numbers for custom members (those without student_id)
    const existingCustomPhones = new Set(
      (existingMembers || [])
        .filter(m => !m.student_id && m.phone_number)
        .map(m => m.phone_number)
    )

    // Filter out members that already exist
    // For students: check by student_id (siblings with same phone are allowed)
    // For custom: check by phone_number
    const newMembers = membersToAdd.filter(member => {
      if (member.student_id) {
        // Student member - check by student_id only
        return !existingStudentIds.has(member.student_id)
      } else if (member.phone_number) {
        // Custom member - check by phone_number
        return !existingCustomPhones.has(member.phone_number)
      }
      return true
    })

    if (newMembers.length === 0) {
      return NextResponse.json({
        error: 'All selected members are already in this group',
        alreadyExists: true
      }, { status: 409 })
    }

    // Prepare members for insertion
    const insertData = newMembers.map(member => ({
      group_id: id,
      member_type: member.member_type,
      student_id: member.student_id || null,
      user_id: member.user_id || null,
      phone_number: member.phone_number || null,
      name: member.name || null,
      is_active: true,
    }))

    console.log('[Members API] Inserting members:', insertData)

    const { data, error } = await supabase
      .from('whatsapp_group_members')
      .insert(insertData)
      .select()

    console.log('[Members API] Insert result:', { data, error })

    if (error) {
      console.error('[Members API] Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const skipped = membersToAdd.length - newMembers.length
    return NextResponse.json({
      data,
      message: `${data?.length || 0} member(s) added successfully${skipped > 0 ? `, ${skipped} already existed` : ''}`
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
    const authUser = await getAuthenticatedUserSchool()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    // Verify the group belongs to the user's school
    const { data: group } = await supabase
      .from('whatsapp_groups')
      .select('school_id')
      .eq('id', id)
      .single()

    if (!group || group.school_id !== authUser.schoolId) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

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
