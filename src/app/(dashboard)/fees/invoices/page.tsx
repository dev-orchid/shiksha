'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import {
  ArrowLeft,
  Plus,
  FileText,
  Search,
  Download,
  Eye,
  Printer,
  IndianRupee,
  Save,
  X,
} from 'lucide-react'

interface Student {
  id: string
  first_name: string
  last_name: string | null
  admission_number: string
  current_class_id?: string
  current_section_id?: string
  classes?: { id: string; name: string }
  sections?: { id: string; name: string }
}

interface Invoice {
  id: string
  invoice_number: string
  student_id: string
  total_amount: number
  discount_amount: number
  net_amount: number
  paid_amount: number
  balance_amount: number
  due_date: string
  status: string
  month: number
  year: number
  created_at: string
  students?: Student & { current_class_id?: string }
}

interface Class {
  id: string
  name: string
}

interface FeeStructure {
  id: string
  class_id: string
  fee_category_id: string
  amount: number
  fee_categories?: { id: string; name: string }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [generating, setGenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  const [generateForm, setGenerateForm] = useState({
    class_id: '',
    student_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: '',
  })

  useEffect(() => {
    fetchData()
  }, [statusFilter, classFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      let invoiceUrl = '/api/fees/invoices?limit=50'
      if (statusFilter) invoiceUrl += `&status=${statusFilter}`

      const [invoicesRes, classesRes] = await Promise.all([
        fetch(invoiceUrl),
        fetch('/api/classes'),
      ])

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        let filteredInvoices = data.data || []

        if (classFilter) {
          filteredInvoices = filteredInvoices.filter(
            (inv: Invoice) => inv.students?.current_class_id === classFilter
          )
        }

        setInvoices(filteredInvoices)
      }

      if (classesRes.ok) {
        const data = await classesRes.json()
        setClasses(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentsForClass = async (classId: string) => {
    try {
      const response = await fetch(`/api/students?class_id=${classId}&status=active`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const fetchFeeStructures = async (classId: string) => {
    try {
      const response = await fetch(`/api/fees/structures?class_id=${classId}`)
      if (response.ok) {
        const data = await response.json()
        setFeeStructures(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch fee structures:', error)
    }
  }

  const handleClassChange = async (classId: string) => {
    setGenerateForm({ ...generateForm, class_id: classId, student_id: '' })
    if (classId) {
      await Promise.all([
        fetchStudentsForClass(classId),
        fetchFeeStructures(classId),
      ])
    }
  }

  const handleGenerateInvoices = async () => {
    if (!generateForm.class_id || !generateForm.due_date) {
      alert('Please select class and due date')
      return
    }

    if (feeStructures.length === 0) {
      alert('No fee structures defined for this class')
      return
    }

    setGenerating(true)
    try {
      const targetStudents = generateForm.student_id
        ? students.filter(s => s.id === generateForm.student_id)
        : students

      let successCount = 0
      let skippedCount = 0
      let errorCount = 0
      const skippedStudents: string[] = []

      for (const student of targetStudents) {
        const totalAmount = feeStructures.reduce((sum, fs) => sum + fs.amount, 0)

        const invoiceData = {
          student_id: student.id,
          month: generateForm.month,
          year: generateForm.year,
          total_amount: totalAmount,
          net_amount: totalAmount,
          due_date: generateForm.due_date,
          items: feeStructures.map(fs => ({
            fee_category_id: fs.fee_category_id,
            description: fs.fee_categories?.name || 'Fee',
            amount: fs.amount,
          })),
        }

        const response = await fetch('/api/fees/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoiceData),
        })

        if (response.ok) {
          successCount++
        } else if (response.status === 409) {
          // Invoice already exists for this student/month/year
          skippedCount++
          skippedStudents.push(`${student.first_name} ${student.last_name || ''}`.trim())
        } else {
          errorCount++
        }
      }

      // Build result message
      let message = ''
      if (successCount > 0) {
        message += `✓ Generated ${successCount} new invoice${successCount > 1 ? 's' : ''}.\n`
      }
      if (skippedCount > 0) {
        message += `⚠ Skipped ${skippedCount} (already exist): ${skippedStudents.slice(0, 3).join(', ')}${skippedStudents.length > 3 ? ` and ${skippedStudents.length - 3} more` : ''}\n`
      }
      if (errorCount > 0) {
        message += `✗ ${errorCount} failed to generate.`
      }
      if (successCount === 0 && skippedCount === 0 && errorCount === 0) {
        message = 'No invoices to generate.'
      }

      alert(message.trim())
      setShowGenerateModal(false)
      fetchData()
    } catch (error) {
      console.error('Error generating invoices:', error)
      alert('Failed to generate invoices')
    } finally {
      setGenerating(false)
    }
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowViewModal(true)
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const studentName = `${invoice.students?.first_name} ${invoice.students?.last_name || ''}`
      const className = `${invoice.students?.classes?.name || 'N/A'} - ${invoice.students?.sections?.name || 'N/A'}`
      const feePeriod = `${monthNames[invoice.month - 1]} ${invoice.year}`
      const invoiceDate = new Date(invoice.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const dueDate = new Date(invoice.due_date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              color: #333;
            }
            .receipt-container {
              max-width: 600px;
              margin: 0 auto;
              border: 1px solid #000;
              padding: 24px;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #ddd;
              padding-bottom: 16px;
              margin-bottom: 16px;
            }
            .header h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
            .header .contact { font-size: 12px; color: #666; }
            .header .title {
              display: inline-block;
              background: #f3f4f6;
              padding: 6px 16px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 14px;
              margin-top: 12px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 16px;
              margin-bottom: 16px;
              font-size: 13px;
            }
            .details-grid .label { color: #666; font-size: 11px; }
            .details-grid .value { font-weight: 500; }
            .details-grid .right { text-align: right; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
              font-size: 13px;
            }
            th {
              text-align: left;
              padding: 8px 0;
              border-bottom: 1px solid #ccc;
              font-weight: 500;
              color: #666;
            }
            th.amount { text-align: right; }
            td {
              padding: 6px 0;
              border-bottom: 1px solid #eee;
            }
            td.amount { text-align: right; }
            tr.highlight { background: #f9fafb; font-weight: 500; }
            tr.total { border-top: 2px solid #ccc; font-weight: bold; }
            .paid { color: #16a34a; }
            .due { color: #dc2626; }
            .status-box {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px;
              background: #f3f4f6;
              border-radius: 4px;
              margin-bottom: 16px;
              font-size: 13px;
            }
            .status-badge {
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-partial { background: #dbeafe; color: #1e40af; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
            .footer {
              border-top: 1px solid #ddd;
              padding-top: 16px;
              margin-top: 16px;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
            .signature-line {
              width: 120px;
              border-bottom: 1px dashed #999;
              height: 30px;
              margin-top: 4px;
            }
            .footer-note {
              text-align: center;
              font-size: 11px;
              color: #999;
              margin-top: 16px;
            }
            @media print {
              body { padding: 0; }
              .receipt-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h1>XYZ Public School</h1>
              <p class="contact">Phone: 9079003238 | Email: dev@orchidsw.com</p>
              <div class="title">FEE INVOICE</div>
            </div>

            <div class="details-grid">
              <div>
                <div class="label">Invoice No.</div>
                <div class="value">${invoice.invoice_number}</div>
              </div>
              <div class="right">
                <div class="label">Date</div>
                <div class="value">${invoiceDate}</div>
              </div>
              <div>
                <div class="label">Student Name</div>
                <div class="value">${studentName}</div>
              </div>
              <div class="right">
                <div class="label">Admission No.</div>
                <div class="value">${invoice.students?.admission_number || 'N/A'}</div>
              </div>
              <div>
                <div class="label">Class</div>
                <div class="value">${className}</div>
              </div>
              <div class="right">
                <div class="label">Fee Period</div>
                <div class="value">${feePeriod}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fee for ${feePeriod}</td>
                  <td class="amount">₹${(invoice.total_amount || 0).toLocaleString('en-IN')}</td>
                </tr>
                ${(invoice.discount_amount || 0) > 0 ? `
                <tr>
                  <td class="paid">Discount</td>
                  <td class="amount paid">-₹${(invoice.discount_amount || 0).toLocaleString('en-IN')}</td>
                </tr>
                ` : ''}
                <tr class="highlight">
                  <td>Net Amount</td>
                  <td class="amount">₹${(invoice.net_amount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td class="paid">Paid Amount</td>
                  <td class="amount paid">₹${(invoice.paid_amount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr class="total">
                  <td class="due">Balance Due</td>
                  <td class="amount due">₹${(invoice.balance_amount || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div class="status-box">
              <div>
                <div style="color: #666; font-size: 11px;">Due Date</div>
                <div style="font-weight: 500;">${dueDate}</div>
              </div>
              <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
            </div>

            <div class="footer">
              <div class="signatures">
                <div>
                  <div style="color: #666;">Received by</div>
                  <div class="signature-line"></div>
                </div>
                <div style="text-align: right;">
                  <div style="color: #666;">Authorized Signature</div>
                  <div class="signature-line"></div>
                </div>
              </div>
              <p class="footer-note">This is a computer generated invoice.</p>
            </div>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleExport = () => {
    const headers = ['Invoice #', 'Student Name', 'Admission No', 'Class', 'Period', 'Amount', 'Paid', 'Balance', 'Due Date', 'Status']
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      `${inv.students?.first_name} ${inv.students?.last_name || ''}`,
      inv.students?.admission_number || '',
      inv.students?.classes?.name || '',
      `${monthNames[inv.month - 1]} ${inv.year}`,
      inv.net_amount,
      inv.paid_amount,
      inv.balance_amount,
      new Date(inv.due_date).toLocaleDateString('en-IN'),
      inv.status,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchQuery) return true
    const studentName = `${invoice.students?.first_name} ${invoice.students?.last_name || ''}`.toLowerCase()
    const admissionNo = invoice.students?.admission_number?.toLowerCase() || ''
    const invoiceNo = invoice.invoice_number.toLowerCase()
    const query = searchQuery.toLowerCase()
    return studentName.includes(query) || admissionNo.includes(query) || invoiceNo.includes(query)
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      paid: 'success',
      partial: 'warning',
      pending: 'info',
      overdue: 'danger',
    }
    return variants[status] || 'info'
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/fees">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Invoices</h1>
            <p className="text-gray-500">Generate and manage fee invoices</p>
          </div>
        </div>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setGenerateForm({
              class_id: '',
              student_id: '',
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear(),
              due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10)
                .toISOString().split('T')[0],
            })
            setStudents([])
            setFeeStructures([])
            setShowGenerateModal(true)
          }}
        >
          Generate Invoices
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name, admission no, or invoice no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map(c => ({ value: c.id, label: c.name })),
              ]}
              className="w-40"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'partial', label: 'Partial' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
              ]}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices ({filteredInvoices.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={handleExport}
          >
            Export
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {invoice.students?.first_name} {invoice.students?.last_name || ''}
                          </p>
                          <p className="text-sm text-gray-500">
                            {invoice.students?.admission_number} • {invoice.students?.classes?.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {monthNames[invoice.month - 1]} {invoice.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{(invoice.net_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                        ₹{(invoice.balance_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            title="View"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Print"
                            onClick={() => handlePrintInvoice(invoice)}
                          >
                            <Printer className="h-4 w-4 text-gray-500" />
                          </button>
                          {invoice.status !== 'paid' && (
                            <Link href={`/fees/collect?student=${invoice.student_id}`}>
                              <button className="p-1 hover:bg-green-50 rounded" title="Collect Payment">
                                <IndianRupee className="h-4 w-4 text-green-600" />
                              </button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Modal */}
      <Modal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Invoice Details"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button
              icon={<Printer className="h-4 w-4" />}
              onClick={() => selectedInvoice && handlePrintInvoice(selectedInvoice)}
            >
              Print
            </Button>
            {selectedInvoice?.status !== 'paid' && (
              <Link href={`/fees/collect?student=${selectedInvoice?.student_id}`}>
                <Button icon={<IndianRupee className="h-4 w-4" />}>
                  Collect Payment
                </Button>
              </Link>
            )}
          </div>
        }
      >
        {selectedInvoice && (
          <div className="border rounded-lg p-6">
            {/* School Header */}
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">XYZ Public School</h2>
              <p className="text-sm text-gray-600">Phone: 9079003238 | Email: dev@orchidsw.com</p>
              <div className="mt-3 inline-block bg-gray-100 px-4 py-1 rounded">
                <p className="text-sm font-bold">FEE INVOICE</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs">Invoice No.</span>
                <p className="font-medium">{selectedInvoice.invoice_number}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-500 text-xs">Date</span>
                <p className="font-medium">
                  {new Date(selectedInvoice.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Student Name</span>
                <p className="font-medium">{selectedInvoice.students?.first_name} {selectedInvoice.students?.last_name}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-500 text-xs">Admission No.</span>
                <p className="font-medium">{selectedInvoice.students?.admission_number}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Class</span>
                <p className="font-medium">{selectedInvoice.students?.classes?.name} - {selectedInvoice.students?.sections?.name || 'N/A'}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-500 text-xs">Fee Period</span>
                <p className="font-medium">{monthNames[selectedInvoice.month - 1]} {selectedInvoice.year}</p>
              </div>
            </div>

            {/* Invoice Table */}
            <div className="mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-gray-600 font-medium">Description</th>
                    <th className="text-right py-2 text-gray-600 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2">Fee for {monthNames[selectedInvoice.month - 1]} {selectedInvoice.year}</td>
                    <td className="text-right py-2">₹{(selectedInvoice.total_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  {(selectedInvoice.discount_amount || 0) > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-green-600">Discount</td>
                      <td className="text-right py-2 text-green-600">-₹{(selectedInvoice.discount_amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-2 font-medium">Net Amount</td>
                    <td className="text-right py-2 font-medium">₹{(selectedInvoice.net_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-green-600">Paid Amount</td>
                    <td className="text-right py-2 text-green-600">₹{(selectedInvoice.paid_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-b border-gray-300 font-bold">
                    <td className="py-2 text-red-600">Balance Due</td>
                    <td className="text-right py-2 text-red-600">₹{(selectedInvoice.balance_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Status Box */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-4">
              <div>
                <span className="text-gray-500 text-xs">Due Date</span>
                <p className="font-medium">
                  {new Date(selectedInvoice.due_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <Badge variant={getStatusBadge(selectedInvoice.status)} className="text-sm">
                {selectedInvoice.status.toUpperCase()}
              </Badge>
            </div>

            {/* Footer */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-end text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Received by</p>
                  <div className="h-8 border-b border-dashed border-gray-400 w-28 mt-1"></div>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs">Authorized Signature</p>
                  <div className="h-8 border-b border-dashed border-gray-400 w-28 mt-1"></div>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">This is a computer generated invoice.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Fee Invoices"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateInvoices}
              disabled={generating || !generateForm.class_id}
              icon={<Save className="h-4 w-4" />}
            >
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Class"
            value={generateForm.class_id}
            onChange={(e) => handleClassChange(e.target.value)}
            options={[
              { value: '', label: 'Select Class' },
              ...classes.map(c => ({ value: c.id, label: c.name })),
            ]}
            required
          />

          <Select
            label="Student (Optional - leave blank for all students)"
            value={generateForm.student_id}
            onChange={(e) => setGenerateForm({ ...generateForm, student_id: e.target.value })}
            options={[
              { value: '', label: 'All Students in Class' },
              ...students.map(s => ({
                value: s.id,
                label: `${s.first_name} ${s.last_name || ''} (${s.admission_number})`,
              })),
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Month"
              value={generateForm.month.toString()}
              onChange={(e) => setGenerateForm({ ...generateForm, month: parseInt(e.target.value) })}
              options={monthNames.map((name, idx) => ({ value: (idx + 1).toString(), label: name }))}
            />
            <Input
              label="Year"
              type="number"
              value={generateForm.year}
              onChange={(e) => setGenerateForm({ ...generateForm, year: parseInt(e.target.value) })}
            />
          </div>

          <Input
            label="Due Date"
            type="date"
            value={generateForm.due_date}
            onChange={(e) => setGenerateForm({ ...generateForm, due_date: e.target.value })}
            required
          />

          {generateForm.class_id && feeStructures.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Fee Components:</p>
              <div className="space-y-1">
                {feeStructures.map((fs) => (
                  <div key={fs.id} className="flex justify-between text-sm">
                    <span>{fs.fee_categories?.name}</span>
                    <span className="font-medium">₹{fs.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="border-t pt-1 mt-2 flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span>₹{feeStructures.reduce((sum, fs) => sum + fs.amount, 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {generateForm.student_id
                  ? 'Invoice will be generated for 1 student'
                  : `Invoices will be generated for ${students.length} students`}
              </p>
            </div>
          )}

          {generateForm.class_id && feeStructures.length === 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700 text-sm">
              No fee structures defined for this class. Please set up fee structures first.
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
