'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Settings2, Database, RefreshCw, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function SystemSettingsPage() {
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

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Database</p>
              <p className="text-2xl font-bold text-green-700 mt-1">Connected</p>
              <p className="text-xs text-green-500 mt-2">Supabase PostgreSQL</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">API Server</p>
              <p className="text-2xl font-bold text-green-700 mt-1">Running</p>
              <p className="text-xs text-green-500 mt-2">Next.js 15</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Storage</p>
              <p className="text-2xl font-bold text-green-700 mt-1">Active</p>
              <p className="text-xs text-green-500 mt-2">Supabase Storage</p>
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
            <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />}>
              Run Vacuum
            </Button>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Reindex Tables</p>
              <p className="text-sm text-gray-500">Rebuild database indexes for better performance</p>
            </div>
            <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />}>
              Reindex
            </Button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Clear Cache</p>
              <p className="text-sm text-gray-500">Clear application and database cache</p>
            </div>
            <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />}>
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
            <Button variant="danger" size="sm">
              Reset Demo
            </Button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Purge Inactive Schools</p>
              <p className="text-sm text-gray-500">Remove schools inactive for more than 1 year</p>
            </div>
            <Button variant="danger" size="sm">
              Purge Schools
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
