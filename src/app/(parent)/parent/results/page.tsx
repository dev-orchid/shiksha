'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Award,
  FileText,
} from 'lucide-react'

// Mock data
const children = [
  { value: '1', label: 'Rahul Kumar - Class 10-A' },
  { value: '2', label: 'Priya Kumar - Class 7-B' },
]

const exams = [
  { value: 'ut2', label: 'Unit Test 2 - November 2024' },
  { value: 'hy', label: 'Half Yearly - September 2024' },
  { value: 'ut1', label: 'Unit Test 1 - July 2024' },
]

const resultData = {
  ut2: {
    examName: 'Unit Test 2',
    examDate: 'November 2024',
    totalMarks: 500,
    obtainedMarks: 425,
    percentage: 85,
    grade: 'A',
    rank: 5,
    totalStudents: 42,
    status: 'passed',
    subjects: [
      { name: 'English', maxMarks: 100, obtained: 85, grade: 'A', classAvg: 72 },
      { name: 'Hindi', maxMarks: 100, obtained: 78, grade: 'B+', classAvg: 68 },
      { name: 'Mathematics', maxMarks: 100, obtained: 92, grade: 'A+', classAvg: 65 },
      { name: 'Science', maxMarks: 100, obtained: 88, grade: 'A', classAvg: 70 },
      { name: 'Social Science', maxMarks: 100, obtained: 82, grade: 'A', classAvg: 74 },
    ],
    remarks: 'Excellent performance! Keep up the good work. Focus more on Hindi.',
    classTeacher: 'Mrs. Anita Sharma',
  },
  hy: {
    examName: 'Half Yearly Examination',
    examDate: 'September 2024',
    totalMarks: 500,
    obtainedMarks: 410,
    percentage: 82,
    grade: 'A',
    rank: 8,
    totalStudents: 42,
    status: 'passed',
    subjects: [
      { name: 'English', maxMarks: 100, obtained: 82, grade: 'A', classAvg: 70 },
      { name: 'Hindi', maxMarks: 100, obtained: 75, grade: 'B+', classAvg: 66 },
      { name: 'Mathematics', maxMarks: 100, obtained: 88, grade: 'A', classAvg: 62 },
      { name: 'Science', maxMarks: 100, obtained: 85, grade: 'A', classAvg: 68 },
      { name: 'Social Science', maxMarks: 100, obtained: 80, grade: 'A', classAvg: 72 },
    ],
    remarks: 'Good performance. Can improve in Hindi and English.',
    classTeacher: 'Mrs. Anita Sharma',
  },
}

export default function ParentResultsPage() {
  const searchParams = useSearchParams()
  const childParam = searchParams.get('child')
  const [selectedChild, setSelectedChild] = useState(childParam || '1')
  const [selectedExam, setSelectedExam] = useState('ut2')

  const data = resultData[selectedExam as keyof typeof resultData]

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600'
    if (grade.startsWith('B')) return 'text-blue-600'
    if (grade.startsWith('C')) return 'text-yellow-600'
    if (grade.startsWith('D')) return 'text-orange-600'
    return 'text-red-600'
  }

  const getPerformanceIndicator = (obtained: number, classAvg: number) => {
    const diff = obtained - classAvg
    if (diff > 0) {
      return (
        <span className="flex items-center text-green-600 text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{diff} above avg
        </span>
      )
    } else if (diff < 0) {
      return (
        <span className="flex items-center text-red-600 text-xs">
          <TrendingDown className="h-3 w-3 mr-1" />
          {diff} below avg
        </span>
      )
    }
    return <span className="text-gray-500 text-xs">At class average</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/parent">
                <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="font-semibold text-gray-900">Exam Results</h1>
                <p className="text-xs text-gray-500">View academic performance</p>
              </div>
            </div>
            <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>
              Download Report Card
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              label="Select Child"
              options={children}
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="sm:w-64"
            />
            <Select
              label="Select Exam"
              options={exams}
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="sm:w-64"
            />
          </div>

          {/* Result Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{data.percentage}%</p>
                <p className="text-xs text-gray-500">Percentage</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${getGradeColor(data.grade)}`}>{data.grade}</p>
                <p className="text-xs text-gray-500">Grade</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {data.obtainedMarks}/{data.totalMarks}
                </p>
                <p className="text-xs text-gray-500">Total Marks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <p className="text-3xl font-bold text-gray-900">#{data.rank}</p>
                </div>
                <p className="text-xs text-gray-500">Class Rank</p>
              </CardContent>
            </Card>
            <Card className={data.status === 'passed' ? 'bg-green-50' : 'bg-red-50'}>
              <CardContent className="p-4 text-center">
                <Badge
                  variant={data.status === 'passed' ? 'success' : 'danger'}
                  className="text-base px-4 py-1"
                >
                  {data.status === 'passed' ? 'PASSED' : 'FAILED'}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">out of {data.totalStudents} students</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subject-wise Results */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Subject-wise Results</CardTitle>
                  <CardDescription>{data.examName} - {data.examDate}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-y border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Subject
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Max Marks
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Obtained
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Grade
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            vs Class Avg
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.subjects.map((subject, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-900">{subject.name}</p>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-500">
                              {subject.maxMarks}
                            </td>
                            <td className="px-6 py-4 text-center font-semibold text-gray-900">
                              {subject.obtained}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-bold ${getGradeColor(subject.grade)}`}>
                                {subject.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {getPerformanceIndicator(subject.obtained, subject.classAvg)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-6 py-4">Total</td>
                          <td className="px-6 py-4 text-center">{data.totalMarks}</td>
                          <td className="px-6 py-4 text-center">{data.obtainedMarks}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={getGradeColor(data.grade)}>{data.grade}</span>
                          </td>
                          <td className="px-6 py-4 text-center">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Teacher's Remarks */}
              <Card>
                <CardHeader>
                  <CardTitle>Teacher's Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 italic">&quot;{data.remarks}&quot;</p>
                  <p className="text-sm text-gray-500 mt-3">- {data.classTeacher}</p>
                </CardContent>
              </Card>

              {/* Performance Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['ut2', 'hy', 'ut1'].map((exam) => {
                      const examData = resultData[exam as keyof typeof resultData]
                      if (!examData) return null
                      return (
                        <div key={exam} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">{examData.examName}</span>
                              <span className="font-medium">{examData.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary rounded-full h-2"
                                style={{ width: `${examData.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Download Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Download</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Report Card (PDF)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Marks Statement
                  </Button>
                </CardContent>
              </Card>

              {/* Grade Scale */}
              <Card>
                <CardHeader>
                  <CardTitle>Grade Scale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-green-600 font-medium">A+ (90-100%)</span>
                      <span className="text-green-600 font-medium">A (80-89%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600 font-medium">B+ (70-79%)</span>
                      <span className="text-blue-600 font-medium">B (60-69%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600 font-medium">C+ (50-59%)</span>
                      <span className="text-yellow-600 font-medium">C (40-49%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600 font-medium">D (33-39%)</span>
                      <span className="text-red-600 font-medium">F (Below 33%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
