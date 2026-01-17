'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  Smartphone,
  QrCode,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  AlertCircle,
} from 'lucide-react'
import { useSession } from '@/components/providers/SessionProvider'

interface ConnectionStatus {
  isConnected: boolean
  isInitializing?: boolean
  needsReconnect?: boolean
  isServerless?: boolean
  phoneNumber: string | null
  deviceName: string | null
  lastSeen: string | null
  batteryLevel: number | null
  qrCode?: string | null
  message?: string
}

export default function WhatsAppConnectPage() {
  const { profile } = useSession()
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkConnection = useCallback(async () => {
    try {
      const schoolId = profile?.schoolId
      const params = schoolId ? `?school_id=${schoolId}` : ''
      const response = await fetch(`/api/whatsapp/status${params}`)
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        // If there's a QR code from the status, show it
        if (data.qrCode && data.isInitializing) {
          setQrCode(data.qrCode)
          setConnecting(true)
        }
      }
    } catch {
      console.error('Failed to check connection')
    } finally {
      setLoading(false)
    }
  }, [profile?.schoolId])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  const startConnection = async () => {
    setConnecting(true)
    setQrCode(null)
    setError(null)

    try {
      const schoolId = profile?.schoolId
      if (!schoolId) {
        setError('No school selected. Please select a school first.')
        setConnecting(false)
        return
      }

      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: schoolId }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.qrCode) {
          setQrCode(data.qrCode)
        }
        if (data.isConnected) {
          setStatus({ ...status, isConnected: true, phoneNumber: data.phoneNumber } as ConnectionStatus)
          setConnecting(false)
          return
        }

        // Poll for connection status
        const params = `?school_id=${schoolId}`
        const pollInterval = setInterval(async () => {
          const statusRes = await fetch(`/api/whatsapp/status${params}`)
          if (statusRes.ok) {
            const statusData = await statusRes.json()
            // Update QR code if a new one is available
            if (statusData.qrCode && statusData.isInitializing) {
              setQrCode(statusData.qrCode)
            }
            if (statusData.isConnected) {
              clearInterval(pollInterval)
              setQrCode(null)
              setStatus(statusData)
              setConnecting(false)
            }
          }
        }, 3000)

        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval)
          if (!status?.isConnected) {
            setConnecting(false)
            setQrCode(null)
            setError('Connection timeout. Please try again.')
          }
        }, 120000)
      } else {
        // Check if this is a serverless platform error
        if (data.isServerless) {
          setStatus({ ...status, isServerless: true } as ConnectionStatus)
        }
        setError(data.error || 'Failed to initiate connection')
        setConnecting(false)
      }
    } catch (err) {
      setError('Failed to connect. Please try again.')
      setConnecting(false)
    }
  }

  const disconnect = async (reset = false) => {
    const message = reset
      ? 'This will completely reset your WhatsApp session. You will need to scan the QR code again. Continue?'
      : 'Are you sure you want to disconnect WhatsApp?'
    if (!confirm(message)) return

    try {
      const schoolId = profile?.schoolId
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: schoolId, reset }),
      })
      if (response.ok) {
        setStatus(null)
        setQrCode(null)
        setConnecting(false)
        checkConnection()
      } else {
        setError('Failed to disconnect')
      }
    } catch {
      setError('Failed to disconnect')
    }
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
        <Link href="/whatsapp">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Connection</h1>
          <p className="text-gray-500">Connect your WhatsApp Business account</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : status?.isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Connected</p>
                    <p className="text-sm text-green-600">WhatsApp is ready to send messages</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Phone Number</span>
                    <span className="font-medium">{status.phoneNumber || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Device</span>
                    <span className="font-medium">{status.deviceName || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Last Active</span>
                    <span className="font-medium">
                      {status.lastSeen
                        ? new Date(status.lastSeen).toLocaleString('en-IN')
                        : '-'}
                    </span>
                  </div>
                  {status.batteryLevel !== null && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Battery</span>
                      <span className="font-medium">{status.batteryLevel}%</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button variant="outline" onClick={checkConnection} icon={<RefreshCw className="h-4 w-4" />}>
                    Refresh
                  </Button>
                  <Button variant="outline" onClick={() => disconnect(false)} className="text-red-600 hover:bg-red-50">
                    Disconnect
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => disconnect(true)}
                    className="text-orange-600 hover:bg-orange-50"
                    title="Use this if messages are failing with sync errors"
                  >
                    Reset Session
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {status?.needsReconnect || status?.phoneNumber ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">Session Expired</p>
                      <p className="text-sm text-amber-600">
                        {status?.message || 'Your WhatsApp session has expired. Please reconnect by scanning the QR code.'}
                      </p>
                      {status?.phoneNumber && (
                        <p className="text-sm text-amber-600 mt-1">
                          Previous number: {status.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                ) : status?.isServerless ? (
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800">Not Available on Cloud Hosting</p>
                      <p className="text-sm text-orange-600 mt-1">
                        WhatsApp Web integration requires a persistent server with browser support.
                        Serverless platforms like Vercel cannot maintain WhatsApp sessions.
                      </p>
                      <p className="text-sm text-orange-600 mt-2">
                        <strong>Options:</strong>
                      </p>
                      <ul className="text-sm text-orange-600 mt-1 list-disc list-inside">
                        <li>Self-host on a VPS (DigitalOcean, AWS EC2, Railway)</li>
                        <li>Use WhatsApp Business API (paid cloud service)</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <XCircle className="h-6 w-6 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">Not Connected</p>
                      <p className="text-sm text-yellow-600">Connect your WhatsApp to start messaging</p>
                    </div>
                  </div>
                )}

                {!status?.isServerless && (
                  <Button onClick={startConnection} disabled={connecting} className="w-full">
                    {connecting ? 'Connecting...' : status?.needsReconnect ? 'Reconnect WhatsApp' : 'Connect WhatsApp'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code / Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {qrCode ? 'Scan QR Code' : 'How to Connect'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {qrCode ? (
              <div className="space-y-4">
                <div className="flex justify-center p-4 bg-white border rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Open WhatsApp on your phone, go to Settings {'>'} Linked Devices {'>'} Link a Device
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Point your phone camera at this QR code to connect
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center justify-center w-6 h-6 bg-primary text-white text-sm font-medium rounded-full">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Open WhatsApp</p>
                    <p className="text-sm text-gray-500">
                      Open WhatsApp on your phone
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center justify-center w-6 h-6 bg-primary text-white text-sm font-medium rounded-full">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Go to Linked Devices</p>
                    <p className="text-sm text-gray-500">
                      Tap Menu or Settings {'>'} Linked Devices
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center justify-center w-6 h-6 bg-primary text-white text-sm font-medium rounded-full">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Scan QR Code</p>
                    <p className="text-sm text-gray-500">
                      Tap &quot;Link a Device&quot; and scan the QR code
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Important</p>
                    <p className="text-blue-600">
                      Keep your phone connected to the internet. Messages are sent through your device.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Integration Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Auto-send Fee Reminders</span>
                <Badge variant="success">Enabled</Badge>
              </div>
              <p className="text-sm text-gray-500">
                Automatically send payment reminders to parents
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Attendance Notifications</span>
                <Badge variant="success">Enabled</Badge>
              </div>
              <p className="text-sm text-gray-500">
                Notify parents when students are absent
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Exam Reminders</span>
                <Badge variant="danger">Disabled</Badge>
              </div>
              <p className="text-sm text-gray-500">
                Send exam schedule reminders to students
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Result Notifications</span>
                <Badge variant="success">Enabled</Badge>
              </div>
              <p className="text-sm text-gray-500">
                Share exam results with parents
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    
  )
}
