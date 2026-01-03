'use client'

import { useState } from 'react'
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

// Mock data
const recentMessages = [
  {
    id: '1',
    type: 'group',
    recipient: 'Class 10-A Parents',
    message: 'Fee reminder for December month...',
    status: 'delivered',
    sentAt: '2024-12-30 10:30 AM',
  },
  {
    id: '2',
    type: 'individual',
    recipient: '+91 9876543210',
    message: 'Attendance alert: Rahul Kumar was absent...',
    status: 'read',
    sentAt: '2024-12-30 09:15 AM',
  },
  {
    id: '3',
    type: 'broadcast',
    recipient: 'All Parents',
    message: 'School will remain closed on Jan 1st...',
    status: 'sent',
    sentAt: '2024-12-29 04:00 PM',
  },
  {
    id: '4',
    type: 'individual',
    recipient: '+91 9876543211',
    message: 'Exam schedule for Unit Test 3...',
    status: 'failed',
    sentAt: '2024-12-29 02:30 PM',
  },
]

const groups = [
  { id: '1', name: 'Class 10-A Parents', members: 42, type: 'class' },
  { id: '2', name: 'Class 9-B Parents', members: 38, type: 'class' },
  { id: '3', name: 'Teachers Group', members: 56, type: 'teachers' },
  { id: '4', name: 'School Announcements', members: 1250, type: 'custom' },
]

export default function WhatsAppPage() {
  const [isConnected, setIsConnected] = useState(true)

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
      <Card className={isConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                <Smartphone className={`h-6 w-6 ${isConnected ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {isConnected ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
                </p>
                <p className="text-sm text-gray-500">
                  {isConnected
                    ? 'Connected to +91 9876543210'
                    : 'Please scan QR code to connect'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Badge variant="success">Online</Badge>
                  <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />}>
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
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-xs text-gray-500">Messages Sent</p>
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
                <p className="text-2xl font-bold">1,180</p>
                <p className="text-xs text-gray-500">Delivered</p>
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
                <p className="text-2xl font-bold">15</p>
                <p className="text-xs text-gray-500">Active Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-gray-500">Templates</p>
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
              <option value="class-10">Class 10 Parents</option>
              <option value="teachers">All Teachers</option>
            </select>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Select template...</option>
              <option value="fee">Fee Reminder</option>
              <option value="attendance">Attendance Alert</option>
              <option value="exam">Exam Schedule</option>
              <option value="general">General Notice</option>
            </select>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              rows={3}
              placeholder="Type your message..."
            />
            <Button className="w-full" icon={<Send className="h-4 w-4" />}>
              Send Message
            </Button>
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
              {groups.map((group) => (
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
                      <p className="text-sm text-gray-500">{group.members} members</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" icon={<Send className="h-4 w-4" />}>
                    Send
                  </Button>
                </div>
              ))}
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
                          msg.type === 'group'
                            ? 'info'
                            : msg.type === 'broadcast'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {msg.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {msg.recipient}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {msg.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(msg.status)}
                        {getStatusBadge(msg.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {msg.sentAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
