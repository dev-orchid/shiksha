'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  ArrowLeft,
  Download,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  PieChart,
} from 'lucide-react'

export default function FeeReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Reports</h1>
            <p className="text-gray-500">Financial analytics and reports</p>
          </div>
        </div>
        <Button icon={<Download className="h-4 w-4" />}>
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Collection</p>
                <p className="text-2xl font-bold text-green-600">₹48,50,000</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">₹5,45,000</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">₹1,25,000</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Collection Rate</p>
                <p className="text-2xl font-bold text-blue-600">89%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Collection Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: 'January', amount: 450000 },
                { month: 'February', amount: 380000 },
                { month: 'March', amount: 520000 },
                { month: 'April', amount: 480000 },
                { month: 'May', amount: 390000 },
                { month: 'June', amount: 460000 },
              ].map((item) => (
                <div key={item.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{item.month}</span>
                    <span className="text-sm font-medium">₹{(item.amount / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${(item.amount / 520000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category-wise Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: 'Tuition Fee', amount: 3200000, percentage: 66 },
                { category: 'Transport Fee', amount: 850000, percentage: 18 },
                { category: 'Lab Fee', amount: 380000, percentage: 8 },
                { category: 'Library Fee', amount: 195000, percentage: 4 },
                { category: 'Sports Fee', amount: 225000, percentage: 4 },
              ].map((item, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500']
                return (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[index]}`} />
                      <span className="text-sm">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{(item.amount / 100000).toFixed(1)}L</p>
                      <p className="text-xs text-gray-500">{item.percentage}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
