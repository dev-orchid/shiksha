import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

// GET - Get school settings for the authenticated user's school
export async function GET() {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', authUser.schoolId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching school settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update school settings for the authenticated user's school
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    console.log('PUT /api/settings/school - authUser:', authUser)

    if (!authUser) {
      console.log('PUT /api/settings/school - No auth user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const body = await request.json()

    // Clean up the data - convert empty strings to null for optional fields
    // and handle type conversions
    const updateData: Record<string, unknown> = {}

    if (body.name) updateData.name = body.name
    if (body.code) updateData.code = body.code
    if (body.address !== undefined) updateData.address = body.address || null
    if (body.city !== undefined) updateData.city = body.city || null
    if (body.state !== undefined) updateData.state = body.state || null
    if (body.pincode !== undefined) updateData.pincode = body.pincode || null
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.email !== undefined) updateData.email = body.email || null
    if (body.website !== undefined) updateData.website = body.website || null
    if (body.principal_name !== undefined) updateData.principal_name = body.principal_name || null
    if (body.board_affiliation !== undefined) updateData.board_affiliation = body.board_affiliation || null

    // Handle established_year as INTEGER (convert string to number or null)
    if (body.established_year !== undefined) {
      const year = parseInt(body.established_year, 10)
      updateData.established_year = isNaN(year) ? null : year
    }

    console.log('PUT /api/settings/school - Updating school:', authUser.schoolId)
    console.log('PUT /api/settings/school - UpdateData:', JSON.stringify(updateData))

    // Update the authenticated user's school
    const { data, error } = await supabase
      .from('schools')
      .update(updateData)
      .eq('id', authUser.schoolId)
      .select()
      .single()

    if (error) {
      console.error('PUT /api/settings/school - DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('PUT /api/settings/school - Success:', data)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating school settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
