'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  FileText,
  Download,
  Printer,
  Users,
  Search,
} from 'lucide-react'

const reportTypes = [
  {
    id: 'report_card',
    name: 'Report Card',
    description: 'Individual student report card with grades and remarks',
    icon: FileText,
  },
  {
    id: 'class_result',
    name: 'Class Result Sheet',
    description: 'Complete result sheet for an entire class',
    icon: Users,
  },
  {
    id: 'progress_report',
    name: 'Progress Report',
    description: 'Term-wise progress comparison for students',
    icon: FileText,
  },
  {
    id: 'toppers_list',
    name: 'Toppers List',
    description: 'Class-wise and subject-wise toppers',
    icon: FileText,
  },
]

const exams = [
  { value: '1', label: 'Unit Test 1 - July 2024' },
  { value: '2', label: 'Half Yearly - Sept 2024' },
  { value: '3', label: 'Unit Test 2 - Nov 2024' },
]

const classes = [
  { value: '10-A', label: 'Class 10 - Section A' },
  { value: '10-B', label: 'Class 10 - Section B' },
  { value: '9-A', label: 'Class 9 - Section A' },
]

const students = [
  { id: '1', name: 'Rahul Kumar', rollNo: '01', class: '10-A' },
  { id: '2', name: 'Priya Sharma', rollNo: '02', class: '10-A' },
  { id: '3', name: 'Amit Singh', rollNo: '03', class: '10-A' },
]

export default function AcademicReportsPage() {
  const [selectedReport, setSelectedReport] = useState('report_card')
  const [selectedExam, setSelectedExam] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setGenerating(false)
    alert('Report generated successfully!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Reports</h1>
          <p className="text-gray-500 mt-1">Generate exam results, report cards, and progress reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Type */}
          <Card>
            <CardHeader>
              <CardTitle>Select Report Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reportTypes.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedReport === report.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <report.icon
                        className={`h-5 w-5 mt-0.5 ${
                          selectedReport === report.id ? 'text-primary' : 'text-gray-400'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{report.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Report Parameters</CardTitle>
              <CardDescription>Select the exam, class, and students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Select Exam"
                options={exams}
                placeholder="Choose an exam"
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
              />
              <Select
                label="Select Class & Section"
                options={classes}
                placeholder="Choose class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              />
              {selectedReport === 'report_card' && (
                <Select
                  label="Select Student (Optional)"
                  options={[
                    { value: '', label: 'All Students' },
                    ...students.map((s) => ({ value: s.id, label: `${s.rollNo}. ${s.name}` })),
                  ]}
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  helperText="Leave empty to generate for all students"
                />
              )}
            </CardContent>
          </Card>

          {/* Report Card Preview */}
          {selectedReport === 'report_card' && selectedExam && selectedClass && (
            <Card>
              <CardHeader>
                <CardTitle>Report Card Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                  {/* School Header */}
                  <div className="text-center border-b pb-4 mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      MANAS INTERNATIONAL PUBLIC SCHOOL
                    </h2>
                    <p className="text-sm text-gray-500">
                      Affiliated to CBSE, New Delhi
                    </p>
                    <p className="text-lg font-semibold mt-2">REPORT CARD</p>
                    <p className="text-sm text-gray-600">
                      {exams.find((e) => e.value === selectedExam)?.label}
                    </p>
                  </div>

                  {/* Student Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 font-medium">Rahul Kumar</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Class:</span>
                      <span className="ml-2 font-medium">X-A</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Roll No:</span>
                      <span className="ml-2 font-medium">01</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Admission No:</span>
                      <span className="ml-2 font-medium">MIPS/2024/001</span>
                    </div>
                  </div>

                  {/* Marks Table */}
                  <table className="w-full text-sm border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left">Subject</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Max Marks</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Marks Obtained</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { subject: 'English', max: 100, obtained: 85, grade: 'A' },
                        { subject: 'Hindi', max: 100, obtained: 78, grade: 'B+' },
                        { subject: 'Mathematics', max: 100, obtained: 92, grade: 'A+' },
                        { subject: 'Science', max: 100, obtained: 88, grade: 'A' },
                        { subject: 'Social Science', max: 100, obtained: 82, grade: 'A' },
                      ].map((row, i) => (
                        <tr key={i}>
                          <td className="border border-gray-300 px-3 py-2">{row.subject}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{row.max}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                            {row.obtained}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center font-bold text-green-600">
                            {row.grade}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="border border-gray-300 px-3 py-2">Total</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">500</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">425</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-green-600">
                          A
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Result */}
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <span className="text-gray-500">Percentage:</span>
                      <span className="ml-2 font-bold text-lg">85%</span>
                    </div>
                    <Badge variant="success" className="text-base px-4 py-1">
                      PASSED
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Generate Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                icon={<Download className="h-4 w-4" />}
                onClick={handleGenerate}
                loading={generating}
                disabled={!selectedExam || !selectedClass}
              >
                Download PDF
              </Button>
              <Button
                variant="outline"
                className="w-full"
                icon={<Printer className="h-4 w-4" />}
                disabled={!selectedExam || !selectedClass}
              >
                Print Report
              </Button>
              <p className="text-xs text-gray-500 text-center">
                {selectedStudent
                  ? 'Single report card will be generated'
                  : 'Reports for all students will be generated'}
              </p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Class Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Students</span>
                <span className="font-medium">42</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Passed</span>
                <span className="font-medium text-green-600">38</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Failed</span>
                <span className="font-medium text-red-600">4</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Pass Percentage</span>
                <span className="font-medium">90.5%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Class Average</span>
                <span className="font-medium">72.3%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
