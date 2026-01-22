import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG and GIF are allowed' }, { status: 400 })
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 })
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)

      // Check if bucket doesn't exist
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('bucket')) {
        return NextResponse.json({
          error: 'Avatar storage is not configured. Please contact administrator.'
        }, { status: 500 })
      }

      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Update user metadata with new avatar URL
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl,
      },
    })

    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Delete old avatar if exists (optional cleanup)
    const oldAvatarUrl = user.user_metadata?.avatar_url
    if (oldAvatarUrl && oldAvatarUrl.includes('avatars/')) {
      try {
        const oldPath = oldAvatarUrl.split('avatars/').pop()
        if (oldPath && oldPath !== fileName) {
          await supabase.storage.from('avatars').remove([`avatars/${oldPath}`])
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    return NextResponse.json({
      success: true,
      avatarUrl,
      message: 'Avatar uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
