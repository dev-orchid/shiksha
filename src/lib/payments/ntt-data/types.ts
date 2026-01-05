// NTT DATA Payment Gateway Types

export interface NTTPaymentRequest {
  merchantId: string
  orderId: string
  amount: string
  currency: string
  customerName: string
  customerEmail: string
  customerPhone: string
  productInfo: string
  returnUrl: string
  notifyUrl: string
  checksum: string
}

export interface NTTPaymentResponse {
  status: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'CANCELLED'
  orderId: string
  transactionId: string
  amount: string
  paymentMode: string
  responseCode: string
  responseMessage: string
  checksum: string
  bankRefNo?: string
  txnDate?: string
}

export type PaymentStatus = 'initiated' | 'pending' | 'success' | 'failed' | 'cancelled'

export interface PaymentTransaction {
  id: string
  school_id: string
  invoice_id: string
  student_id: string
  order_id: string
  transaction_id: string | null
  amount: number
  currency: string
  status: PaymentStatus
  payment_mode: string | null
  ntt_order_id: string | null
  ntt_response_code: string | null
  ntt_response_message: string | null
  initiated_by: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  initiated_at: string
  completed_at: string | null
  gateway_request: Record<string, unknown> | null
  gateway_response: Record<string, unknown> | null
  webhook_payload: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface InitiatePaymentInput {
  invoice_id: string
  amount: number
  student_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
}

export interface PaymentResult {
  success: boolean
  order_id?: string
  payment_url?: string
  error?: string
}
