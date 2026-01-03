import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - Get school settings (returns the first/primary school)
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .limit(1)
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

// PUT - Update school settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // First check if a school exists
    const { data: existingSchool } = await supabase
      .from('schools')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existingSchool) {
      // Update existing school
      const { data, error } = await supabase
        .from('schools')
        .update(body)
        .eq('id', existingSchool.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data
    } else {
      // Create new school
      const { data, error } = await supabase
        .from('schools')
        .insert(body)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error updating school settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
