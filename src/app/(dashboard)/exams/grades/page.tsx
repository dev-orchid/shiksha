'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Loader2,
} from 'lucide-react'

interface GradeRule {
  id: string
  grade: string
  minPercentage: number
  maxPercentage: number
  gradePoint: number
  description: string
}

const defaultGrades: GradeRule[] = [
  { id: '1', grade: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 10, description: 'Outstanding' },
  { id: '2', grade: 'A', minPercentage: 80, maxPercentage: 89, gradePoint: 9, description: 'Excellent' },
  { id: '3', grade: 'B+', minPercentage: 70, maxPercentage: 79, gradePoint: 8, description: 'Very Good' },
  { id: '4', grade: 'B', minPercentage: 60, maxPercentage: 69, gradePoint: 7, description: 'Good' },
  { id: '5', grade: 'C+', minPercentage: 50, maxPercentage: 59, gradePoint: 6, description: 'Above Average' },
  { id: '6', grade: 'C', minPercentage: 40, maxPercentage: 49, gradePoint: 5, description: 'Average' },
  { id: '7', grade: 'D', minPercentage: 33, maxPercentage: 39, gradePoint: 4, description: 'Below Average' },
  { id: '8', grade: 'E', minPercentage: 0, maxPercentage: 32, gradePoint: 0, description: 'Needs Improvement' },
]

export default function GradeSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [grades, setGrades] = useState<GradeRule[]>(defaultGrades)
  const [passingPercentage, setPassingPercentage] = useState(33)

  useEffect(() => {
    fetchGradeSettings()
  }, [])

  const fetchGradeSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/grade-settings')
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          // Map API data to our GradeRule format
          const mappedGrades: GradeRule[] = data.data.map((g: any) => ({
            id: g.id,
            grade: g.grade,
            minPercentage: g.min_percentage,
            maxPercentage: g.max_percentage,
            gradePoint: g.grade_point || 0,
            description: g.remarks || '',
          }))
          setGrades(mappedGrades)

          // Find passing percentage (lowest grade that's not failing)
          const sortedGrades = mappedGrades.sort((a, b) => a.minPercentage - b.minPercentage)
          const failingGrade = sortedGrades.find(g => g.gradePoint === 0)
          if (failingGrade) {
            setPassingPercentage(failingGrade.maxPercentage + 1)
          }
        }
      }
    } catch {
      console.error('Failed to fetch grade settings')
    } finally {
      setLoading(false)
    }
  }

  const addGrade = () => {
    const newGrade: GradeRule = {
      id: Date.now().toString(),
      grade: '',
      minPercentage: 0,
      maxPercentage: 0,
      gradePoint: 0,
      description: '',
    }
    setGrades([...grades, newGrade])
  }

  const removeGrade = (id: string) => {
    setGrades(grades.filter((g) => g.id !== id))
  }

  const updateGrade = (id: string, field: keyof GradeRule, value: string | number) => {
    setGrades(
      grades.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    )
  }

  const resetToDefault = () => {
    setGrades(defaultGrades)
    setPassingPercentage(33)
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')

    // Validation
    const hasEmptyGrade = grades.some(g => !g.grade.trim())
    if (hasEmptyGrade) {
      setError('All grades must have a name')
      return
    }

    // Check for overlapping ranges
    const sortedGrades = [...grades].sort((a, b) => b.minPercentage - a.minPercentage)
    for (let i = 0; i < sortedGrades.length - 1; i++) {
      if (sortedGrades[i].minPercentage <= sortedGrades[i + 1].maxPercentage) {
        setError('Grade ranges cannot overlap')
        return
      }
    }

    setSaving(true)

    try {
      // Map to API format
      const gradesForApi = grades.map(g => ({
        grade: g.grade,
        min_percentage: g.minPercentage,
        max_percentage: g.maxPercentage,
        grade_point: g.gradePoint,
        remarks: g.description,
      }))

      const response = await fetch('/api/grade-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: gradesForApi }),
      })

      if (response.ok) {
        setSuccess('Grade settings saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
        // Refresh data to get IDs
        fetchGradeSettings()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save grade settings')
      }
    } catch {
      setError('Failed to save grade settings')
    } finally {
      setSaving(false)
    }
  }

  const getGradeColor = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'bg-green-100 text-green-800'
    if (['B+', 'B'].includes(grade)) return 'bg-blue-100 text-blue-800'
    if (['C+', 'C'].includes(grade)) return 'bg-yellow-100 text-yellow-800'
    if (grade === 'D') return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
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
          <h1 className="text-2xl font-bold text-gray-900">Grade Settings</h1>
          <p className="text-gray-500 mt-1">Configure grading scale and passing criteria</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Passing Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Passing Criteria</CardTitle>
              <CardDescription>Set the minimum percentage required to pass</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  label="Passing Percentage"
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-32"
                />
                <span className="text-gray-500 mt-6">%</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Students scoring below {passingPercentage}% will be marked as failed
              </p>
            </CardContent>
          </Card>

          {/* Grade Scale */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Grade Scale</CardTitle>
                <CardDescription>Define grade ranges and grade points</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={resetToDefault}
                >
                  Reset Default
                </Button>
                <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={addGrade}>
                  Add Grade
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Grade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Min %
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Max %
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Grade Point
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {grades
                      .sort((a, b) => b.minPercentage - a.minPercentage)
                      .map((grade) => (
                        <tr key={grade.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={grade.grade}
                              onChange={(e) => updateGrade(grade.id, 'grade', e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center font-bold"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={grade.minPercentage}
                              onChange={(e) =>
                                updateGrade(grade.id, 'minPercentage', parseInt(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                              min={0}
                              max={100}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={grade.maxPercentage}
                              onChange={(e) =>
                                updateGrade(grade.id, 'maxPercentage', parseInt(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                              min={0}
                              max={100}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={grade.gradePoint}
                              onChange={(e) =>
                                updateGrade(grade.id, 'gradePoint', parseInt(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                              min={0}
                              max={10}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={grade.description}
                              onChange={(e) => updateGrade(grade.id, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeGrade(grade.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Grade Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {grades
                .sort((a, b) => b.minPercentage - a.minPercentage)
                .map((grade) => (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={getGradeColor(grade.grade)}>{grade.grade}</Badge>
                      <span className="text-sm text-gray-600">{grade.description}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {grade.minPercentage}-{grade.maxPercentage}%
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button
                className="w-full"
                icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Changes will apply to all future examinations
              </p>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Grade Point Average (GPA)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>GPA is calculated using the formula:</p>
              <div className="p-2 bg-gray-100 rounded text-center font-mono text-xs">
                GPA = Σ(Grade Points × Credits) / Σ Credits
              </div>
              <p>Grade points are assigned to each grade as defined above.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
