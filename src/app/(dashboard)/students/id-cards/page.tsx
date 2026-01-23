'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { IDCard, IDCardPrintStyles, StudentCardData, SchoolInfo } from '@/components/ui/IDCard';
import { useSession } from '@/components/providers/SessionProvider';

interface Student {
  id: string;
  first_name: string;
  last_name: string | null;
  admission_number: string;
  roll_number?: string | null;
  blood_group?: string | null;
  photo_url?: string | null;
  phone?: string | null;
  emergency_contact?: string | null;
  current_class?: {
    id: string;
    name: string;
  } | null;
  current_section?: {
    id: string;
    name: string;
  } | null;
}

interface ClassOption {
  id: string;
  name: string;
}

interface SectionOption {
  id: string;
  name: string;
}

export default function BulkStudentIDCardsPage() {
  const router = useRouter();
  const { profile } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        if (response.ok) {
          const classesData = await response.json();
          setClasses(Array.isArray(classesData) ? classesData : classesData.data || []);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch sections when class changes
  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedClass) {
        setSections([]);
        return;
      }

      try {
        const response = await fetch(`/api/sections?class_id=${selectedClass}`);
        if (response.ok) {
          const data = await response.json();
          setSections(Array.isArray(data) ? data : data.data || []);
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };

    fetchSections();
    setSelectedSection('');
  }, [selectedClass]);

  // Fetch students based on filters
  const fetchStudents = async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      let url = `/api/students?class_id=${selectedClass}&status=active`;
      if (selectedSection) {
        url += `&section_id=${selectedSection}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStudents(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
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

  const prepareCardData = (student: Student): StudentCardData => {
    const classSection = [
      student.current_class?.name,
      student.current_section?.name,
    ]
      .filter(Boolean)
      .join(' - ');

    // Use emergency_contact, or fall back to student's phone
    const contactNumber = student.emergency_contact || student.phone;

    return {
      name: `${student.first_name} ${student.last_name || ''}`.trim(),
      admissionNumber: student.admission_number,
      classSection: classSection || 'N/A',
      rollNumber: student.roll_number ?? undefined,
      bloodGroup: student.blood_group ?? undefined,
      emergencyContact: contactNumber ?? undefined,
      photoUrl: student.photo_url ?? undefined,
    };
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
            <Button variant="outline" onClick={() => router.push('/students')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Students
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Bulk ID Cards - Students</h1>
          </div>
          {students.length > 0 && (
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print All ({students.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters - hidden during print */}
      <Card className="no-print mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={[
                { value: '', label: 'Select Class' },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              label="Section"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              options={[
                { value: '', label: 'All Sections' },
                ...sections.map((s) => ({ value: s.id, label: s.name })),
              ]}
              disabled={!selectedClass}
            />
            <div className="flex items-end">
              <Button
                onClick={fetchStudents}
                disabled={!selectedClass || loading}
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
        {students.length === 0 ? (
          <Card className="no-print">
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <p>Select a class and click &quot;Generate ID Cards&quot; to view student ID cards</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Preview Grid - visible on screen */}
            <div className="no-print">
              <div className="mb-4 text-sm text-gray-600">
                Showing {students.length} student{students.length !== 1 ? 's' : ''} |
                Cards will print 2 per row on A4 paper
              </div>
              <div className="flex flex-wrap gap-6">
                {students.map((student) => (
                  <IDCard
                    key={student.id}
                    type="student"
                    data={prepareCardData(student)}
                    schoolInfo={schoolInfo}
                  />
                ))}
              </div>
            </div>

            {/* Print Grid - only visible during print */}
            <div className="hidden print:block id-cards-grid">
              {students.map((student) => (
                <IDCard
                  key={student.id}
                  type="student"
                  data={prepareCardData(student)}
                  schoolInfo={schoolInfo}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Instructions - hidden during print */}
      {students.length > 0 && (
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
