import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Wallet,
  TrendingUp,
  Users,
  Calendar,
  Download,
  FileText,
  Eye,
  Play,
} from 'lucide-react'

export const metadata = {
  title: 'Salary Management | School Management System',
}

// Mock data
const recentPayrolls = [
  {
    id: '1',
    month: 'December 2024',
    totalStaff: 56,
    grossAmount: 1850000,
    deductions: 220000,
    netAmount: 1630000,
    status: 'pending',
  },
  {
    id: '2',
    month: 'November 2024',
    totalStaff: 55,
    grossAmount: 1800000,
    deductions: 215000,
    netAmount: 1585000,
    status: 'paid',
  },
  {
    id: '3',
    month: 'October 2024',
    totalStaff: 55,
    grossAmount: 1800000,
    deductions: 215000,
    netAmount: 1585000,
    status: 'paid',
  },
]

const staffSalaries = [
  {
    id: '1',
    name: 'Dr. Rajesh Kumar',
    designation: 'Senior Teacher',
    basicSalary: 45000,
    grossSalary: 55000,
    deductions: 6600,
    netSalary: 48400,
    status: 'paid',
  },
  {
    id: '2',
    name: 'Mrs. Sunita Sharma',
    designation: 'Teacher',
    basicSalary: 35000,
    grossSalary: 42000,
    deductions: 5040,
    netSalary: 36960,
    status: 'paid',
  },
  {
    id: '3',
    name: 'Mr. Amit Singh',
    designation: 'Teacher',
    basicSalary: 32000,
    grossSalary: 38400,
    deductions: 4608,
    netSalary: 33792,
    status: 'pending',
  },
]

export default function SalaryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-gray-500 mt-1">Manage staff salaries and payroll</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/salary/structure">
            <Button variant="outline" icon={<FileText className="h-4 w-4" />}>
              Salary Structure
            </Button>
          </Link>
          <Link href="/salary/process">
            <Button icon={<Play className="h-4 w-4" />}>Process Payroll</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month Payroll</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹18,50,000</p>
                <p className="text-xs text-gray-500 mt-1">56 Staff Members</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Deductions</p>
                <p className="text-2xl font-bold text-red-600 mt-1">₹2,20,000</p>
                <p className="text-xs text-gray-500 mt-1">PF, Tax, etc.</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Payable</p>
                <p className="text-2xl font-bold text-green-600 mt-1">₹16,30,000</p>
                <p className="text-xs text-gray-500 mt-1">After deductions</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">12</p>
                <p className="text-xs text-gray-500 mt-1">Staff members</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payroll History</CardTitle>
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Staff Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gross Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Net Amount
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
                {recentPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{payroll.month}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payroll.totalStaff}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{payroll.grossAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -₹{payroll.deductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{payroll.netAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={payroll.status === 'paid' ? 'success' : 'warning'}>
                        {payroll.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" icon={<Eye className="h-4 w-4" />}>
                          View
                        </Button>
                        <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>
                          Download
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Staff Salaries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Staff Salaries - December 2024</CardTitle>
          <Link href="/salary/all">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Basic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gross
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Net Salary
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
                {staffSalaries.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{staff.name}</p>
                        <p className="text-sm text-gray-500">{staff.designation}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{staff.basicSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{staff.grossSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -₹{staff.deductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ₹{staff.netSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={staff.status === 'paid' ? 'success' : 'warning'}>
                        {staff.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="ghost" size="sm" icon={<FileText className="h-4 w-4" />}>
                        Payslip
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
