'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getSupabaseClient } from '@/lib/supabase/client'
import {
  Users,
  Calendar,
  IndianRupee,
  FileText,
  Bell,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  LogOut,
  ChevronDown,
  Loader2,
  CreditCard,
} from 'lucide-react'

interface Child {
  id: string
  first_name: string
  last_name: string
  admission_number: string
  roll_number: string
  photo_url: string | null
  current_class: { id: string; name: string } | null
  current_section: { id: string; name: string } | null
}

interface DashboardData {
  user: {
    id: string
    email: string
    school_id: string
    schools: { id: string; name: string; code: string } | null
  }
  parent: {
    id: string
    first_name: string
    last_name: string
    phone: string
    email: string
  } | null
  children: Child[]
  stats: {
    childrenCount: number
    totalDueFees: number
    attendancePercent: number
  }
  recentUpdates: Array<{
    type: string
    message: string
    time: string
  }>
}

export default function ParentDashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/parent/dashboard')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'fee':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'attendance':
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-purple-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const parentName = data?.parent
    ? `${data.parent.first_name} ${data.parent.last_name}`
    : data?.user?.email?.split('@')[0] || 'Parent'

  const parentInitials = data?.parent
    ? `${data.parent.first_name[0]}${data.parent.last_name?.[0] || ''}`
    : 'P'

  const schoolName = (data?.user?.schools as { name: string } | null)?.name || 'School'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">{schoolName[0]}</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Parent Portal</h1>
                <p className="text-xs text-gray-500">{schoolName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="h-5 w-5 text-gray-500" />
                {(data?.stats?.totalDueFees || 0) > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{parentInitials}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{parentName}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{parentName}</p>
                      <p className="text-xs text-gray-500">{data?.user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Welcome */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back, {data?.parent?.first_name || 'Parent'}!</h2>
            <p className="text-gray-500">Here&apos;s an overview of your children&apos;s activities</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data?.stats?.childrenCount || 0}</p>
                    <p className="text-xs text-gray-500">Children</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data?.stats?.attendancePercent || 0}%</p>
                    <p className="text-xs text-gray-500">Attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <IndianRupee className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      ₹{(data?.stats?.totalDueFees || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Due Fees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Link href="/parent/fees">
              <Card className="bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">Pay</p>
                      <p className="text-xs text-white/80">Fees Now</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Children Cards */}
          {data?.children && data.children.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Children</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.children.map((child) => (
                  <Card key={child.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {child.photo_url ? (
                          <Image
                            src={child.photo_url}
                            alt={`${child.first_name}'s photo`}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-500">
                              {child.first_name[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {child.first_name} {child.last_name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {child.current_class?.name || 'N/A'}
                            {child.current_section?.name && `-${child.current_section.name}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Roll No: {child.roll_number || 'N/A'} | {child.admission_number}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Link href={`/parent/children/${child.id}`}>
                              <Badge variant="default" className="cursor-pointer hover:bg-gray-200">
                                View Profile
                              </Badge>
                            </Link>
                            <Link href={`/parent/attendance?child=${child.id}`}>
                              <Badge variant="info" className="cursor-pointer">
                                Attendance
                              </Badge>
                            </Link>
                            <Link href={`/parent/fees?child=${child.id}`}>
                              <Badge variant="warning" className="cursor-pointer">
                                Fees
                              </Badge>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No children linked to your account yet.</p>
                <p className="text-sm mt-2">Please contact the school administration.</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {data?.recentUpdates && data.recentUpdates.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {data.recentUpdates.map((update, index) => (
                      <div key={index} className="px-6 py-4 flex items-start gap-3">
                        {getUpdateIcon(update.type)}
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{update.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{update.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">No recent updates</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/parent/fees">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer text-center">
                      <IndianRupee className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                      <p className="font-medium text-gray-900 text-sm">Pay Fees</p>
                    </div>
                  </Link>
                  <Link href="/parent/results">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer text-center">
                      <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="font-medium text-gray-900 text-sm">View Results</p>
                    </div>
                  </Link>
                  <Link href="/parent/attendance">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer text-center">
                      <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <p className="font-medium text-gray-900 text-sm">Attendance</p>
                    </div>
                  </Link>
                  <Link href="/parent/fees">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer text-center">
                      <MessageSquare className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                      <p className="font-medium text-gray-900 text-sm">Fee History</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
