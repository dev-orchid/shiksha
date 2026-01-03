'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  User,
  Calendar,
  BookOpen,
  IndianRupee,
  FileText,
  Phone,
  Mail,
  MapPin,
  Award,
} from 'lucide-react'

// Mock data
const childData = {
  id: '1',
  name: 'Rahul Kumar',
  class: 'Class 10-A',
  rollNo: '01',
  admissionNo: 'MIPS/2024/001',
  dateOfBirth: '2009-05-15',
  gender: 'Male',
  bloodGroup: 'B+',
  address: '123, Main Street, New Delhi - 110001',
  photo: null,
  classTeacher: 'Mrs. Anita Sharma',
  house: 'Blue House',
  transport: 'Route 5 - Sector 21',
  subjects: [
    { name: 'English', teacher: 'Mrs. Sunita' },
    { name: 'Hindi', teacher: 'Mr. Rajesh' },
    { name: 'Mathematics', teacher: 'Mr. Vikram' },
    { name: 'Science', teacher: 'Mrs. Priya' },
    { name: 'Social Science', teacher: 'Mr. Arun' },
  ],
  recentResults: [
    { exam: 'Unit Test 2', percentage: 85, grade: 'A', rank: 5 },
    { exam: 'Half Yearly', percentage: 82, grade: 'A', rank: 8 },
    { exam: 'Unit Test 1', percentage: 78, grade: 'B+', rank: 12 },
  ],
  attendance: {
    present: 142,
    absent: 8,
    total: 150,
    percentage: 94.67,
  },
  feeStatus: {
    totalDue: 5000,
    lastPaid: '2024-12-15',
    nextDue: '2025-01-10',
  },
}

export default function ChildProfilePage() {
  const params = useParams()
  const childId = params.id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/parent">
              <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-500">
                    {childData.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{childData.name}</h1>
                      <p className="text-gray-500">{childData.class}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="info">Roll No: {childData.rollNo}</Badge>
                        <Badge variant="default">{childData.admissionNo}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/parent/attendance?child=${childId}`}>
                        <Button variant="outline" size="sm">
                          View Attendance
                        </Button>
                      </Link>
                      <Link href={`/parent/results?child=${childId}`}>
                        <Button variant="outline" size="sm">
                          View Results
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{new Date(childData.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium">{childData.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Blood Group</p>
                      <p className="font-medium">{childData.bloodGroup}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">House</p>
                      <p className="font-medium">{childData.house}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium flex items-start gap-1">
                        <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                        {childData.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Class Teacher</p>
                      <p className="font-medium">{childData.classTeacher}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Transport</p>
                      <p className="font-medium">{childData.transport}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subjects & Teachers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Subjects & Teachers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200">
                    {childData.subjects.map((subject, index) => (
                      <div key={index} className="px-6 py-3 flex items-center justify-between">
                        <span className="font-medium text-gray-900">{subject.name}</span>
                        <span className="text-sm text-gray-500">{subject.teacher}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Recent Exam Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200">
                    {childData.recentResults.map((result, index) => (
                      <div key={index} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{result.exam}</p>
                          <p className="text-sm text-gray-500">Class Rank: #{result.rank}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{result.percentage}%</p>
                          <Badge
                            variant={
                              result.grade.startsWith('A')
                                ? 'success'
                                : result.grade.startsWith('B')
                                ? 'info'
                                : 'warning'
                            }
                          >
                            Grade: {result.grade}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Attendance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-green-600">
                      {childData.attendance.percentage}%
                    </p>
                    <p className="text-sm text-gray-500">Overall Attendance</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Present Days</span>
                      <span className="font-medium text-green-600">
                        {childData.attendance.present}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Absent Days</span>
                      <span className="font-medium text-red-600">
                        {childData.attendance.absent}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Working Days</span>
                      <span className="font-medium">{childData.attendance.total}</span>
                    </div>
                  </div>
                  <Link href={`/parent/attendance?child=${childId}`}>
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      View Full Attendance
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Fee Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Fee Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-yellow-600">
                      ₹{childData.feeStatus.totalDue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Total Due</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Payment</span>
                      <span className="font-medium">
                        {new Date(childData.feeStatus.lastPaid).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Next Due Date</span>
                      <span className="font-medium text-red-600">
                        {new Date(childData.feeStatus.nextDue).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <Link href={`/parent/fees?child=${childId}`}>
                    <Button className="w-full mt-4" size="sm">
                      Pay Fees
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/parent/results?child=${childId}`}>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Download Report Card
                    </Button>
                  </Link>
                  <Link href="/parent/messages">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Message Class Teacher
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact School
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
