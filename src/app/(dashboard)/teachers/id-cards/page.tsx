'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { IDCard, IDCardPrintStyles, StaffCardData, SchoolInfo } from '@/components/ui/IDCard';
import { useSession } from '@/components/providers/SessionProvider';

interface Staff {
  id: string;
  first_name: string;
  last_name: string | null;
  employee_id: string;
  designation?: string | null;
  employee_type?: string | null;
  blood_group?: string | null;
  photo_url?: string | null;
  phone?: string | null;
  emergency_contact_phone?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
}

interface DepartmentOption {
  id: string;
  name: string;
}

const EMPLOYEE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'teaching', label: 'Teaching' },
  { value: 'non-teaching', label: 'Non-Teaching' },
  { value: 'admin', label: 'Administrative' },
];

export default function BulkStaffIDCardsPage() {
  const router = useRouter();
  const { profile } = useSession();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments');
        if (response.ok) {
          const deptData = await response.json();
          setDepartments(Array.isArray(deptData) ? deptData : deptData.data || []);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch staff based on filters
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'active' });
      if (selectedDepartment) {
        params.append('department_id', selectedDepartment);
      }
      if (selectedType) {
        params.append('employee_type', selectedType);
      }

      const response = await fetch(`/api/staff?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStaffList(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const schoolInfo: SchoolInfo = {
    name: profile?.schoolName || 'School Name',
  };

  const prepareCardData = (staff: Staff): StaffCardData => {
    return {
      name: `${staff.first_name} ${staff.last_name || ''}`.trim(),
      employeeId: staff.employee_id,
      designation: staff.designation || 'Staff',
      department: staff.department?.name,
      bloodGroup: staff.blood_group ?? undefined,
      emergencyContact: staff.emergency_contact_phone ?? undefined,
      photoUrl: staff.photo_url ?? undefined,
      phone: staff.phone ?? undefined,
    };
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <IDCardPrintStyles />

      {/* Header - hidden during print */}
      <div className="no-print mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/teachers')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Staff
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Bulk ID Cards - Staff</h1>
          </div>
          {staffList.length > 0 && (
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print All ({staffList.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters - hidden during print */}
      <Card className="no-print mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Staff
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
            <Select
              label="Employee Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={EMPLOYEE_TYPES}
            />
            <div className="flex items-end">
              <Button
                onClick={fetchStaff}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Generate ID Cards'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ID Cards Grid */}
      <div className="print-area">
        {staffList.length === 0 ? (
          <Card className="no-print">
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <p>Select filters and click &quot;Generate ID Cards&quot; to view staff ID cards</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Preview Grid - visible on screen */}
            <div className="no-print">
              <div className="mb-4 text-sm text-gray-600">
                Showing {staffList.length} staff member{staffList.length !== 1 ? 's' : ''} |
                Cards will print 2 per row on A4 paper
              </div>
              <div className="flex flex-wrap gap-6">
                {staffList.map((staff) => (
                  <IDCard
                    key={staff.id}
                    type="staff"
                    data={prepareCardData(staff)}
                    schoolInfo={schoolInfo}
                  />
                ))}
              </div>
            </div>

            {/* Print Grid - only visible during print */}
            <div className="hidden print:block id-cards-grid">
              {staffList.map((staff) => (
                <IDCard
                  key={staff.id}
                  type="staff"
                  data={prepareCardData(staff)}
                  schoolInfo={schoolInfo}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Instructions - hidden during print */}
      {staffList.length > 0 && (
        <div className="no-print mt-6">
          <Card>
            <CardContent className="py-4">
              <h3 className="font-medium text-gray-900 mb-2">Printing Instructions</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click &quot;Print All&quot; to print all ID cards</li>
                <li>• Cards will be arranged 2 per row on A4 paper</li>
                <li>• Approximately 8 cards fit per A4 page</li>
                <li>• For best results, use a color printer with thick paper (200-300 gsm)</li>
                <li>• Standard ID card size: 85.6mm x 53.98mm (credit card size)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
