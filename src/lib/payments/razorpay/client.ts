// Razorpay Payment Gateway Client
import { decrypt } from '@/lib/utils/encryption';
import type {
  RazorpayConfig,
  RazorpayOrder,
  RazorpayPayment,
  CreateOrderInput,
  CreateOrderResponse,
} from './types';

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

export class RazorpayClient {
  private keyId: string;
  private keySecret: string;

  constructor(config: RazorpayConfig) {
    this.keyId = config.key_id;
    this.keySecret = decrypt(config.key_secret_encrypted);
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
    try {
      const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify({
          amount: input.amount,
          currency: input.currency || 'INR',
          receipt: input.receipt,
          notes: input.notes || {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.description || 'Failed to create order',
        };
      }

      const order = (await response.json()) as RazorpayOrder;
      return { success: true, order };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      };
    }
  }

  async fetchOrder(orderId: string): Promise<RazorpayOrder | null> {
    try {
      const response = await fetch(`${RAZORPAY_API_BASE}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as RazorpayOrder;
    } catch {
      return null;
    }
  }

  async fetchPayment(paymentId: string): Promise<RazorpayPayment | null> {
    try {
      const response = await fetch(`${RAZORPAY_API_BASE}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as RazorpayPayment;
    } catch {
      return null;
    }
  }

  async fetchPaymentsForOrder(orderId: string): Promise<RazorpayPayment[]> {
    try {
      const response = await fetch(`${RAZORPAY_API_BASE}/orders/${orderId}/payments`, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.items || [];
    } catch {
      return [];
    }
  }

  getKeyId(): string {
    return this.keyId;
  }
}

export function generateOrderReceipt(invoiceId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `rcpt_${invoiceId.substring(0, 8)}_${timestamp}${random}`;
}
