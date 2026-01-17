'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Settings2, Database, RefreshCw, AlertTriangle, Loader2, CheckCircle, Users, School, GraduationCap, UserCheck } from 'lucide-react'
import Link from 'next/link'

interface SystemStatus {
  database: string
  api: string
  storage: string
}

interface Statistics {
  total_schools: number
  total_users: number
  total_students: number
  total_staff: number
}

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const [status, setStatus] = useState<SystemStatus>({
    database: 'checking',
    api: 'checking',
    storage: 'checking',
  })

  const [statistics, setStatistics] = useState<Statistics>({
    total_schools: 0,
    total_users: 0,
    total_students: 0,
    total_staff: 0,
  })

  useEffect(() => {
    fetchSystemStatus()
  }, [])

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/super-admin/settings/system')
      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
        setStatistics(data.statistics)
      } else {
        setStatus({
          database: 'error',
          api: 'error',
          storage: 'error',
        })
      }
    } catch (error) {
      console.error('Error fetching system status:', error)
      setStatus({
        database: 'error',
        api: 'error',
        storage: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (action: string, confirmMessage?: string) => {
    if (confirmMessage && !confirm(confirmMessage)) {
      return
    }

    setActionLoading(action)
    setMessage(null)

    try {
      const response = await fetch('/api/super-admin/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: data.schools ? 'info' : 'success',
          text: data.message + (data.schools ? ` Schools: ${data.schools.join(', ')}` : ''),
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Action failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
      case 'running':
      case 'active':
        return 'bg-green-50 text-green-700'
      case 'checking':
        return 'bg-yellow-50 text-yellow-700'
      case 'error':
        return 'bg-red-50 text-red-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  const getStatusLabel = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
        return 'Connected'
      case 'running':
        return 'Running'
      case 'active':
        return 'Active'
      case 'checking':
        return 'Checking...'
      case 'error':
        return 'Error'
      default:
        return statusValue
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-500 mt-1">Advanced system settings and maintenance</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : message.type === 'info'
              ? 'bg-blue-50 text-blue-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              System Status
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSystemStatus}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-4 rounded-lg ${getStatusColor(status.database)}`}>
              <p className="text-sm font-medium">Database</p>
              <p className="text-2xl font-bold mt-1">{getStatusLabel(status.database)}</p>
              <p className="text-xs mt-2 opacity-75">Supabase PostgreSQL</p>
            </div>
            <div className={`p-4 rounded-lg ${getStatusColor(status.api)}`}>
              <p className="text-sm font-medium">API Server</p>
              <p className="text-2xl font-bold mt-1">{getStatusLabel(status.api)}</p>
              <p className="text-xs mt-2 opacity-75">Next.js 15</p>
            </div>
            <div className={`p-4 rounded-lg ${getStatusColor(status.storage)}`}>
              <p className="text-sm font-medium">Storage</p>
              <p className="text-2xl font-bold mt-1">{getStatusLabel(status.storage)}</p>
              <p className="text-xs mt-2 opacity-75">Supabase Storage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Platform Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <School className="h-8 w-8 mx-auto text-blue-600" />
              <p className="text-2xl font-bold text-blue-700 mt-2">{statistics.total_schools}</p>
              <p className="text-sm text-blue-600">Schools</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="h-8 w-8 mx-auto text-green-600" />
              <p className="text-2xl font-bold text-green-700 mt-2">{statistics.total_users}</p>
              <p className="text-sm text-green-600">Users</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <GraduationCap className="h-8 w-8 mx-auto text-purple-600" />
              <p className="text-2xl font-bold text-purple-700 mt-2">{statistics.total_students}</p>
              <p className="text-sm text-purple-600">Students</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <UserCheck className="h-8 w-8 mx-auto text-orange-600" />
              <p className="text-2xl font-bold text-orange-700 mt-2">{statistics.total_staff}</p>
              <p className="text-sm text-orange-600">Staff</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Vacuum Database</p>
              <p className="text-sm text-gray-500">Clean up deleted rows and reclaim storage</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeAction('vacuum_database')}
              loading={actionLoading === 'vacuum_database'}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Run Vacuum
            </Button>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Reindex Tables</p>
              <p className="text-sm text-gray-500">Rebuild database indexes for better performance</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeAction('reindex_tables')}
              loading={actionLoading === 'reindex_tables'}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Reindex
            </Button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Clear Cache</p>
              <p className="text-sm text-gray-500">Clear application and database cache</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeAction('clear_cache')}
              loading={actionLoading === 'clear_cache'}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-red-100">
            <div>
              <p className="font-medium text-gray-900">Reset Demo Data</p>
              <p className="text-sm text-gray-500">Reset all demo schools to initial state</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                executeAction(
                  'reset_demo_data',
                  'Are you sure you want to reset demo data? This will identify demo schools.'
                )
              }
              loading={actionLoading === 'reset_demo_data'}
            >
              Reset Demo
            </Button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Purge Inactive Schools</p>
              <p className="text-sm text-gray-500">Remove schools inactive for more than 1 year</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                executeAction(
                  'purge_inactive_schools',
                  'Are you sure you want to identify inactive schools for purging?'
                )
              }
              loading={actionLoading === 'purge_inactive_schools'}
            >
              Purge Schools
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
