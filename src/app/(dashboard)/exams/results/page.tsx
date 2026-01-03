'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  Download,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface Exam {
  id: string
  name: string
  status: string
  exam_schedules?: ExamSchedule[]
}

interface ExamSchedule {
  id: string
  exam_id: string
  class_id: string
  subject_id: string
  max_marks: number
  passing_marks: number
  subjects?: { id: string; name: string }
  classes?: { id: string; name: string }
}

interface ClassItem {
  id: string
  name: string
}

interface Student {
  id: string
  first_name: string
  last_name: string
  roll_number: string
  admission_number: string
}

interface ExamResult {
  id?: string
  exam_schedule_id: string
  student_id: string
  marks_obtained: number
  is_absent?: boolean
}

interface GradeSetting {
  grade: string
  min_percentage: number
  max_percentage: number
}

interface ResultEntry {
  studentId: string
  marks: { [scheduleId: string]: number | null }
  isAbsent: { [scheduleId: string]: boolean }
}

export default function ExamResultsPage() {
  const searchParams = useSearchParams()
  const examIdParam = searchParams.get('exam')

  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Data from API
  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [gradeSettings, setGradeSettings] = useState<GradeSetting[]>([])

  // Selected values
  const [selectedExam, setSelectedExam] = useState(examIdParam || '')
  const [selectedClass, setSelectedClass] = useState('')

  // Current exam schedules (subjects for the selected class)
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])

  // Results
  const [results, setResults] = useState<ResultEntry[]>([])

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (examIdParam && exams.length > 0) {
      setSelectedExam(examIdParam)
    }
  }, [examIdParam, exams])

  useEffect(() => {
    if (selectedExam && selectedClass) {
      loadResultsData()
    }
  }, [selectedExam, selectedClass])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [examsRes, classesRes, gradesRes] = await Promise.all([
        fetch('/api/exams'),
        fetch('/api/classes'),
        fetch('/api/grade-settings'),
      ])

      if (examsRes.ok) {
        const data = await examsRes.json()
        // Filter to only show completed exams or all exams
        setExams(data.data || [])
      }

      if (classesRes.ok) {
        const data = await classesRes.json()
        setClasses(data.data || [])
      }

      if (gradesRes.ok) {
        const data = await gradesRes.json()
        setGradeSettings(data.data || [])
      }
    } catch {
      console.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const loadResultsData = async () => {
    setLoadingStudents(true)
    setError('')
    try {
      // Get the selected exam to find its schedules
      const exam = exams.find(e => e.id === selectedExam)
      if (!exam) return

      // Filter schedules for the selected class
      const classSchedules = exam.exam_schedules?.filter(s => s.class_id === selectedClass) || []
      setSchedules(classSchedules)

      if (classSchedules.length === 0) {
        setStudents([])
        setResults([])
        setLoadingStudents(false)
        return
      }

      // Fetch students for the selected class
      const studentsRes = await fetch(`/api/students?class_id=${selectedClass}`)
      let studentsData: Student[] = []
      if (studentsRes.ok) {
        const data = await studentsRes.json()
        studentsData = data.data || []
        setStudents(studentsData)
      }

      // Fetch existing results for this exam and class
      const scheduleIds = classSchedules.map(s => s.id)
      const resultsRes = await fetch(`/api/exam-results?exam_id=${selectedExam}&class_id=${selectedClass}`)
      let existingResults: ExamResult[] = []
      if (resultsRes.ok) {
        const data = await resultsRes.json()
        existingResults = data.data || []
      }

      // Initialize results state with existing data
      const initialResults: ResultEntry[] = studentsData.map(student => {
        const marks: { [scheduleId: string]: number | null } = {}
        const isAbsent: { [scheduleId: string]: boolean } = {}

        classSchedules.forEach(schedule => {
          const existingResult = existingResults.find(
            r => r.student_id === student.id && r.exam_schedule_id === schedule.id
          )
          marks[schedule.id] = existingResult?.marks_obtained ?? null
          isAbsent[schedule.id] = existingResult?.is_absent ?? false
        })

        return {
          studentId: student.id,
          marks,
          isAbsent,
        }
      })

      setResults(initialResults)
    } catch {
      setError('Failed to load data')
    } finally {
      setLoadingStudents(false)
    }
  }

  const updateMarks = (studentId: string, scheduleId: string, value: string) => {
    const marksNum = value === '' ? null : parseInt(value)
    setResults(prev =>
      prev.map(r =>
        r.studentId === studentId
          ? { ...r, marks: { ...r.marks, [scheduleId]: marksNum } }
          : r
      )
    )
  }

  const toggleAbsent = (studentId: string, scheduleId: string) => {
    setResults(prev =>
      prev.map(r => {
        if (r.studentId !== studentId) return r
        const newIsAbsent = !r.isAbsent[scheduleId]
        return {
          ...r,
          isAbsent: { ...r.isAbsent, [scheduleId]: newIsAbsent },
          marks: { ...r.marks, [scheduleId]: newIsAbsent ? 0 : r.marks[scheduleId] },
        }
      })
    )
  }

  const getTotal = (studentResult: ResultEntry) => {
    return Object.values(studentResult.marks)
      .filter((v): v is number => v !== null)
      .reduce((sum, m) => sum + m, 0)
  }

  const getMaxTotal = () => {
    return schedules.reduce((sum, s) => sum + s.max_marks, 0)
  }

  const getPercentage = (studentResult: ResultEntry) => {
    const total = getTotal(studentResult)
    const maxTotal = getMaxTotal()
    if (maxTotal === 0) return 0
    return (total / maxTotal) * 100
  }

  const getGrade = (percentage: number) => {
    // Use grade settings if available
    if (gradeSettings.length > 0) {
      const setting = gradeSettings.find(
        g => percentage >= g.min_percentage && percentage <= g.max_percentage
      )
      if (setting) {
        return { grade: setting.grade, color: percentage >= 50 ? 'text-green-600' : percentage >= 33 ? 'text-yellow-600' : 'text-red-600' }
      }
    }

    // Fallback to default grades
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' }
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600' }
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600' }
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-600' }
    if (percentage >= 50) return { grade: 'C+', color: 'text-yellow-600' }
    if (percentage >= 40) return { grade: 'C', color: 'text-yellow-600' }
    if (percentage >= 33) return { grade: 'D', color: 'text-orange-600' }
    return { grade: 'F', color: 'text-red-600' }
  }

  const isPassing = (marks: number | null, passingMarks: number) => {
    return marks !== null && marks >= passingMarks
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Prepare results data
      const resultsToSave: any[] = []

      results.forEach(result => {
        schedules.forEach(schedule => {
          const marks = result.marks[schedule.id]
          if (marks !== null) {
            resultsToSave.push({
              exam_schedule_id: schedule.id,
              student_id: result.studentId,
              marks_obtained: marks,
              is_absent: result.isAbsent[schedule.id] || false,
            })
          }
        })
      })

      if (resultsToSave.length === 0) {
        setError('No marks entered to save')
        setSaving(false)
        return
      }

      const response = await fetch('/api/exam-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: resultsToSave }),
      })

      if (response.ok) {
        setSuccess('Results saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save results')
      }
    } catch {
      setError('Failed to save results')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    if (students.length === 0 || schedules.length === 0) return

    const exam = exams.find(e => e.id === selectedExam)
    const classItem = classes.find(c => c.id === selectedClass)

    // Build CSV
    let csv = 'Roll No,Student Name,'
    csv += schedules.map(s => s.subjects?.name || 'Subject').join(',')
    csv += ',Total,Percentage,Grade\n'

    students.forEach(student => {
      const result = results.find(r => r.studentId === student.id)
      if (!result) return

      csv += `${student.roll_number || '-'},${student.first_name} ${student.last_name},`
      csv += schedules.map(s => result.marks[s.id] ?? '-').join(',')

      const total = getTotal(result)
      const percentage = getPercentage(result)
      const grade = getGrade(percentage)

      csv += `,${total},${percentage.toFixed(1)}%,${grade.grade}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `results_${exam?.name || 'exam'}_${classItem?.name || 'class'}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get available classes for selected exam
  const getAvailableClasses = () => {
    const exam = exams.find(e => e.id === selectedExam)
    if (!exam?.exam_schedules) return classes

    const classIds = [...new Set(exam.exam_schedules.map(s => s.class_id))]
    return classes.filter(c => classIds.includes(c.id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/exams">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enter Exam Results</h1>
          <p className="text-gray-500 mt-1">Enter marks for students</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              label="Select Exam"
              options={[
                { value: '', label: 'Choose an exam' },
                ...exams.map(e => ({ value: e.id, label: e.name })),
              ]}
              value={selectedExam}
              onChange={(e) => {
                setSelectedExam(e.target.value)
                setSelectedClass('')
              }}
              className="flex-1"
            />
            <Select
              label="Select Class"
              options={[
                { value: '', label: 'Choose class' },
                ...getAvailableClasses().map(c => ({ value: c.id, label: c.name })),
              ]}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="flex-1"
              disabled={!selectedExam}
            />
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                icon={<Download className="h-4 w-4" />}
                onClick={handleExport}
                disabled={students.length === 0}
              >
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedExam && selectedClass && (
        <>
          {loadingStudents ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : schedules.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">No subjects scheduled for this exam and class combination.</p>
              </CardContent>
            </Card>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">No students found in this class.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results Entry */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Results Entry</CardTitle>
                    <CardDescription>Enter marks for each student and subject</CardDescription>
                  </div>
                  <Button
                    icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Results'}
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-y border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                            Roll No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-16 bg-gray-50 min-w-[150px]">
                            Student Name
                          </th>
                          {schedules.map((schedule) => (
                            <th
                              key={schedule.id}
                              className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[100px]"
                            >
                              {schedule.subjects?.name || 'Subject'}
                              <br />
                              <span className="text-gray-400 font-normal">
                                (Max: {schedule.max_marks})
                              </span>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            %
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Grade
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {students.map((student) => {
                          const studentResult = results.find((r) => r.studentId === student.id)
                          if (!studentResult) return null

                          const total = getTotal(studentResult)
                          const percentage = getPercentage(studentResult)
                          const gradeInfo = getGrade(percentage)

                          return (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                {student.roll_number || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 sticky left-16 bg-white">
                                {student.first_name} {student.last_name}
                              </td>
                              {schedules.map((schedule) => {
                                const marks = studentResult.marks[schedule.id] ?? null
                                const isAbsent = studentResult.isAbsent[schedule.id]
                                const passing = isPassing(marks, schedule.passing_marks)
                                return (
                                  <td key={schedule.id} className="px-4 py-3">
                                    <div className="relative flex items-center gap-1">
                                      <input
                                        type="number"
                                        min="0"
                                        max={schedule.max_marks}
                                        value={marks ?? ''}
                                        onChange={(e) =>
                                          updateMarks(student.id, schedule.id, e.target.value)
                                        }
                                        disabled={isAbsent}
                                        className={`w-16 px-2 py-1 border rounded text-center text-sm ${
                                          isAbsent
                                            ? 'bg-gray-100 border-gray-200 text-gray-400'
                                            : marks !== null
                                            ? passing
                                              ? 'border-green-300 bg-green-50'
                                              : 'border-red-300 bg-red-50'
                                            : 'border-gray-300'
                                        }`}
                                        placeholder="-"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => toggleAbsent(student.id, schedule.id)}
                                        className={`text-xs px-1 py-0.5 rounded ${
                                          isAbsent
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                        title="Mark as absent"
                                      >
                                        AB
                                      </button>
                                      {marks !== null && !isAbsent && (
                                        <span className="absolute -right-1 -top-1">
                                          {passing ? (
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                          ) : (
                                            <AlertCircle className="h-3 w-3 text-red-500" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                )
                              })}
                              <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                                {total}/{getMaxTotal()}
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                                {percentage.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`font-bold ${gradeInfo.color}`}>
                                  {gradeInfo.grade}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                      <span>Pass</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                      <span>Fail</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1 bg-red-100 text-red-600 text-xs rounded">AB</span>
                      <span>Absent</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
