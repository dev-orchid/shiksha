// WhatsApp Integration Types

export interface ConnectionStatus {
  isConnected: boolean
  phoneNumber: string | null
  deviceName: string | null
  lastSeen: string | null
  batteryLevel: number | null
}

export interface WhatsAppConfig {
  id: string
  school_id: string
  phone_number: string
  session_data: string | null
  is_connected: boolean
  last_connected_at: string | null
  qr_code: string | null
  created_at: string
  updated_at: string
}

export interface SendMessagePayload {
  school_id: string
  message_type: 'individual' | 'group' | 'broadcast'
  recipient?: string // Phone number for individual
  group_id?: string // For group messages
  recipients?: string[] // For broadcast
  template_id?: string
  message: string
  media_url?: string
  media_type?: 'image' | 'document' | 'video'
  sent_by: string
}

export interface MessageLog {
  id: string
  school_id: string
  template_id: string | null
  message_type: 'individual' | 'group' | 'broadcast'
  recipient_phone: string | null
  group_id: string | null
  content: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  sent_by: string
  created_at: string
}

export interface WhatsAppTemplate {
  id: string
  school_id: string
  name: string
  category: 'fee_reminder' | 'attendance' | 'exam' | 'result' | 'general' | 'announcement'
  content: string
  variables: string[]
  is_active: boolean
  created_at: string
}

export interface WhatsAppGroup {
  id: string
  school_id: string
  group_id: string
  name: string
  group_type: 'class' | 'parents' | 'teachers' | 'custom'
  class_id: string | null
  section_id: string | null
  description: string | null
  invite_link: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ClientInfo {
  phoneNumber: string | null
  pushName: string | null
  platform: string | null
}

export type QRCallback = (qr: string) => void
export type ReadyCallback = (info: ClientInfo) => void
export type DisconnectCallback = (reason: string) => void
export type MessageCallback = (messageId: string, status: 'sent' | 'delivered' | 'read') => void
