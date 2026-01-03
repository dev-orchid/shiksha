'use client'

import { useState } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'

const templates = [
  {
    id: '1',
    name: 'Fee Reminder',
    category: 'fee_reminder',
    content:
      'Dear {{parent_name}}, this is a reminder that {{student_name}}\'s fee of Rs. {{amount}} for {{month}} is due on {{due_date}}. Please pay at the earliest. - Manas International Public School',
  },
  {
    id: '2',
    name: 'Attendance Alert',
    category: 'attendance',
    content:
      'Dear {{parent_name}}, {{student_name}} was marked {{status}} on {{date}}. If you have any concerns, please contact the school. - Manas International Public School',
  },
  {
    id: '3',
    name: 'Exam Schedule',
    category: 'exam',
    content:
      'Dear {{parent_name}}, please note that {{exam_name}} for {{student_name}} (Class {{class}}) will start from {{start_date}}. Please ensure your ward is well prepared. - Manas International Public School',
  },
  {
    id: '4',
    name: 'General Notice',
    category: 'general',
    content: '{{message}} - Manas International Public School',
  },
]

export default function SendMessagePage() {
  const [sendType, setSendType] = useState<'individual' | 'group' | 'broadcast'>('individual')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setMessage(template.content)
    }
  }

  const handleSend = async () => {
    setSending(true)
    // TODO: Implement actual sending
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setSending(false)
    alert('Message sent successfully!')
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
                />
              )}
              {sendType === 'group' && (
                <Select
                  label="Select Group"
                  options={[
                    { value: 'class-10-a', label: 'Class 10-A Parents' },
                    { value: 'class-9-b', label: 'Class 9-B Parents' },
                    { value: 'teachers', label: 'Teachers Group' },
                  ]}
                  placeholder="Choose a group"
                />
              )}
              {sendType === 'broadcast' && (
                <div className="space-y-4">
                  <Select
                    label="Recipient Type"
                    options={[
                      { value: 'all_parents', label: 'All Parents' },
                      { value: 'class_parents', label: 'Class-wise Parents' },
                      { value: 'all_staff', label: 'All Staff' },
                    ]}
                    placeholder="Select recipient type"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Class (Optional)"
                      options={[
                        { value: 'class-10', label: 'Class 10' },
                        { value: 'class-9', label: 'Class 9' },
                        { value: 'class-8', label: 'Class 8' },
                      ]}
                      placeholder="All Classes"
                    />
                    <Select
                      label="Section (Optional)"
                      options={[
                        { value: 'A', label: 'Section A' },
                        { value: 'B', label: 'Section B' },
                        { value: 'C', label: 'Section C' },
                      ]}
                      placeholder="All Sections"
                    />
                  </div>
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
                  {message.length}/1000 characters
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" icon={<Image className="h-4 w-4" />}>
                  Add Image
                </Button>
                <Button variant="outline" size="sm" icon={<Paperclip className="h-4 w-4" />}>
                  Add File
                </Button>
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
                  <p className="text-xs text-gray-400 text-right mt-1">10:30 AM</p>
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
                <span className="text-gray-500">Recipients</span>
                <span className="font-medium">
                  {sendType === 'broadcast' ? '~1250' : '1'}
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
                disabled={!message.trim()}
              >
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
