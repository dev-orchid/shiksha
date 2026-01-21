import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils';
import { encrypt, decrypt, isEncrypted } from '@/lib/utils/encryption';

// GET - Get Razorpay settings for the authenticated user's school
export async function GET() {
  try {
    const authUser = await getAuthenticatedUserSchool();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and principal can view payment settings
    if (!authUser.role || !['admin', 'principal', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('razorpay_configs')
      .select('*')
      .eq('school_id', authUser.schoolId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Don't send decrypted secrets to the client - mask them
    if (data) {
      const maskedData = {
        ...data,
        key_secret_encrypted: data.key_secret_encrypted ? '••••••••••••••••' : null,
        webhook_secret_encrypted: data.webhook_secret_encrypted ? '••••••••••••••••' : null,
      };
      return NextResponse.json({ data: maskedData });
    }

    return NextResponse.json({ data: null });
  } catch (error) {
    console.error('Error fetching Razorpay settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update Razorpay settings
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and principal can update payment settings
    if (!authUser.role || !['admin', 'principal', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const body = await request.json();

    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from('razorpay_configs')
      .select('id, key_secret_encrypted, webhook_secret_encrypted')
      .eq('school_id', authUser.schoolId)
      .single();

    // Build update data
    const updateData: Record<string, unknown> = {
      school_id: authUser.schoolId,
      updated_by: authUser.userId,
      updated_at: new Date().toISOString(),
    };

    if (body.key_id !== undefined) {
      updateData.key_id = body.key_id;
    }

    // Only encrypt key_secret if it's a new value (not masked)
    if (body.key_secret !== undefined && body.key_secret !== '••••••••••••••••') {
      updateData.key_secret_encrypted = encrypt(body.key_secret);
    }

    // Only encrypt webhook_secret if it's a new value (not masked)
    if (body.webhook_secret !== undefined && body.webhook_secret !== '••••••••••••••••') {
      if (body.webhook_secret) {
        updateData.webhook_secret_encrypted = encrypt(body.webhook_secret);
      } else {
        updateData.webhook_secret_encrypted = null;
      }
    }

    if (body.mode !== undefined) {
      updateData.mode = body.mode;
    }

    if (body.is_enabled !== undefined) {
      updateData.is_enabled = body.is_enabled;
    }

    if (body.display_name !== undefined) {
      updateData.display_name = body.display_name || null;
    }

    if (body.theme_color !== undefined) {
      updateData.theme_color = body.theme_color || null;
    }

    let result;
    if (existingConfig) {
      // Update existing config
      const { data, error } = await supabase
        .from('razorpay_configs')
        .update(updateData)
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      // Create new config
      updateData.created_by = authUser.userId;
      updateData.created_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('razorpay_configs')
        .insert(updateData)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    // Mask secrets in response
    const maskedData = {
      ...result,
      key_secret_encrypted: result.key_secret_encrypted ? '••••••••••••••••' : null,
      webhook_secret_encrypted: result.webhook_secret_encrypted ? '••••••••••••••••' : null,
    };

    return NextResponse.json({ data: maskedData });
  } catch (error) {
    console.error('Error saving Razorpay settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
