// Payment Gateway Factory
// Determines which payment gateway to use based on school configuration

import { createAdminClient } from '@/lib/supabase/admin';
import { RazorpayClient, type RazorpayConfig } from './razorpay';

export type PaymentGateway = 'razorpay' | 'none';

export interface GatewayInfo {
  gateway: PaymentGateway;
  razorpayClient?: RazorpayClient;
  razorpayConfig?: RazorpayConfig;
  isConfigured: boolean;
}

/**
 * Get the payment gateway configuration for a school
 */
export async function getSchoolPaymentGateway(schoolId: string): Promise<GatewayInfo> {
  const supabase = createAdminClient();

  // Check for Razorpay configuration
  const { data: razorpayConfig } = await supabase
    .from('razorpay_configs')
    .select('*')
    .eq('school_id', schoolId)
    .single();

  if (razorpayConfig && razorpayConfig.is_enabled) {
    try {
      const client = new RazorpayClient(razorpayConfig as RazorpayConfig);
      return {
        gateway: 'razorpay',
        razorpayClient: client,
        razorpayConfig: razorpayConfig as RazorpayConfig,
        isConfigured: true,
      };
    } catch {
      // Decryption failed or invalid config
      return {
        gateway: 'none',
        isConfigured: false,
      };
    }
  }

  return {
    gateway: 'none',
    isConfigured: false,
  };
}

/**
 * Get Razorpay configuration for a school (without client initialization)
 */
export async function getRazorpayConfig(schoolId: string): Promise<RazorpayConfig | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('razorpay_configs')
    .select('*')
    .eq('school_id', schoolId)
    .single();

  return data as RazorpayConfig | null;
}

/**
 * Check if a school has any payment gateway configured and enabled
 */
export async function hasPaymentGateway(schoolId: string): Promise<boolean> {
  const info = await getSchoolPaymentGateway(schoolId);
  return info.isConfigured;
}
