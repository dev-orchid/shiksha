import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserSchool } from '@/lib/supabase/auth-utils';

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

// POST - Test Razorpay connection with provided credentials
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSchool();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and principal can test payment settings
    if (!['admin', 'principal', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { key_id, key_secret } = body;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: 'Key ID and Key Secret are required' },
        { status: 400 }
      );
    }

    // Test credentials by fetching orders (empty list is fine)
    const credentials = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

    const response = await fetch(`${RAZORPAY_API_BASE}/orders?count=1`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Connection successful! Credentials are valid.',
      });
    }

    const errorData = await response.json();

    if (response.status === 401) {
      return NextResponse.json({
        success: false,
        message: 'Invalid credentials. Please check your Key ID and Key Secret.',
      });
    }

    return NextResponse.json({
      success: false,
      message: errorData.error?.description || 'Connection failed',
    });
  } catch (error) {
    console.error('Error testing Razorpay connection:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to Razorpay. Please try again.',
    });
  }
}
