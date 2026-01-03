import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parse } from 'csv-parse/sync'

interface ImportRow {
  admission_number: string
  first_name: string
  last_name?: string
  date_of_birth: string
  gender?: string
  class_name?: string
  section_name?: string
  roll_number?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  blood_group?: string
  admission_date?: string
  father_name?: string
  father_phone?: string
  mother_name?: string
  mother_phone?: string
}

interface ImportError {
  row: number
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content
    const content = await file.text()

    // Parse CSV
    let records: ImportRow[]
    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch {
      return NextResponse.json({ error: 'Invalid CSV format' }, { status: 400 })
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 })
    }

    // Get school ID
    const { data: schools } = await supabase
      .from('schools')
      .select('id')
      .limit(1)
      .single()

    if (!schools) {
      return NextResponse.json({ error: 'No school configured' }, { status: 400 })
    }

    const schoolId = schools.id

    // Get all classes and sections for mapping
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId)

    const { data: sections } = await supabase
      .from('sections')
      .select('id, name, class_id')

    const classMap = new Map(classes?.map(c => [c.name.toLowerCase(), c.id]) || [])
    const sectionMap = new Map(
      sections?.map(s => [`${s.class_id}-${s.name.toLowerCase()}`, s.id]) || []
    )

    const errors: ImportError[] = []
    let successCount = 0

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNumber = i + 2 // +2 because row 1 is header, and we're 0-indexed

      try {
        // Validate required fields
        if (!row.admission_number) {
          errors.push({ row: rowNumber, message: 'Admission number is required' })
          continue
        }
        if (!row.first_name) {
          errors.push({ row: rowNumber, message: 'First name is required' })
          continue
        }
        if (!row.date_of_birth) {
          errors.push({ row: rowNumber, message: 'Date of birth is required' })
          continue
        }

        // Map class and section names to IDs
        let classId: string | null = null
        let sectionId: string | null = null

        if (row.class_name) {
          classId = classMap.get(row.class_name.toLowerCase()) || null
          if (!classId) {
            errors.push({ row: rowNumber, message: `Class "${row.class_name}" not found` })
            continue
          }

          if (row.section_name) {
            sectionId = sectionMap.get(`${classId}-${row.section_name.toLowerCase()}`) || null
            if (!sectionId) {
              errors.push({ row: rowNumber, message: `Section "${row.section_name}" not found for class "${row.class_name}"` })
              continue
            }
          }
        }

        // Prepare student data
        const studentData = {
          school_id: schoolId,
          admission_number: row.admission_number,
          first_name: row.first_name,
          last_name: row.last_name || null,
          date_of_birth: row.date_of_birth,
          gender: row.gender?.toLowerCase() || null,
          current_class_id: classId,
          current_section_id: sectionId,
          roll_number: row.roll_number || null,
          phone: row.phone || null,
          email: row.email || null,
          address: row.address || null,
          city: row.city || null,
          state: row.state || null,
          pincode: row.pincode || null,
          blood_group: row.blood_group || null,
          admission_date: row.admission_date || new Date().toISOString().split('T')[0],
          status: 'active',
        }

        // Insert student
        const { error: insertError } = await supabase
          .from('students')
          .insert(studentData)

        if (insertError) {
          if (insertError.code === '23505') {
            errors.push({ row: rowNumber, message: `Admission number "${row.admission_number}" already exists` })
          } else {
            errors.push({ row: rowNumber, message: insertError.message })
          }
          continue
        }

        successCount++
      } catch (err) {
        errors.push({ row: rowNumber, message: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: errors.length,
      errors: errors.slice(0, 50), // Limit errors returned
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import students' }, { status: 500 })
  }
}
