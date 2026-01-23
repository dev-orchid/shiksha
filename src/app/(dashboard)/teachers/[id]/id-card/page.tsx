'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { IDCard, IDCardPrintStyles, StaffCardData, SchoolInfo } from '@/components/ui/IDCard';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  designation?: string;
  blood_group?: string;
  photo_url?: string;
  phone?: string;
  emergency_contact_phone?: string;
  emergency_contact_name?: string;
  department?: {
    id: string;
    name: string;
  };
  school?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    logo_url?: string;
  };
}

export default function TeacherIDCardPage() {
  const params = useParams();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch(`/api/staff/${params.id}`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch staff data');
        }
        setStaff(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchStaff();
    }
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              {error || 'Staff member not found'}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare card data
  const cardData: StaffCardData = {
    name: `${staff.first_name} ${staff.last_name}`,
    employeeId: staff.employee_id,
    designation: staff.designation || 'Staff',
    department: staff.department?.name,
    bloodGroup: staff.blood_group,
    emergencyContact: staff.emergency_contact_phone,
    photoUrl: staff.photo_url,
    phone: staff.phone,
  };

  const schoolInfo: SchoolInfo = {
    name: staff.school?.name || 'School Name',
    logo: staff.school?.logo_url,
    address: staff.school?.address,
    phone: staff.school?.phone,
  };

  return (
    <div className="p-6">
      <IDCardPrintStyles />

      {/* Header - hidden during print */}
      <div className="no-print mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Staff
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Staff ID Card</h1>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print ID Card
          </Button>
        </div>
      </div>

      {/* ID Card Preview */}
      <div className="print-area">
        <Card className="no-print">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-6">
              <p className="text-sm text-gray-600">Preview (actual size)</p>
              <IDCard type="staff" data={cardData} schoolInfo={schoolInfo} />
            </div>
          </CardContent>
        </Card>

        {/* Print version - only visible during print */}
        <div className="hidden print:block">
          <IDCard type="staff" data={cardData} schoolInfo={schoolInfo} />
        </div>
      </div>

      {/* Instructions - hidden during print */}
      <div className="no-print mt-6">
        <Card>
          <CardContent className="py-4">
            <h3 className="font-medium text-gray-900 mb-2">Printing Instructions</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Click the &quot;Print ID Card&quot; button above to print</li>
              <li>• For best results, use a color printer</li>
              <li>• Use thick paper or card stock (200-300 gsm)</li>
              <li>• Standard ID card size: 85.6mm x 53.98mm (credit card size)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
