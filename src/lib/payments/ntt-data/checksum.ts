// NTT DATA Checksum Generation and Verification
import crypto from 'crypto'
import { NTT_CONFIG } from './config'

/**
 * Generate checksum for payment request
 * The checksum is a SHA-512 hash of concatenated parameters with salt
 */
export function generateChecksum(params: Record<string, string>): string {
  const salt = NTT_CONFIG.salt

  // Sort parameters alphabetically by key
  const sortedKeys = Object.keys(params).sort()

  // Concatenate key=value pairs with pipe separator
  const dataString = sortedKeys
    .filter(key => params[key] !== undefined && params[key] !== '')
    .map(key => `${key}=${params[key]}`)
    .join('|')

  // Append salt
  const checksumString = `${dataString}|${salt}`

  // Generate SHA-512 hash
  return crypto.createHash('sha512').update(checksumString).digest('hex')
}

/**
 * Verify checksum from payment response
 */
export function verifyChecksum(
  params: Record<string, string>,
  receivedChecksum: string
): boolean {
  // Remove checksum from params before verification
  const paramsWithoutChecksum = { ...params }
  delete paramsWithoutChecksum.checksum
  delete paramsWithoutChecksum.hash

  const calculatedChecksum = generateChecksum(paramsWithoutChecksum)

  // Compare in constant time to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(calculatedChecksum),
    Buffer.from(receivedChecksum)
  )
}

/**
 * Generate a unique order ID
 */
export function generateOrderId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD${timestamp}${random}`
}
