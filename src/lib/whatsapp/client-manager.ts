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
  initStartedAt: number | null // Timestamp when initialization started
  isFullyReady: boolean // True when client is fully ready to send messages
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
      // Check if initialization is stuck (no QR code after 30 seconds)
      const isStuck = existing.initStartedAt &&
        (Date.now() - existing.initStartedAt > 30000) &&
        !existing.qrCode

      if (isStuck) {
        console.log(`[WhatsApp] Initialization stuck for school: ${schoolId}, forcing cleanup...`)
        await this.forceCleanup(schoolId)
        // Continue to create a new client below
      } else if (existing.qrCode) {
        // Return existing QR if available
        return { success: true, qrCode: existing.qrCode }
      } else {
        return { success: false, error: 'Client is already initializing' }
      }
    } else if (existing) {
      // IMPORTANT: If there's an existing client that's not connected, destroy it first
      // This prevents the "browser is already running" error
      console.log(`[WhatsApp] Cleaning up existing disconnected client for school: ${schoolId}`)
      await this.forceCleanup(schoolId)
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
        initStartedAt: Date.now(),
        isFullyReady: false,
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
          managedClient.initStartedAt = null
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

            // Force WhatsApp to load its internal state by fetching chats
            // This prevents "markedUnread" errors when sending messages
            console.log('[WhatsApp] Client ready, loading chats to sync internal state...')
            try {
              // Fetch chats to ensure WhatsApp's internal state is loaded
              const chats = await client.getChats()
              console.log(`[WhatsApp] Loaded ${chats.length} chats, client fully ready`)
              managedClient.isFullyReady = true
            } catch (chatErr) {
              console.error('[WhatsApp] Error loading chats, will retry:', chatErr)
              // Retry after a delay
              setTimeout(async () => {
                try {
                  await client.getChats()
                  managedClient.isFullyReady = true
                  console.log('[WhatsApp] Chats loaded on retry, client fully ready')
                } catch {
                  // Still mark as ready after delay, even if chat fetch fails
                  managedClient.isFullyReady = true
                  console.log('[WhatsApp] Client marked ready after delay (chat fetch failed)')
                }
              }, 5000)
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
          managedClient.initStartedAt = null
          managedClient.isFullyReady = false
          managedClient.qrCode = null

          if (onDisconnect) {
            onDisconnect(reason)
          }
        })

        client.on('auth_failure', (msg: string) => {
          managedClient.isInitializing = false
          managedClient.initStartedAt = null
          managedClient.isFullyReady = false
          managedClient.qrCode = null
          console.error('Auth failure:', msg)

          if (!qrResolved) {
            resolve({ success: false, error: `Authentication failed: ${msg}` })
          }
        })

        // Initialize the client
        console.log(`[WhatsApp] Starting client initialization...`)
        client.initialize().catch(async (err) => {
          managedClient.isInitializing = false
          managedClient.initStartedAt = null
          console.error('[WhatsApp] Client initialization error:', err)
          console.error('[WhatsApp] Error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack?.split('\n').slice(0, 5).join('\n'),
          })

          // Handle "browser is already running" error by cleaning up session lock
          if (err.message && err.message.includes('browser is already running')) {
            console.log('[WhatsApp] Detected stale browser lock, cleaning up session...')
            try {
              // Remove client from map
              this.clients.delete(schoolId)
              // Try to destroy the client
              await client.destroy().catch(() => {})
              // Clean up the session lock file
              const fs = await import('fs/promises')
              const sessionPath = `./.wwebjs_auth/session-school-${schoolId}`
              const lockFile = `${sessionPath}/SingletonLock`
              try {
                await fs.unlink(lockFile)
                console.log('[WhatsApp] Removed stale lock file')
              } catch {
                // Lock file might not exist
              }
            } catch (cleanupErr) {
              console.log('[WhatsApp] Cleanup error (can be ignored):', cleanupErr)
            }
          }

          if (!qrResolved) {
            // Provide more helpful error messages
            let errorMsg = err.message
            if (errorMsg.includes('Could not find browser') || errorMsg.includes('executable')) {
              errorMsg = 'Chrome/Chromium not found. Please install Chrome or run: npx puppeteer browsers install chrome'
            } else if (errorMsg.includes('browser is already running')) {
              errorMsg = 'Previous session not properly closed. Please try again.'
            }
            resolve({ success: false, error: errorMsg })
          }
        })

        // Timeout after 60 seconds if no QR or ready event
        setTimeout(() => {
          if (!qrResolved && managedClient.isInitializing) {
            managedClient.isInitializing = false
            managedClient.initStartedAt = null
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

  public getInitStartedAt(schoolId: string): number | null {
    const managed = this.clients.get(schoolId)
    return managed?.initStartedAt || null
  }

  public isFullyReady(schoolId: string): boolean {
    const managed = this.clients.get(schoolId)
    return managed?.isFullyReady || false
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
      // Force cleanup even if logout fails
      await this.forceCleanup(schoolId)
      return false
    }
  }

  /**
   * Force cleanup a client - destroys the browser, removes lock files, and removes from map
   * This is used when a client is in a bad state (e.g., browser still running but session expired)
   */
  public async forceCleanup(schoolId: string): Promise<void> {
    const managed = this.clients.get(schoolId)
    if (managed) {
      try {
        // Try to destroy the client gracefully
        await managed.client.destroy()
      } catch (err) {
        // Ignore errors during destroy - the browser might already be dead
        console.log(`[WhatsApp] Error during force cleanup (can be ignored): ${err}`)
      }
      this.clients.delete(schoolId)
    }

    // Clean up any stale lock files that might prevent reconnection
    try {
      const fs = await import('fs/promises')
      const sessionPath = `./.wwebjs_auth/session-school-${schoolId}`
      const lockFile = `${sessionPath}/SingletonLock`
      await fs.unlink(lockFile).catch(() => {})
      console.log(`[WhatsApp] Cleaned up lock file for school: ${schoolId}`)
    } catch {
      // Lock file might not exist, which is fine
    }

    console.log(`[WhatsApp] Force cleanup completed for school: ${schoolId}`)
  }

  /**
   * Force a complete fresh start by deleting all session data
   * Use this when the session is corrupted (e.g., persistent markedUnread errors)
   */
  public async forceFullReset(schoolId: string): Promise<void> {
    console.log(`[WhatsApp] Starting full reset for school: ${schoolId}`)

    // First cleanup the client
    await this.forceCleanup(schoolId)

    // Delete the entire session folder
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const sessionPath = path.join(process.cwd(), '.wwebjs_auth', `session-school-${schoolId}`)

      // Check if directory exists
      try {
        await fs.access(sessionPath)
        // Delete recursively
        await fs.rm(sessionPath, { recursive: true, force: true })
        console.log(`[WhatsApp] Deleted session folder: ${sessionPath}`)
      } catch {
        console.log(`[WhatsApp] Session folder does not exist: ${sessionPath}`)
      }
    } catch (err) {
      console.error(`[WhatsApp] Error deleting session folder:`, err)
    }

    console.log(`[WhatsApp] Full reset completed for school: ${schoolId}`)
  }

  public async sendMessage(
    schoolId: string,
    to: string,
    message: string,
    retryCount = 0
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const managed = this.clients.get(schoolId)
    if (!managed || !managed.status.isConnected) {
      return { success: false, error: 'Client not connected' }
    }

    // Check if client is fully ready (WhatsApp internal state loaded)
    if (!managed.isFullyReady) {
      return {
        success: false,
        error: 'WhatsApp is still initializing. Please wait a few seconds and try again.',
      }
    }

    try {
      // Format phone number (ensure it has country code and @c.us suffix)
      const formattedNumber = this.formatPhoneNumber(to)

      // First, validate the number is on WhatsApp
      let validatedNumber = formattedNumber
      try {
        const numberId = await managed.client.getNumberId(formattedNumber.replace('@c.us', ''))
        if (!numberId) {
          return {
            success: false,
            error: `The number ${to} is not registered on WhatsApp`,
          }
        }
        validatedNumber = numberId._serialized
        console.log(`[WhatsApp] Number validated: ${validatedNumber}`)
      } catch (validateErr) {
        console.log('[WhatsApp] Number validation skipped:', validateErr)
        // Continue with formatted number
      }

      // Method 1: Direct client.sendMessage with sendSeen: false
      // Workaround for markedUnread error - see https://github.com/pedroslopez/whatsapp-web.js/issues/5718
      try {
        console.log(`[WhatsApp] Attempting direct client.sendMessage for: ${validatedNumber}`)
        const sentMessage = await managed.client.sendMessage(validatedNumber, message, {
          sendSeen: false, // Disable sendSeen to avoid markedUnread error
        })
        return {
          success: true,
          messageId: sentMessage.id._serialized,
        }
      } catch (directErr) {
        const directErrMsg = directErr instanceof Error ? directErr.message : String(directErr)
        console.log('[WhatsApp] Direct send failed:', directErrMsg)

        // If not a markedUnread/state error, propagate immediately
        if (!directErrMsg.includes('markedUnread') && !directErrMsg.includes('undefined')) {
          throw directErr
        }
      }

      // Method 2: Get chat first, then send with sendSeen: false
      try {
        const chat = await managed.client.getChatById(validatedNumber)
        if (chat) {
          console.log(`[WhatsApp] Sending via Chat object for: ${validatedNumber}`)
          const sentMessage = await chat.sendMessage(message, {
            sendSeen: false, // Disable sendSeen to avoid markedUnread error
          })
          return {
            success: true,
            messageId: sentMessage.id._serialized,
          }
        }
      } catch (chatErr) {
        console.log('[WhatsApp] Chat-based send failed:', chatErr)
      }

      // Method 3: Try low-level Puppeteer approach as last resort
      try {
        console.log(`[WhatsApp] Attempting low-level send for: ${validatedNumber}`)
        const messageId = await this.sendMessageLowLevel(managed.client, validatedNumber, message)
        if (messageId) {
          return {
            success: true,
            messageId,
          }
        }
      } catch (lowLevelErr) {
        console.log('[WhatsApp] Low-level send failed:', lowLevelErr)
      }

      // All methods failed
      throw new Error('All send methods failed. Please try reconnecting WhatsApp.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[WhatsApp] Error sending message:', errorMessage)

      // Check if this is a transient error that might be fixed by retrying
      // These are NOT session errors - the session is still valid
      const transientErrors = ['markedUnread', 'reading \'undefined\'', 'of undefined']
      const isTransientError = transientErrors.some(pattern =>
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      )

      // Retry up to 3 times for transient errors (like markedUnread) with increasing delays
      if (isTransientError && retryCount < 3) {
        const delay = (retryCount + 1) * 2000 // 2s, 4s, 6s
        console.log(`[WhatsApp] Transient error, retry ${retryCount + 1}/3 after ${delay}ms...`)
        try {
          // Force reload chats to sync state
          await managed.client.getChats()
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.sendMessage(schoolId, to, message, retryCount + 1)
        } catch (retryErr) {
          console.error('[WhatsApp] Retry preparation failed:', retryErr)
          // Still attempt the retry even if getChats failed
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.sendMessage(schoolId, to, message, retryCount + 1)
        }
      }

      // If transient error persists after retries, return error but DON'T disconnect
      // The session may still be valid for other operations
      if (isTransientError) {
        console.log('[WhatsApp] Transient error persisted after retries, but not disconnecting session')
        return {
          success: false,
          error: 'Message could not be sent due to WhatsApp sync issue. Please try again in a moment.',
        }
      }

      // Check if this is a session-related error that requires reconnection
      // Be specific - only truly fatal session errors
      const sessionErrors = [
        'Session closed',
        'Protocol error',
        'Target closed',
        'Execution context was destroyed',
        'ECONNREFUSED',
        'ECONNRESET',
        'page has been closed',
        'browser has disconnected',
        'not logged in',
      ]

      const isSessionError = sessionErrors.some(pattern =>
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      )

      if (isSessionError) {
        console.log('[WhatsApp] Session error detected, marking client as disconnected')
        // Mark the client as disconnected since the session is broken
        managed.status.isConnected = false
        managed.isFullyReady = false
        return {
          success: false,
          error: 'WhatsApp session is not ready. Please reconnect at /whatsapp/connect'
        }
      }

      // For other errors, return the actual error message without marking session as disconnected
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
        sendSeen: false, // Disable sendSeen to avoid markedUnread error
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

  /**
   * Low-level message send using Puppeteer to bypass whatsapp-web.js wrapper
   * This avoids the markedUnread error by directly using WhatsApp's native internal API
   */
  private async sendMessageLowLevel(client: Client, chatId: string, content: string): Promise<string | null> {
    try {
      // Access the puppeteer page directly
      const page = (client as unknown as { pupPage: { evaluate: (fn: string) => Promise<unknown> } }).pupPage
      if (!page) {
        console.log('[WhatsApp] No pupPage available for low-level send')
        return null
      }

      // Use WhatsApp's native internal Store methods directly
      const result = await page.evaluate(`
        (async () => {
          try {
            const chatId = '${chatId}';
            const message = ${JSON.stringify(content)};

            // Try multiple send methods in order of reliability

            // Method 1: Use WWebJS internal sendMessage (most reliable)
            try {
              if (window.WWebJS && window.WWebJS.sendMessage) {
                const result = await window.WWebJS.sendMessage(chatId, message, {});
                if (result) {
                  return { success: true, messageId: result.id?._serialized || 'sent-' + Date.now() };
                }
              }
            } catch (e1) {
              console.log('WWebJS method failed:', e1);
            }

            // Method 2: Use Chat.find and direct composition
            try {
              const chat = await window.Store.Chat.find(chatId);
              if (chat) {
                // Use the chat's compose method if available
                if (chat.compose) {
                  await chat.compose();
                }

                // Try sendTextMsgToChat
                if (window.Store.SendTextMsgToChat) {
                  await window.Store.SendTextMsgToChat(chat, message);
                  return { success: true, messageId: 'sent-' + Date.now() };
                }
              }
            } catch (e2) {
              console.log('Chat.find method failed:', e2);
            }

            // Method 3: Create message using Msg model
            try {
              const chat = window.Store.Chat.get(chatId) || await window.Store.Chat.find(chatId);
              if (chat && window.Store.Msg) {
                // Get user WID safely
                const meWid = window.Store.Conn?.wid ||
                              (window.Store.User?.getMaybeMeUser && window.Store.User.getMaybeMeUser()) ||
                              (window.Store.User?.getMe && window.Store.User.getMe());

                if (meWid) {
                  const tempMsg = {
                    id: window.Store.MsgKey.newId(),
                    ack: 0,
                    body: message,
                    type: 'chat',
                    t: Math.floor(Date.now() / 1000),
                    from: meWid,
                    to: chat.id,
                    self: 'out',
                    isNewMsg: true,
                  };

                  // Add to chat and send
                  const msg = new window.Store.Msg.modelClass(tempMsg);
                  await chat.msgs.add(msg);
                  await msg.send();
                  return { success: true, messageId: tempMsg.id._serialized || 'sent-' + Date.now() };
                }
              }
            } catch (e3) {
              console.log('Msg model method failed:', e3);
            }

            // Method 4: Simple Store.SendMessage
            try {
              const chat = window.Store.Chat.get(chatId) || await window.Store.Chat.find(chatId);
              if (chat && window.Store.SendMessage) {
                await window.Store.SendMessage(chat, message, {});
                return { success: true, messageId: 'sent-' + Date.now() };
              }
            } catch (e4) {
              console.log('Store.SendMessage method failed:', e4);
            }

            return { success: false, error: 'All send methods failed' };
          } catch (err) {
            return { success: false, error: err.message || 'Unknown error' };
          }
        })()
      `)

      const res = result as { success: boolean; messageId?: string; error?: string }
      if (res.success && res.messageId) {
        console.log(`[WhatsApp] Low-level send successful: ${res.messageId}`)
        return res.messageId
      } else {
        console.log(`[WhatsApp] Low-level send failed: ${res.error}`)
        return null
      }
    } catch (err) {
      console.log('[WhatsApp] Low-level send error:', err)
      return null
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
