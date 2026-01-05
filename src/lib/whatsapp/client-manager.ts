import { Client, LocalAuth, Message } from 'whatsapp-web.js'
import QRCode from 'qrcode'
import {
  ConnectionStatus,
  ClientInfo,
  QRCallback,
  ReadyCallback,
  DisconnectCallback,
} from './types'

interface ManagedClient {
  client: Client
  schoolId: string
  status: ConnectionStatus
  qrCode: string | null
  isInitializing: boolean
}

class WhatsAppClientManager {
  private static instance: WhatsAppClientManager
  private clients: Map<string, ManagedClient> = new Map()

  private constructor() {}

  public static getInstance(): WhatsAppClientManager {
    if (!WhatsAppClientManager.instance) {
      WhatsAppClientManager.instance = new WhatsAppClientManager()
    }
    return WhatsAppClientManager.instance
  }

  public async initializeClient(
    schoolId: string,
    onQR?: QRCallback,
    onReady?: ReadyCallback,
    onDisconnect?: DisconnectCallback
  ): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    // Check if client already exists and is connected
    const existing = this.clients.get(schoolId)
    if (existing?.status.isConnected) {
      return { success: true }
    }

    // Check if already initializing
    if (existing?.isInitializing) {
      // Return existing QR if available
      if (existing.qrCode) {
        return { success: true, qrCode: existing.qrCode }
      }
      return { success: false, error: 'Client is already initializing' }
    }

    try {
      console.log(`[WhatsApp] Initializing client for school: ${schoolId}`)

      // Create new client with local auth for session persistence
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: `school-${schoolId}`,
          dataPath: `./.wwebjs_auth`,
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
        },
      })

      console.log(`[WhatsApp] Client created, setting up event handlers...`)

      const managedClient: ManagedClient = {
        client,
        schoolId,
        status: {
          isConnected: false,
          phoneNumber: null,
          deviceName: null,
          lastSeen: null,
          batteryLevel: null,
        },
        qrCode: null,
        isInitializing: true,
      }

      this.clients.set(schoolId, managedClient)

      // Set up event handlers
      return new Promise((resolve) => {
        let qrResolved = false

        client.on('qr', async (qr: string) => {
          console.log(`[WhatsApp] QR code received for school: ${schoolId}`)
          try {
            // Convert QR to base64 data URL
            const qrDataUrl = await QRCode.toDataURL(qr, {
              width: 256,
              margin: 2,
            })
            managedClient.qrCode = qrDataUrl

            if (onQR) {
              onQR(qrDataUrl)
            }

            // Resolve with QR code on first QR event
            if (!qrResolved) {
              qrResolved = true
              console.log(`[WhatsApp] Resolving with QR code`)
              resolve({ success: true, qrCode: qrDataUrl })
            }
          } catch (err) {
            console.error('[WhatsApp] Error generating QR code:', err)
          }
        })

        client.on('ready', async () => {
          managedClient.isInitializing = false
          managedClient.qrCode = null

          try {
            const info = client.info
            managedClient.status = {
              isConnected: true,
              phoneNumber: info?.wid?.user ? `+${info.wid.user}` : null,
              deviceName: info?.pushname || null,
              lastSeen: new Date().toISOString(),
              batteryLevel: null,
            }

            if (onReady) {
              onReady({
                phoneNumber: managedClient.status.phoneNumber,
                pushName: info?.pushname || null,
                platform: info?.platform || null,
              })
            }

            // If we haven't resolved yet (session was restored), resolve now
            if (!qrResolved) {
              resolve({ success: true })
            }
          } catch (err) {
            console.error('Error in ready handler:', err)
          }
        })

        client.on('disconnected', (reason: string) => {
          managedClient.status.isConnected = false
          managedClient.isInitializing = false
          managedClient.qrCode = null

          if (onDisconnect) {
            onDisconnect(reason)
          }
        })

        client.on('auth_failure', (msg: string) => {
          managedClient.isInitializing = false
          managedClient.qrCode = null
          console.error('Auth failure:', msg)

          if (!qrResolved) {
            resolve({ success: false, error: `Authentication failed: ${msg}` })
          }
        })

        // Initialize the client
        console.log(`[WhatsApp] Starting client initialization...`)
        client.initialize().catch((err) => {
          managedClient.isInitializing = false
          console.error('[WhatsApp] Client initialization error:', err)
          console.error('[WhatsApp] Error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack?.split('\n').slice(0, 5).join('\n'),
          })
          if (!qrResolved) {
            // Provide more helpful error messages
            let errorMsg = err.message
            if (errorMsg.includes('Could not find browser') || errorMsg.includes('executable')) {
              errorMsg = 'Chrome/Chromium not found. Please install Chrome or run: npx puppeteer browsers install chrome'
            }
            resolve({ success: false, error: errorMsg })
          }
        })

        // Timeout after 60 seconds if no QR or ready event
        setTimeout(() => {
          if (!qrResolved && managedClient.isInitializing) {
            managedClient.isInitializing = false
            resolve({ success: false, error: 'Initialization timeout' })
          }
        }, 60000)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  public getClient(schoolId: string): Client | null {
    const managed = this.clients.get(schoolId)
    return managed?.client || null
  }

  public getStatus(schoolId: string): ConnectionStatus {
    const managed = this.clients.get(schoolId)
    if (!managed) {
      return {
        isConnected: false,
        phoneNumber: null,
        deviceName: null,
        lastSeen: null,
        batteryLevel: null,
      }
    }
    return managed.status
  }

  public getQRCode(schoolId: string): string | null {
    const managed = this.clients.get(schoolId)
    return managed?.qrCode || null
  }

  public isInitializing(schoolId: string): boolean {
    const managed = this.clients.get(schoolId)
    return managed?.isInitializing || false
  }

  public async disconnectClient(schoolId: string): Promise<boolean> {
    const managed = this.clients.get(schoolId)
    if (!managed) {
      return false
    }

    try {
      await managed.client.logout()
      await managed.client.destroy()
      this.clients.delete(schoolId)
      return true
    } catch (error) {
      console.error('Error disconnecting client:', error)
      // Force remove from map even if logout fails
      this.clients.delete(schoolId)
      return false
    }
  }

  public async sendMessage(
    schoolId: string,
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const managed = this.clients.get(schoolId)
    if (!managed || !managed.status.isConnected) {
      return { success: false, error: 'Client not connected' }
    }

    try {
      // Format phone number (ensure it has country code and @c.us suffix)
      const formattedNumber = this.formatPhoneNumber(to)

      const sentMessage = await managed.client.sendMessage(formattedNumber, message)
      return {
        success: true,
        messageId: sentMessage.id._serialized,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  public async sendMediaMessage(
    schoolId: string,
    to: string,
    mediaUrl: string,
    caption?: string,
    mediaType?: 'image' | 'document' | 'video'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const managed = this.clients.get(schoolId)
    if (!managed || !managed.status.isConnected) {
      return { success: false, error: 'Client not connected' }
    }

    try {
      const { MessageMedia } = await import('whatsapp-web.js')
      const formattedNumber = this.formatPhoneNumber(to)

      // Download media from URL
      const media = await MessageMedia.fromUrl(mediaUrl)

      const sentMessage = await managed.client.sendMessage(formattedNumber, media, {
        caption: caption || undefined,
      })

      return {
        success: true,
        messageId: sentMessage.id._serialized,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '')

    // Remove leading + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1)
    }

    // If number doesn't start with country code, assume India (+91)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned
    }

    // Add @c.us suffix for WhatsApp
    return cleaned + '@c.us'
  }

  public getAllConnectedSchools(): string[] {
    const connected: string[] = []
    this.clients.forEach((managed, schoolId) => {
      if (managed.status.isConnected) {
        connected.push(schoolId)
      }
    })
    return connected
  }
}

// Export singleton instance
export const whatsappClientManager = WhatsAppClientManager.getInstance()
