// NTT DATA Payment Gateway Configuration

export const NTT_CONFIG = {
  merchantId: process.env.NTT_MERCHANT_ID || '',
  apiKey: process.env.NTT_API_KEY || '',
  salt: process.env.NTT_SALT || '',

  // API URLs - Change for production
  baseUrl: process.env.NTT_API_BASE_URL || 'https://sandbox.nttdatapay.com/api',
  paymentPageUrl: process.env.NTT_PAYMENT_PAGE_URL || 'https://sandbox.nttdatapay.com/payment',

  // Mode: sandbox or production
  mode: process.env.NTT_MODE || 'sandbox',

  // Callback URLs
  get callbackUrl() {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`
  },

  get webhookUrl() {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
  },

  // Currency
  currency: 'INR',
}

export function isConfigured(): boolean {
  return !!(
    NTT_CONFIG.merchantId &&
    NTT_CONFIG.apiKey &&
    NTT_CONFIG.salt
  )
}

export function isSandbox(): boolean {
  return NTT_CONFIG.mode === 'sandbox'
}
