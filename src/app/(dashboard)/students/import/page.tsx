'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'

interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; message: string }>
}

export default function ImportStudentsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (
        selectedFile.type === 'text/csv' ||
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel'
      ) {
        setFile(selectedFile)
        setError(null)
        setResult(null)
      } else {
        setError('Please upload a CSV or Excel file')
        setFile(null)
      }
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to import students')
        return
      }

      setResult(data)
    } catch {
      setError('Failed to import students. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'admission_number',
      'first_name',
      'last_name',
      'date_of_birth',
      'gender',
      'class_name',
      'section_name',
      'roll_number',
      'admission_date',
      'phone',
      'email',
      'address',
      'city',
      'state',
      'pincode',
      'blood_group',
      'father_name',
      'father_phone',
      'mother_name',
      'mother_phone',
    ]

    const sampleData = [
      'STU-2025-001',
      'John',
      'Doe',
      '2010-05-15',
      'male',
      'Nursery',
      'A',
      '1',
      '2025-01-01',
      '9876543210',
      'john@example.com',
      '123 Main St',
      'Mumbai',
      'Maharashtra',
      '400001',
      'A+',
      'James Doe',
      '9876543211',
      'Jane Doe',
      '9876543212',
    ]

    const csvContent = [headers.join(','), sampleData.join(',')].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Students</h1>
          <p className="text-gray-500">Bulk import students from a CSV or Excel file</p>
        </div>
      </div>

      {/* Results - Show at top when available */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Successful</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {result.success}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-900 mt-2">{result.failed}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Errors</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2">Row</th>
                        <th className="text-left py-2 px-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-2 text-gray-600">{err.row}</td>
                          <td className="py-2 px-2 text-red-600">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-white text-sm font-medium rounded-full">
                  1
                </span>
                <div>
                  <p className="font-medium">Download the template</p>
                  <p className="text-sm text-gray-500">
                    Get the CSV template with all required columns
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-white text-sm font-medium rounded-full">
                  2
                </span>
                <div>
                  <p className="font-medium">Fill in student data</p>
                  <p className="text-sm text-gray-500">
                    Add student information in each row
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-white text-sm font-medium rounded-full">
                  3
                </span>
                <div>
                  <p className="font-medium">Upload the file</p>
                  <p className="text-sm text-gray-500">
                    Select and upload your completed file
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-primary text-white text-sm font-medium rounded-full">
                  4
                </span>
                <div>
                  <p className="font-medium">Review results</p>
                  <p className="text-sm text-gray-500">
                    Check for any errors and fix as needed
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                icon={<Download className="h-4 w-4" />}
              >
                Download Template
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Important Notes</p>
                  <ul className="mt-1 text-yellow-700 space-y-1">
                    <li>Date format should be YYYY-MM-DD</li>
                    <li>Gender should be: male, female, or other</li>
                    <li>Class and Section names must match existing records</li>
                    <li>Admission number must be unique</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                file ? 'border-primary bg-primary/5' : 'border-gray-300'
              }`}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {file ? (
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-900">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports CSV, XLS, XLSX (max 5MB)
                    </p>
                  </div>
                )}
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full"
              icon={<Upload className="h-4 w-4" />}
            >
              {importing ? 'Importing...' : 'Import Students'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
