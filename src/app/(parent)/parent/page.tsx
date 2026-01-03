'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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
} from 'lucide-react'

// Mock data - In production, this would come from the database
const children = [
  {
    id: '1',
    name: 'Rahul Kumar',
    class: 'Class 10-A',
    rollNo: '01',
    admissionNo: 'MIPS/2024/001',
    photo: null,
  },
  {
    id: '2',
    name: 'Priya Kumar',
    class: 'Class 7-B',
    rollNo: '15',
    admissionNo: 'MIPS/2024/089',
    photo: null,
  },
]

const recentUpdates = [
  {
    type: 'attendance',
    message: 'Rahul was marked present today',
    time: '2 hours ago',
    icon: CheckCircle,
    color: 'text-green-500',
  },
  {
    type: 'fee',
    message: 'Fee for January 2025 is due on 10th Jan',
    time: '1 day ago',
    icon: AlertCircle,
    color: 'text-yellow-500',
  },
  {
    type: 'exam',
    message: 'Unit Test 2 results published',
    time: '3 days ago',
    icon: FileText,
    color: 'text-blue-500',
  },
  {
    type: 'notice',
    message: 'School will remain closed on 1st January',
    time: '5 days ago',
    icon: Bell,
    color: 'text-purple-500',
  },
]

const upcomingEvents = [
  { date: 'Jan 1', event: 'New Year Holiday' },
  { date: 'Jan 10', event: 'Fee Due Date' },
  { date: 'Jan 15', event: 'PTM Meeting' },
  { date: 'Jan 26', event: 'Republic Day' },
]

export default function ParentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Parent Portal</h1>
                <p className="text-xs text-gray-500">Manas International Public School</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="h-5 w-5 text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">PK</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Parent Kumar</span>
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
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
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
                    <p className="text-2xl font-bold">{children.length}</p>
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
                    <p className="text-2xl font-bold">95%</p>
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
                    <p className="text-2xl font-bold">₹5,000</p>
                    <p className="text-xs text-gray-500">Due Fees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-gray-500">New Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Children Cards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Children</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((child) => (
                <Card key={child.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-500">
                          {child.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{child.name}</h4>
                        <p className="text-sm text-gray-500">{child.class}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Roll No: {child.rollNo} | {child.admissionNo}
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
                          <Link href={`/parent/results?child=${child.id}`}>
                            <Badge variant="success" className="cursor-pointer">
                              Results
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {recentUpdates.map((update, index) => (
                    <div key={index} className="px-6 py-4 flex items-start gap-3">
                      <update.icon className={`h-5 w-5 mt-0.5 ${update.color}`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{update.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{update.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="px-6 py-4 flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-sm font-semibold text-primary">{event.date}</p>
                      </div>
                      <p className="text-sm text-gray-900">{event.event}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/parent/fees">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <IndianRupee className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                  <p className="font-medium text-gray-900">Pay Fees</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/parent/results">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="font-medium text-gray-900">View Results</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/parent/attendance">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="font-medium text-gray-900">Attendance</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/parent/messages">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <p className="font-medium text-gray-900">Messages</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
