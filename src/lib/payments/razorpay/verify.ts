// Razorpay Payment Signature Verification
import { createHmac, timingSafeEqual } from 'crypto';
import { decrypt } from '@/lib/utils/encryption';
import type { PaymentVerificationInput, RazorpayConfig } from './types';

/**
 * Verify payment signature after checkout completion
 * Uses HMAC-SHA256 with timing-safe comparison
 */
export function verifyPaymentSignature(
  input: PaymentVerificationInput,
  config: RazorpayConfig
): boolean {
  const keySecret = decrypt(config.key_secret_encrypted);
  const payload = `${input.razorpay_order_id}|${input.razorpay_payment_id}`;

  const expectedSignature = createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex');

  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(input.razorpay_signature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verify webhook signature
 * Uses HMAC-SHA256 with timing-safe comparison
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  config: RazorpayConfig
): boolean {
  if (!config.webhook_secret_encrypted) {
    return false;
  }

  const webhookSecret = decrypt(config.webhook_secret_encrypted);

  const expectedSignature = createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

/**
 * Map Razorpay payment status to internal status
 */
export function mapPaymentStatus(
  razorpayStatus: string
): 'success' | 'failed' | 'pending' | 'cancelled' {
  switch (razorpayStatus?.toLowerCase()) {
    case 'captured':
    case 'authorized':
      return 'success';
    case 'failed':
      return 'failed';
    case 'refunded':
      return 'cancelled';
    default:
      return 'pending';
  }
}
