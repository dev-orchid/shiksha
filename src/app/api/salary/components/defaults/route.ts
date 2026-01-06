import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils'

const DEFAULT_COMPONENTS = [
  // Earnings
  { name: 'Basic Salary', component_type: 'earning', is_percentage: false, is_taxable: true },
  { name: 'House Rent Allowance (HRA)', component_type: 'earning', is_percentage: true, is_taxable: true, default_value: 40 },
  { name: 'Dearness Allowance (DA)', component_type: 'earning', is_percentage: true, is_taxable: true, default_value: 10 },
  { name: 'Conveyance Allowance', component_type: 'earning', is_percentage: false, is_taxable: false, default_value: 1600 },
  { name: 'Medical Allowance', component_type: 'earning', is_percentage: false, is_taxable: false, default_value: 1250 },
  { name: 'Special Allowance', component_type: 'earning', is_percentage: false, is_taxable: true },
  // Deductions
  { name: 'Provident Fund (PF)', component_type: 'deduction', is_percentage: true, is_taxable: false, default_value: 12 },
  { name: 'Employee State Insurance (ESI)', component_type: 'deduction', is_percentage: true, is_taxable: false, default_value: 0.75 },
  { name: 'Professional Tax', component_type: 'deduction', is_percentage: false, is_taxable: false, default_value: 200 },
  { name: 'TDS', component_type: 'deduction', is_percentage: true, is_taxable: false },
  { name: 'Loan Recovery', component_type: 'deduction', is_percentage: false, is_taxable: false },
]

// POST - Create default salary components for a school
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Use authenticated user's school_id
    const school_id = authUser.schoolId

    // Check existing components
    const { data: existingComponents } = await supabase
      .from('salary_components')
      .select('name')
      .eq('school_id', school_id)

    const existingNames = new Set(existingComponents?.map(c => c.name.toLowerCase()) || [])

    // Filter out components that already exist
    const newComponents = DEFAULT_COMPONENTS.filter(
      c => !existingNames.has(c.name.toLowerCase())
    ).map(c => ({
      ...c,
      school_id,
      is_active: true,
    }))

    if (newComponents.length === 0) {
      return NextResponse.json({
        message: 'All default components already exist',
        created: 0
      })
    }

    // Insert new components
    const { data, error } = await supabase
      .from('salary_components')
      .insert(newComponents)
      .select()

    if (error) {
      console.error('Error creating default components:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Created ${data?.length || 0} default components`,
      created: data?.length || 0,
      data
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating default components:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
