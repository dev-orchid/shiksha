'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  MessageSquare,
  Send,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  QrCode,
  Smartphone,
} from 'lucide-react'
import { useSession } from '@/components/providers/SessionProvider'

interface ConnectionStatus {
  isConnected: boolean
  phoneNumber: string | null
  deviceName: string | null
  lastSeen: string | null
}

interface MessageStats {
  total: number
  sent: number
  delivered: number
  failed: number
}

interface Group {
  id: string
  name: string
  group_type: string
  description: string | null
  is_active: boolean
}

interface RecentMessage {
  id: string
  message_type: string
  recipient_phone: string | null
  content: string
  status: string
  created_at: string
}

export default function WhatsAppPage() {
  const { profile } = useSession()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    phoneNumber: null,
    deviceName: null,
    lastSeen: null,
  })
  const [stats, setStats] = useState<MessageStats>({ total: 0, sent: 0, delivered: 0, failed: 0 })
  const [groups, setGroups] = useState<Group[]>([])
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([])
  const [templates, setTemplates] = useState<{ id: string; name: string; category: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const schoolId = profile?.schoolId
      const params = schoolId ? `?school_id=${schoolId}` : ''

      // Fetch all data in parallel
      const separator = params ? '&' : '?'
      const [statusRes, messagesRes, groupsRes, templatesRes] = await Promise.all([
        fetch(`/api/whatsapp/status${params}`),
        fetch(`/api/whatsapp/send${params}${separator}limit=5`),
        fetch(`/api/whatsapp/groups${params}`),
        fetch(`/api/whatsapp/templates${params}`),
      ])

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setConnectionStatus(statusData)
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json()
        setRecentMessages(messagesData.data || [])

        // Calculate stats from pagination
        const total = messagesData.pagination?.total || 0

        // Fetch stats for different statuses
        const [sentRes, deliveredRes, failedRes] = await Promise.all([
          fetch(`/api/whatsapp/send${params}${separator}status=sent&limit=1`),
          fetch(`/api/whatsapp/send${params}${separator}status=delivered&limit=1`),
          fetch(`/api/whatsapp/send${params}${separator}status=failed&limit=1`),
        ])

        const sentData = sentRes.ok ? await sentRes.json() : { pagination: { total: 0 } }
        const deliveredData = deliveredRes.ok ? await deliveredRes.json() : { pagination: { total: 0 } }
        const failedData = failedRes.ok ? await failedRes.json() : { pagination: { total: 0 } }

        setStats({
          total,
          sent: sentData.pagination?.total || 0,
          delivered: deliveredData.pagination?.total || 0,
          failed: failedData.pagination?.total || 0,
        })
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setGroups((groupsData.data || []).slice(0, 4))
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData.data || [])
      }
    } catch (error) {
      console.error('Error fetching WhatsApp data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [profile?.schoolId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'read':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'sent':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>
      case 'read':
        return <Badge variant="info">Read</Badge>
      case 'sent':
        return <Badge variant="warning">Sent</Badge>
      case 'failed':
        return <Badge variant="danger">Failed</Badge>
      default:
        return <Badge variant="default">Pending</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Integration</h1>
          <p className="text-gray-500 mt-1">Send notifications and manage groups</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/whatsapp/templates">
            <Button variant="outline" icon={<FileText className="h-4 w-4" />}>
              Templates
            </Button>
          </Link>
          <Link href="/whatsapp/send">
            <Button icon={<Send className="h-4 w-4" />}>Send Message</Button>
          </Link>
        </div>
      </div>

      {/* Connection Status */}
      <Card className={connectionStatus.isConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${connectionStatus.isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                <Smartphone className={`h-6 w-6 ${connectionStatus.isConnected ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {connectionStatus.isConnected ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
                </p>
                <p className="text-sm text-gray-500">
                  {connectionStatus.isConnected
                    ? `Connected to ${connectionStatus.phoneNumber || 'Unknown'}`
                    : 'Please scan QR code to connect'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus.isConnected ? (
                <>
                  <Badge variant="success">Online</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    Refresh
                  </Button>
                </>
              ) : (
                <Link href="/whatsapp/connect">
                  <Button icon={<QrCode className="h-4 w-4" />}>Connect Now</Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sent.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Sent Successfully</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.failed.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{groups.length}</p>
                <p className="text-xs text-gray-500">Active Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Send */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Send</CardTitle>
            <CardDescription>Send a quick message to a group or individual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Select recipient...</option>
              <option value="all">All Parents</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Select template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              rows={3}
              placeholder="Type your message..."
            />
            <Link href="/whatsapp/send">
              <Button className="w-full" icon={<Send className="h-4 w-4" />}>
                Send Message
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Groups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>WhatsApp Groups</CardTitle>
            <Link href="/whatsapp/groups">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {groups.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No groups created yet</p>
                  <Link href="/whatsapp/groups">
                    <Button variant="ghost" size="sm" className="mt-2 text-primary">
                      Create Group
                    </Button>
                  </Link>
                </div>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{group.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{group.group_type}</p>
                      </div>
                    </div>
                    <Link href={`/whatsapp/send?group=${group.id}`}>
                      <Button variant="ghost" size="sm" icon={<Send className="h-4 w-4" />}>
                        Send
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Messages</CardTitle>
          <Link href="/whatsapp/logs">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentMessages.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No messages sent yet</p>
              <Link href="/whatsapp/send">
                <Button variant="ghost" size="sm" className="mt-2 text-primary">
                  Send First Message
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            msg.message_type === 'group'
                              ? 'info'
                              : msg.message_type === 'broadcast'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {msg.message_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {msg.recipient_phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {msg.content}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(msg.status)}
                          {getStatusBadge(msg.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(msg.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
