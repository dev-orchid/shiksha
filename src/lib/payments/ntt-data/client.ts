// NTT DATA Payment Gateway Client
import { NTT_CONFIG, isConfigured } from './config'
import { generateChecksum, generateOrderId, verifyChecksum } from './checksum'
import type { NTTPaymentRequest, NTTPaymentResponse, InitiatePaymentInput, PaymentResult } from './types'

/**
 * Build payment request parameters
 */
export function buildPaymentRequest(
  input: InitiatePaymentInput,
  orderId: string
): NTTPaymentRequest {
  const params: Record<string, string> = {
    merchantId: NTT_CONFIG.merchantId,
    orderId: orderId,
    amount: input.amount.toFixed(2),
    currency: NTT_CONFIG.currency,
    customerName: input.customer_name,
    customerEmail: input.customer_email,
    customerPhone: input.customer_phone,
    productInfo: `Fee Payment - Invoice ${input.invoice_id}`,
    returnUrl: NTT_CONFIG.callbackUrl,
    notifyUrl: NTT_CONFIG.webhookUrl,
  }

  // Generate checksum
  const checksum = generateChecksum(params)

  return {
    ...params,
    checksum,
  } as NTTPaymentRequest
}

/**
 * Get payment page URL with parameters
 */
export function getPaymentUrl(request: NTTPaymentRequest): string {
  const params = new URLSearchParams()

  Object.entries(request).forEach(([key, value]) => {
    params.append(key, value)
  })

  return `${NTT_CONFIG.paymentPageUrl}?${params.toString()}`
}

/**
 * Initiate a payment
 */
export async function initiatePayment(
  input: InitiatePaymentInput
): Promise<PaymentResult> {
  if (!isConfigured()) {
    return {
      success: false,
      error: 'Payment gateway not configured. Please set NTT_MERCHANT_ID, NTT_API_KEY, and NTT_SALT environment variables.',
    }
  }

  const orderId = generateOrderId()
  const request = buildPaymentRequest(input, orderId)
  const paymentUrl = getPaymentUrl(request)

  return {
    success: true,
    order_id: orderId,
    payment_url: paymentUrl,
  }
}

/**
 * Parse and verify callback/webhook response
 */
export function parsePaymentResponse(
  data: Record<string, string>
): { valid: boolean; response: NTTPaymentResponse | null; error?: string } {
  const receivedChecksum = data.checksum || data.hash

  if (!receivedChecksum) {
    return { valid: false, response: null, error: 'Missing checksum in response' }
  }

  // Verify checksum
  const isValid = verifyChecksum(data, receivedChecksum)

  if (!isValid) {
    return { valid: false, response: null, error: 'Invalid checksum' }
  }

  const response: NTTPaymentResponse = {
    status: data.status as NTTPaymentResponse['status'],
    orderId: data.orderId || data.order_id,
    transactionId: data.transactionId || data.transaction_id || '',
    amount: data.amount,
    paymentMode: data.paymentMode || data.payment_mode || '',
    responseCode: data.responseCode || data.response_code || '',
    responseMessage: data.responseMessage || data.response_message || '',
    checksum: receivedChecksum,
    bankRefNo: data.bankRefNo || data.bank_ref_no,
    txnDate: data.txnDate || data.txn_date,
  }

  return { valid: true, response }
}

/**
 * Map gateway status to internal status
 */
export function mapPaymentStatus(gatewayStatus: string): 'success' | 'failed' | 'pending' | 'cancelled' {
  switch (gatewayStatus?.toUpperCase()) {
    case 'SUCCESS':
      return 'success'
    case 'FAILURE':
    case 'FAILED':
      return 'failed'
    case 'PENDING':
      return 'pending'
    case 'CANCELLED':
    case 'CANCELED':
      return 'cancelled'
    default:
      return 'pending'
  }
}
