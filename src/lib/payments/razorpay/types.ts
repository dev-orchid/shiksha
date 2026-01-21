// Razorpay Payment Gateway Types

export interface RazorpayConfig {
  id: string;
  school_id: string;
  key_id: string;
  key_secret_encrypted: string;
  webhook_secret_encrypted: string | null;
  mode: 'test' | 'live';
  is_enabled: boolean;
  display_name: string | null;
  theme_color: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface RazorpayOrder {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: 'payment';
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayWebhookEvent {
  entity: 'event';
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: { entity: RazorpayPayment };
    order?: { entity: RazorpayOrder };
  };
  created_at: number;
}

export interface CreateOrderInput {
  amount: number; // in paise
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResponse {
  success: boolean;
  order?: RazorpayOrder;
  error?: string;
}

export interface CheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme?: {
    color: string;
  };
}

export interface PaymentVerificationInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export type PaymentStatus = 'initiated' | 'pending' | 'success' | 'failed' | 'cancelled';

export interface InitiatePaymentInput {
  invoice_id: string;
  amount: number;
  student_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}
