'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useSession } from '@/components/providers/SessionProvider'
import {
  ArrowLeft,
  IndianRupee,
  Users,
  CheckCircle,
  AlertCircle,
  Play,
  Loader2,
  Wand2,
  RefreshCw,
  X,
  FileText,
  Printer,
  Download,
} from 'lucide-react'

interface StaffMember {
  id: string
  employee_id: string
  first_name: string
  last_name: string | null
  designation: string
  gross_salary: number
  total_deductions: number
  net_salary: number
  status: 'pending' | 'processed' | 'paid'
  working_days?: number
  present_days?: number
  leave_days?: number
}

interface PayrollComponent {
  id: string
  component_name: string
  component_type: 'earning' | 'deduction'
  amount: number
}

interface PayslipData extends StaffMember {
  earnings: PayrollComponent[]
  deductions: PayrollComponent[]
}

export default function ProcessPayrollPage() {
  const { profile } = useSession()
  const searchParams = useSearchParams()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const monthParam = searchParams.get('month')
    return monthParam ? parseInt(monthParam) : new Date().getMonth() + 1
  })
  const [selectedYear, setSelectedYear] = useState(() => {
    const yearParam = searchParams.get('year')
    return yearParam ? parseInt(yearParam) : new Date().getFullYear()
  })
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [generateResult, setGenerateResult] = useState<{
    generated: number
    skipped: Array<{ name: string; reason: string }>
  } | null>(null)
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null)
  const [loadingPayslip, setLoadingPayslip] = useState(false)
  const payslipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile?.schoolId) {
      fetchPayrollData()
    }
  }, [selectedMonth, selectedYear, profile?.schoolId])

  const fetchPayrollData = async () => {
    if (!profile?.schoolId) return
    setLoading(true)
    try {
      const url = `/api/salary/payroll?school_id=${profile.schoolId}&month=${selectedMonth}&year=${selectedYear}`
      console.log('Fetching payroll data from:', url)
      const response = await fetch(url)
      console.log('Payroll API status:', response.status, response.statusText)
      const data = await response.json()
      console.log('Payroll API response:', data)

      if (response.ok) {
        // Map the data to match the expected format
        const mappedStaff = (data.data || []).map((record: any) => ({
          id: record.id,
          employee_id: record.staff?.employee_id || '',
          first_name: record.staff?.first_name || '',
          last_name: record.staff?.last_name || null,
          designation: record.staff?.designation || '',
          gross_salary: record.gross_salary || 0,
          total_deductions: record.total_deductions || 0,
          net_salary: record.net_salary || 0,
          status: record.status || 'pending',
          working_days: record.working_days || 26,
          present_days: record.present_days || 26,
          leave_days: record.leave_days || 0,
        }))
        console.log('Mapped staff:', mappedStaff)
        setStaff(mappedStaff)
      } else {
        console.error('Payroll API error:', data)
      }
    } catch (err) {
      console.error('Failed to fetch payroll data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayslipDetails = async (member: StaffMember) => {
    setLoadingPayslip(true)
    try {
      const response = await fetch(`/api/salary/payroll/${member.id}`)
      const data = await response.json()

      if (response.ok && data.data) {
        setSelectedPayslip({
          ...member,
          earnings: data.data.earnings || [],
          deductions: data.data.deductions || [],
        })
      } else {
        // If no details found, show basic payslip
        setSelectedPayslip({
          ...member,
          earnings: [{ id: '1', component_name: 'Basic Salary', component_type: 'earning', amount: member.gross_salary }],
          deductions: [],
        })
      }
    } catch (err) {
      console.error('Failed to fetch payslip details:', err)
      // Show basic payslip on error
      setSelectedPayslip({
        ...member,
        earnings: [{ id: '1', component_name: 'Basic Salary', component_type: 'earning', amount: member.gross_salary }],
        deductions: [],
      })
    } finally {
      setLoadingPayslip(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedStaff.length === staff.filter((s) => s.status === 'pending').length) {
      setSelectedStaff([])
    } else {
      setSelectedStaff(staff.filter((s) => s.status === 'pending').map((s) => s.id))
    }
  }

  const handleSelectStaff = (id: string) => {
    if (selectedStaff.includes(id)) {
      setSelectedStaff(selectedStaff.filter((s) => s !== id))
    } else {
      setSelectedStaff([...selectedStaff, id])
    }
  }

  const handleProcessPayroll = async () => {
    if (selectedStaff.length === 0) {
      alert('Please select staff members to process payroll')
      return
    }
    if (!profile?.schoolId) return

    setProcessing(true)
    try {
      const response = await fetch('/api/salary/payroll/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: profile.schoolId,
          payroll_ids: selectedStaff,
          action: 'process',
        }),
      })

      if (response.ok) {
        alert('Payroll processed successfully')
        fetchPayrollData()
        setSelectedStaff([])
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to process payroll')
      }
    } catch {
      alert('Failed to process payroll')
    } finally {
      setProcessing(false)
    }
  }

  const handleGeneratePayroll = async () => {
    if (!profile?.schoolId) {
      alert('No school ID found in profile')
      return
    }

    console.log('Generating payroll with school_id:', profile.schoolId)
    setGenerating(true)
    setGenerateResult(null)
    try {
      const response = await fetch('/api/salary/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: profile.schoolId,
          month: selectedMonth,
          year: selectedYear,
          working_days: 26, // Default working days
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setGenerateResult({
          generated: data.generated,
          skipped: data.skipped || [],
        })
        fetchPayrollData() // Refresh the list
      } else {
        // Show detailed error with debug info
        const errorMsg = data.error || 'Failed to generate payroll'
        const debugInfo = data.debug ? `\n\nDebug Info:\n- School ID: ${data.debug.school_id}\n- Total Staff in DB: ${data.debug.totalStaffInDb}\n- Staff for School: ${data.debug.staffForSchool}` : ''
        alert(errorMsg + debugInfo)
        console.log('Generate Payroll Error:', data)
      }
    } catch {
      alert('Failed to generate payroll')
    } finally {
      setGenerating(false)
    }
  }

  const handlePrintPayslip = () => {
    if (payslipRef.current) {
      const printContent = payslipRef.current.innerHTML
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Payslip - ${selectedPayslip?.first_name} ${selectedPayslip?.last_name || ''}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .payslip { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; }
                .header p { margin: 5px 0; color: #666; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .info-box { padding: 10px; background: #f5f5f5; border-radius: 4px; }
                .info-box label { font-size: 12px; color: #666; display: block; }
                .info-box span { font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #f5f5f5; }
                .text-right { text-align: right; }
                .total-row { font-weight: bold; background: #f0f9ff; }
                .net-salary { font-size: 18px; font-weight: bold; color: #059669; text-align: right; padding: 15px; background: #ecfdf5; border-radius: 4px; }
                .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
                @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: new Date().getFullYear() - 2 + i,
    label: String(new Date().getFullYear() - 2 + i),
  }))

  const totalGross = staff.reduce((sum, s) => sum + s.gross_salary, 0)
  const totalDeductions = staff.reduce((sum, s) => sum + s.total_deductions, 0)
  const totalNet = staff.reduce((sum, s) => sum + s.net_salary, 0)
  const pendingCount = staff.filter((s) => s.status === 'pending').length
  const processedCount = staff.filter((s) => s.status === 'processed' || s.status === 'paid').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/salary">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Process Payroll</h1>
            <p className="text-gray-500">Generate and process monthly payroll</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGeneratePayroll}
            disabled={generating}
            icon={generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          >
            {generating ? 'Generating...' : 'Generate Payroll'}
          </Button>
          <Button
            onClick={handleProcessPayroll}
            disabled={processing || selectedStaff.length === 0}
            icon={processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          >
            {processing ? 'Processing...' : `Process (${selectedStaff.length})`}
          </Button>
        </div>
      </div>

      {/* Generate Result */}
      {generateResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Payroll generated for {generateResult.generated} staff members
                  </span>
                </div>
                {generateResult.skipped.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Skipped ({generateResult.skipped.length}):</p>
                    <ul className="text-sm text-gray-500 list-disc list-inside">
                      {generateResult.skipped.slice(0, 5).map((s, i) => (
                        <li key={i}>{s.name}: {s.reason}</li>
                      ))}
                      {generateResult.skipped.length > 5 && (
                        <li>...and {generateResult.skipped.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGenerateResult(null)}
                icon={<X className="h-4 w-4" />}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month/Year Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              label="Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              options={months.map((m) => ({ value: String(m.value), label: m.label }))}
              className="w-40"
            />
            <Select
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              options={years.map((y) => ({ value: String(y.value), label: y.label }))}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Staff</p>
            <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Processed</p>
            <p className="text-2xl font-bold text-green-600">{processedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Gross</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{totalGross.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Net</p>
            <p className="text-xl font-bold text-green-600">
              ₹{totalNet.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Payroll - {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </CardTitle>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStaff.length === staff.filter((s) => s.status === 'pending').length && pendingCount > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Select All Pending</span>
            </label>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No payroll data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedStaff.length === staff.filter((s) => s.status === 'pending').length && pendingCount > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Designation
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Gross
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Deductions
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Net Salary
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(member.id)}
                          onChange={() => handleSelectStaff(member.id)}
                          disabled={member.status !== 'pending'}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-700">
                              {member.first_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {member.first_name} {member.last_name || ''}
                            </p>
                            <p className="text-xs text-gray-500">{member.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.designation}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                        ₹{member.gross_salary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-red-600">
                        ₹{member.total_deductions.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                        ₹{member.net_salary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <Badge
                          variant={
                            member.status === 'paid'
                              ? 'success'
                              : member.status === 'processed'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchPayslipDetails(member)}
                          disabled={loadingPayslip}
                          icon={loadingPayslip ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        >
                          Payslip
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Payslip</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintPayslip}
                  icon={<Printer className="h-4 w-4" />}
                >
                  Print
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPayslip(null)}
                  icon={<X className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* Payslip Content */}
            <div ref={payslipRef} className="p-6">
              <div className="payslip">
                {/* Header */}
                <div className="header text-center border-b-2 border-gray-800 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.schoolName || 'School Name'}</h1>
                  <p className="text-gray-600">Salary Slip for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                </div>

                {/* Employee Info */}
                <div className="info-grid grid grid-cols-2 gap-4 mb-6">
                  <div className="info-box bg-gray-50 p-3 rounded">
                    <label className="text-xs text-gray-500">Employee Name</label>
                    <span className="block font-semibold">{selectedPayslip.first_name} {selectedPayslip.last_name || ''}</span>
                  </div>
                  <div className="info-box bg-gray-50 p-3 rounded">
                    <label className="text-xs text-gray-500">Employee ID</label>
                    <span className="block font-semibold">{selectedPayslip.employee_id}</span>
                  </div>
                  <div className="info-box bg-gray-50 p-3 rounded">
                    <label className="text-xs text-gray-500">Designation</label>
                    <span className="block font-semibold">{selectedPayslip.designation}</span>
                  </div>
                  <div className="info-box bg-gray-50 p-3 rounded">
                    <label className="text-xs text-gray-500">Pay Period</label>
                    <span className="block font-semibold">{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</span>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Attendance Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedPayslip.working_days}</p>
                      <p className="text-xs text-gray-600">Working Days</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedPayslip.present_days}</p>
                      <p className="text-xs text-gray-600">Days Present</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-orange-600">{selectedPayslip.leave_days}</p>
                      <p className="text-xs text-gray-600">Leave Days</p>
                    </div>
                  </div>
                </div>

                {/* Earnings & Deductions */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Earnings */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Earnings</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        {selectedPayslip.earnings.length > 0 ? (
                          selectedPayslip.earnings.map((earning, index) => (
                            <tr key={earning.id || index} className="border-b">
                              <td className="py-2">{earning.component_name}</td>
                              <td className="py-2 text-right">₹{earning.amount.toLocaleString('en-IN')}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="border-b">
                            <td className="py-2">Basic Salary</td>
                            <td className="py-2 text-right">₹{selectedPayslip.gross_salary.toLocaleString('en-IN')}</td>
                          </tr>
                        )}
                        <tr className="font-semibold bg-green-50">
                          <td className="py-2">Total Earnings</td>
                          <td className="py-2 text-right text-green-600">₹{selectedPayslip.gross_salary.toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Deductions */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Deductions</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        {selectedPayslip.deductions.length > 0 ? (
                          selectedPayslip.deductions.map((deduction, index) => (
                            <tr key={deduction.id || index} className="border-b">
                              <td className="py-2">{deduction.component_name}</td>
                              <td className="py-2 text-right">₹{deduction.amount.toLocaleString('en-IN')}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="border-b text-gray-400">
                            <td className="py-2">No deductions</td>
                            <td className="py-2 text-right">₹0</td>
                          </tr>
                        )}
                        <tr className="font-semibold bg-red-50">
                          <td className="py-2">Total Deductions</td>
                          <td className="py-2 text-right text-red-600">₹{selectedPayslip.total_deductions.toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Net Salary */}
                <div className="net-salary bg-green-50 p-4 rounded-lg text-right">
                  <span className="text-gray-600 mr-4">Net Salary:</span>
                  <span className="text-2xl font-bold text-green-600">₹{selectedPayslip.net_salary.toLocaleString('en-IN')}</span>
                </div>

                {/* Footer */}
                <div className="footer text-center mt-8 pt-4 border-t text-xs text-gray-500">
                  <p>This is a computer-generated payslip and does not require a signature.</p>
                  <p className="mt-1">Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
