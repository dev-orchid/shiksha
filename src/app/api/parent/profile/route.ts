import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createApiClient();
    const adminSupabase = createAdminClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details
    const { data: userData } = await adminSupabase
      .from('users')
      .select('id, email, phone')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get parent record - try by user_id first, then by email
    let parent = null;

    // First try by user_id
    const { data: parentByUserId } = await adminSupabase
      .from('parents')
      .select('id, first_name, last_name, email, phone, relation')
      .eq('user_id', userData.id)
      .maybeSingle();

    if (parentByUserId) {
      parent = parentByUserId;
    }

    // If not found by user_id, try by email
    if (!parent && userData.email) {
      const { data: parentsByEmail } = await adminSupabase
        .from('parents')
        .select('id, first_name, last_name, email, phone, relation, user_id')
        .ilike('email', userData.email)
        .limit(1);

      if (parentsByEmail && parentsByEmail.length > 0) {
        parent = parentsByEmail[0];

        // Auto-link if not linked
        if (!parent.user_id) {
          await adminSupabase
            .from('parents')
            .update({ user_id: userData.id })
            .eq('id', parent.id);
        }
      }
    }

    if (!parent) {
      // Return user data if no parent record found
      return NextResponse.json({
        data: {
          first_name: user.email?.split('@')[0] || 'Parent',
          last_name: '',
          email: userData.email || user.email || '',
          phone: userData.phone || '',
        },
      });
    }

    return NextResponse.json({
      data: {
        id: parent.id,
        first_name: parent.first_name,
        last_name: parent.last_name || '',
        email: parent.email || userData.email || '',
        phone: parent.phone || userData.phone || '',
        relation: parent.relation,
      },
    });
  } catch (error) {
    console.error('Error in parent profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
