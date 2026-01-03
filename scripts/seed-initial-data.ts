import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedInitialData() {
  console.log('Starting to seed initial data...')

  // 1. Create or get school
  console.log('Creating school...')
  const { data: existingSchool } = await supabase
    .from('schools')
    .select('id')
    .limit(1)
    .single()

  let schoolId: string

  if (existingSchool) {
    schoolId = existingSchool.id
    console.log('Using existing school:', schoolId)
  } else {
    const { data: newSchool, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: 'XYZ Public School',
        code: 'XYZ001',
        address: '123 Education Street',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        phone: '9876543210',
        email: 'info@xyzschool.edu',
        website: 'https://xyzschool.edu',
        principal_name: 'Dr. Rajesh Kumar',
        established_year: 2010,
        board_affiliation: 'CBSE',
      })
      .select()
      .single()

    if (schoolError) {
      console.error('Error creating school:', schoolError)
      return
    }

    schoolId = newSchool.id
    console.log('Created new school:', schoolId)
  }

  // 2. Create classes
  console.log('Creating classes...')
  const classNames = [
    { name: 'Nursery', grade: 0 },
    { name: 'LKG', grade: 1 },
    { name: 'UKG', grade: 2 },
    { name: 'Class 1', grade: 3 },
    { name: 'Class 2', grade: 4 },
    { name: 'Class 3', grade: 5 },
    { name: 'Class 4', grade: 6 },
    { name: 'Class 5', grade: 7 },
    { name: 'Class 6', grade: 8 },
    { name: 'Class 7', grade: 9 },
    { name: 'Class 8', grade: 10 },
    { name: 'Class 9', grade: 11 },
    { name: 'Class 10', grade: 12 },
    { name: 'Class 11', grade: 13 },
    { name: 'Class 12', grade: 14 },
  ]

  const classIds: Record<string, string> = {}

  for (const cls of classNames) {
    // Check if class already exists
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id')
      .eq('school_id', schoolId)
      .eq('name', cls.name)
      .single()

    if (existingClass) {
      classIds[cls.name] = existingClass.id
      console.log(`Class ${cls.name} already exists`)
    } else {
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({
          school_id: schoolId,
          name: cls.name,
          grade_level: cls.grade,
          is_active: true,
        })
        .select()
        .single()

      if (classError) {
        console.error(`Error creating class ${cls.name}:`, classError)
        continue
      }

      classIds[cls.name] = newClass.id
      console.log(`Created class: ${cls.name}`)
    }
  }

  // 3. Create sections for each class
  console.log('Creating sections...')
  const sectionNames = ['A', 'B', 'C']

  for (const [className, classId] of Object.entries(classIds)) {
    for (const sectionName of sectionNames) {
      // Check if section already exists
      const { data: existingSection } = await supabase
        .from('sections')
        .select('id')
        .eq('class_id', classId)
        .eq('name', sectionName)
        .single()

      if (existingSection) {
        console.log(`Section ${className}-${sectionName} already exists`)
        continue
      }

      const { error: sectionError } = await supabase
        .from('sections')
        .insert({
          school_id: schoolId,
          class_id: classId,
          name: sectionName,
          capacity: 40,
          is_active: true,
        })

      if (sectionError) {
        console.error(`Error creating section ${className}-${sectionName}:`, sectionError)
        continue
      }

      console.log(`Created section: ${className}-${sectionName}`)
    }
  }

  // 4. Create academic year
  console.log('Creating academic year...')
  const currentYear = new Date().getFullYear()
  const academicYearName = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`

  const { data: existingYear } = await supabase
    .from('academic_years')
    .select('id')
    .eq('school_id', schoolId)
    .eq('name', academicYearName)
    .single()

  if (!existingYear) {
    const { error: yearError } = await supabase
      .from('academic_years')
      .insert({
        school_id: schoolId,
        name: academicYearName,
        start_date: `${currentYear}-04-01`,
        end_date: `${currentYear + 1}-03-31`,
        is_current: true,
      })

    if (yearError) {
      console.error('Error creating academic year:', yearError)
    } else {
      console.log(`Created academic year: ${academicYearName}`)
    }
  } else {
    console.log(`Academic year ${academicYearName} already exists`)
  }

  console.log('\n✅ Seed data created successfully!')
  console.log(`School ID: ${schoolId}`)
  console.log('Classes created:', Object.keys(classIds).length)
  console.log('Sections created: 3 per class (A, B, C)')
}

seedInitialData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
