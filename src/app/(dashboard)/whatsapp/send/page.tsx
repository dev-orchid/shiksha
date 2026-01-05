'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  Send,
  Users,
  User,
  FileText,
  Image,
  Paperclip,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useSession } from '@/components/providers/SessionProvider'

interface Template {
  id: string
  name: string
  category: string
  content: string
  variables: string[]
}

interface Group {
  id: string
  name: string
  group_type: string
}

export default function SendMessagePage() {
  const searchParams = useSearchParams()
  const { profile } = useSession()

  const [sendType, setSendType] = useState<'individual' | 'group' | 'broadcast'>('individual')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [message, setMessage] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [recipientType, setRecipientType] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)

  const [templates, setTemplates] = useState<Template[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const schoolId = profile?.schoolId
      const params = schoolId ? `?school_id=${schoolId}` : ''

      const [templatesRes, groupsRes] = await Promise.all([
        fetch(`/api/whatsapp/templates${params}`),
        fetch(`/api/whatsapp/groups${params}`),
      ])

      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.data || [])
      }

      if (groupsRes.ok) {
        const data = await groupsRes.json()
        setGroups(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.schoolId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Pre-select group from URL params
  useEffect(() => {
    const groupId = searchParams.get('group')
    if (groupId) {
      setSelectedGroup(groupId)
      setSendType('group')
    }
  }, [searchParams])

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setMessage(template.content)
    }
  }

  const handleSend = async () => {
    if (!message.trim()) {
      setSendResult({ success: false, message: 'Please enter a message' })
      return
    }

    if (sendType === 'individual' && !phoneNumber.trim()) {
      setSendResult({ success: false, message: 'Please enter a phone number' })
      return
    }

    if (sendType === 'group' && !selectedGroup) {
      setSendResult({ success: false, message: 'Please select a group' })
      return
    }

    setSending(true)
    setSendResult(null)

    try {
      const payload: Record<string, unknown> = {
        school_id: profile?.schoolId,
        message_type: sendType,
        message: message,
        sent_by: profile?.id,
      }

      if (selectedTemplate) {
        payload.template_id = selectedTemplate
      }

      if (sendType === 'individual') {
        payload.recipient = phoneNumber
      } else if (sendType === 'group') {
        payload.group_id = selectedGroup
      } else if (sendType === 'broadcast') {
        // For broadcast, we'd need to fetch recipient phone numbers
        // This is a simplified example - in production, you'd fetch from students/parents
        payload.recipients = [] // Would be populated with actual phone numbers
      }

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        setSendResult({
          success: true,
          message: data.message || 'Message sent successfully!',
        })
        // Reset form on success
        setMessage('')
        setPhoneNumber('')
        setSelectedTemplate('')
      } else {
        setSendResult({
          success: false,
          message: data.error || 'Failed to send message',
        })
      }
    } catch (error) {
      setSendResult({
        success: false,
        message: 'An error occurred while sending the message',
      })
    } finally {
      setSending(false)
    }
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
      <div className="flex items-center gap-4">
        <Link href="/whatsapp">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Send WhatsApp Message</h1>
          <p className="text-gray-500 mt-1">Send messages to individuals, groups, or broadcast</p>
        </div>
      </div>

      {/* Result Alert */}
      {sendResult && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          {sendResult.success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <p className={sendResult.success ? 'text-green-800' : 'text-red-800'}>
            {sendResult.message}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message Type */}
          <Card>
            <CardHeader>
              <CardTitle>Message Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setSendType('individual')}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    sendType === 'individual'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className={`h-6 w-6 mx-auto mb-2 ${sendType === 'individual' ? 'text-primary' : 'text-gray-400'}`} />
                  <p className="font-medium text-sm">Individual</p>
                  <p className="text-xs text-gray-500">Send to one person</p>
                </button>
                <button
                  onClick={() => setSendType('group')}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    sendType === 'group'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className={`h-6 w-6 mx-auto mb-2 ${sendType === 'group' ? 'text-primary' : 'text-gray-400'}`} />
                  <p className="font-medium text-sm">Group</p>
                  <p className="text-xs text-gray-500">Send to a group</p>
                </button>
                <button
                  onClick={() => setSendType('broadcast')}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    sendType === 'broadcast'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Send className={`h-6 w-6 mx-auto mb-2 ${sendType === 'broadcast' ? 'text-primary' : 'text-gray-400'}`} />
                  <p className="font-medium text-sm">Broadcast</p>
                  <p className="text-xs text-gray-500">Send to many</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recipient Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sendType === 'individual' && (
                <Input
                  label="Phone Number"
                  placeholder="+91 9876543210"
                  helperText="Enter phone number with country code"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              )}
              {sendType === 'group' && (
                <Select
                  label="Select Group"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  options={groups.map((g) => ({ value: g.id, label: g.name }))}
                  placeholder="Choose a group"
                />
              )}
              {sendType === 'broadcast' && (
                <div className="space-y-4">
                  <Select
                    label="Recipient Type"
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    options={[
                      { value: 'all_parents', label: 'All Parents' },
                      { value: 'class_parents', label: 'Class-wise Parents' },
                      { value: 'all_staff', label: 'All Staff' },
                    ]}
                    placeholder="Select recipient type"
                  />
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    Note: Broadcast feature requires integration with student/parent database.
                    For now, please use individual or group messaging.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Content */}
          <Card>
            <CardHeader>
              <CardTitle>Message Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Use Template"
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                options={templates.map((t) => ({ value: t.id, label: t.name }))}
                placeholder="Select a template (optional)"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Type your message here..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {message.length}/4096 characters (WhatsApp limit)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" icon={<Image className="h-4 w-4" />} disabled>
                  Add Image
                </Button>
                <Button variant="outline" size="sm" icon={<Paperclip className="h-4 w-4" />} disabled>
                  Add File
                </Button>
                <span className="text-xs text-gray-400">(Coming soon)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[#e5ddd5] rounded-lg p-4">
                <div className="bg-white rounded-lg p-3 shadow-sm max-w-[250px] ml-auto">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {message || 'Your message will appear here...'}
                  </p>
                  <p className="text-xs text-gray-400 text-right mt-1">
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Type</span>
                <span className="font-medium capitalize">{sendType}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Recipient</span>
                <span className="font-medium truncate max-w-[150px]">
                  {sendType === 'individual' && (phoneNumber || '-')}
                  {sendType === 'group' && (groups.find((g) => g.id === selectedGroup)?.name || '-')}
                  {sendType === 'broadcast' && (recipientType || '-')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Characters</span>
                <span className="font-medium">{message.length}</span>
              </div>
              <hr />
              <Button
                className="w-full"
                icon={<Send className="h-4 w-4" />}
                onClick={handleSend}
                loading={sending}
                disabled={!message.trim() || sendType === 'broadcast'}
              >
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {templates.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No templates yet</p>
                  <Link href="/whatsapp/templates">
                    <Button variant="ghost" size="sm" className="mt-1 text-primary">
                      Create Template
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {templates.slice(0, 4).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{template.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
