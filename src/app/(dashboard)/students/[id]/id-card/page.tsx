'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { IDCard, IDCardPrintStyles, StudentCardData, SchoolInfo } from '@/components/ui/IDCard';

interface Student {
  id: string;
  first_name: string;
  last_name: string | null;
  admission_number: string;
  roll_number?: string | null;
  blood_group?: string | null;
  photo_url?: string | null;
  phone?: string | null;
  date_of_birth?: string;
  emergency_contact?: string | null;
  current_class?: {
    id: string;
    name: string;
  } | null;
  current_section?: {
    id: string;
    name: string;
  } | null;
  school?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    logo_url?: string;
  } | null;
  student_parents?: Array<{
    is_primary: boolean;
    parents: {
      phone: string;
    };
  }>;
}

export default function StudentIDCardPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await fetch(`/api/students/${params.id}`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch student data');
        }
        setStudent(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchStudent();
    }
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              {error || 'Student not found'}
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

  // Prepare card data - use emergency_contact, parent phone, or student phone as fallback
  const emergencyContact = student.emergency_contact || student.student_parents?.[0]?.parents?.phone || student.phone;
  const classSection = [
    student.current_class?.name,
    student.current_section?.name,
  ]
    .filter(Boolean)
    .join(' - ');

  const cardData: StudentCardData = {
    name: `${student.first_name} ${student.last_name || ''}`.trim(),
    admissionNumber: student.admission_number,
    classSection: classSection || 'N/A',
    rollNumber: student.roll_number ?? undefined,
    bloodGroup: student.blood_group ?? undefined,
    emergencyContact: emergencyContact ?? undefined,
    photoUrl: student.photo_url ?? undefined,
    dateOfBirth: student.date_of_birth,
  };

  const schoolInfo: SchoolInfo = {
    name: student.school?.name || 'School Name',
    logo: student.school?.logo_url,
    address: student.school?.address,
    phone: student.school?.phone,
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
              Back to Student
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Student ID Card</h1>
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
              <IDCard type="student" data={cardData} schoolInfo={schoolInfo} />
            </div>
          </CardContent>
        </Card>

        {/* Print version - only visible during print */}
        <div className="hidden print:block">
          <IDCard type="student" data={cardData} schoolInfo={schoolInfo} />
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
