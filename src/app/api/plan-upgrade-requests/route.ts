import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()

    const {
      requested_plan,
      contact_person,
      contact_phone,
      contact_email,
      additional_notes,
    } = body

    // Validate required fields
    if (!requested_plan || !contact_person || !contact_phone || !contact_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate plan type
    const validPlans = ['starter', 'professional', 'enterprise']
    if (!validPlans.includes(requested_plan)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    // Create upgrade request
    const { data, error } = await supabase
      .from('plan_upgrade_requests')
      .insert({
        school_id: authUser.schoolId,
        requested_plan,
        contact_person,
        contact_phone,
        contact_email,
        additional_notes: additional_notes || null,
        status: 'pending',
        requested_by: authUser.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating upgrade request:', error)
      return NextResponse.json(
        { error: 'Failed to create upgrade request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Upgrade request submitted successfully',
      data,
    })
  } catch (error) {
    console.error('Error in plan upgrade request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('plan_upgrade_requests')
      .select('*')
      .eq('school_id', authUser.schoolId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching upgrade requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch upgrade requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in get upgrade requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
