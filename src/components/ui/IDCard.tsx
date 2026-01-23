'use client';

import React from 'react';
import { User, Phone, Droplet, Building2, GraduationCap, Briefcase } from 'lucide-react';

export interface StudentCardData {
  name: string;
  admissionNumber: string;
  classSection: string;
  rollNumber?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  photoUrl?: string;
  dateOfBirth?: string;
}

export interface StaffCardData {
  name: string;
  employeeId: string;
  designation: string;
  department?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  photoUrl?: string;
  phone?: string;
}

export interface SchoolInfo {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
}

interface IDCardProps {
  type: 'student' | 'staff';
  data: StudentCardData | StaffCardData;
  schoolInfo: SchoolInfo;
}

export function IDCard({ type, data, schoolInfo }: IDCardProps) {
  const isStudent = type === 'student';
  const accentColor = isStudent ? 'blue' : 'green';

  const studentData = data as StudentCardData;
  const staffData = data as StaffCardData;

  return (
    <div
      className="id-card relative bg-white rounded-lg shadow-lg overflow-hidden"
      style={{
        width: '85.6mm',
        height: '53.98mm',
        minWidth: '85.6mm',
        minHeight: '53.98mm',
        maxWidth: '85.6mm',
        maxHeight: '53.98mm',
      }}
    >
      {/* Header */}
      <div
        className={`px-3 py-2 text-white ${
          isStudent ? 'bg-blue-600' : 'bg-green-600'
        }`}
      >
        <div className="flex items-center gap-2">
          {schoolInfo.logo ? (
            <img
              src={schoolInfo.logo}
              alt="School Logo"
              className="w-8 h-8 object-contain bg-white rounded-full p-0.5"
            />
          ) : (
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate">{schoolInfo.name}</h1>
            {schoolInfo.address && (
              <p className="text-[8px] opacity-90 truncate">{schoolInfo.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex gap-3" style={{ height: 'calc(100% - 44px)' }}>
        {/* Photo */}
        <div className="flex-shrink-0">
          <div
            className={`w-20 h-24 rounded border-2 overflow-hidden ${
              isStudent ? 'border-blue-200' : 'border-green-200'
            }`}
          >
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt={data.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${
                isStudent ? 'bg-blue-50' : 'bg-green-50'
              }`}>
                <User className={`w-10 h-10 ${
                  isStudent ? 'text-blue-300' : 'text-green-300'
                }`} />
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between text-xs">
          <div className="space-y-1">
            <h2 className="font-bold text-sm text-gray-900 truncate">{data.name}</h2>

            {isStudent ? (
              <>
                <InfoRow
                  icon={<GraduationCap className="w-3 h-3" />}
                  label="Adm. No"
                  value={studentData.admissionNumber}
                  color={accentColor}
                />
                <InfoRow
                  icon={<Building2 className="w-3 h-3" />}
                  label="Class"
                  value={studentData.classSection}
                  color={accentColor}
                />
                {studentData.bloodGroup && (
                  <InfoRow
                    icon={<Droplet className="w-3 h-3" />}
                    label="Blood"
                    value={studentData.bloodGroup}
                    color={accentColor}
                  />
                )}
              </>
            ) : (
              <>
                <InfoRow
                  icon={<Briefcase className="w-3 h-3" />}
                  label="Emp. ID"
                  value={staffData.employeeId}
                  color={accentColor}
                />
                <InfoRow
                  icon={<Building2 className="w-3 h-3" />}
                  label="Dept"
                  value={staffData.department || staffData.designation}
                  color={accentColor}
                />
                {staffData.bloodGroup && (
                  <InfoRow
                    icon={<Droplet className="w-3 h-3" />}
                    label="Blood"
                    value={staffData.bloodGroup}
                    color={accentColor}
                  />
                )}
              </>
            )}
          </div>

          {/* Emergency Contact */}
          {data.emergencyContact && (
            <div className={`mt-1 pt-1 border-t ${
              isStudent ? 'border-blue-100' : 'border-green-100'
            }`}>
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                <Phone className="w-2.5 h-2.5" />
                <span className="font-medium">Emergency:</span>
                <span className="truncate">{data.emergencyContact}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Type Badge */}
      <div
        className={`absolute top-12 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
          isStudent
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700'
        }`}
      >
        {type}
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'green';
}

function InfoRow({ icon, label, value, color }: InfoRowProps) {
  return (
    <div className="flex items-center gap-1">
      <span className={`flex-shrink-0 ${color === 'blue' ? 'text-blue-500' : 'text-green-500'}`}>
        {icon}
      </span>
      <span className="text-gray-500 whitespace-nowrap flex-shrink-0">{label}:</span>
      <span className="font-medium text-gray-800 truncate">{value}</span>
    </div>
  );
}

// Print styles component to be included in pages
export function IDCardPrintStyles() {
  const printStyles = `
    @media print {
      @page {
        size: A4;
        margin: 10mm;
      }

      body * {
        visibility: hidden;
      }

      .print-area, .print-area * {
        visibility: visible;
      }

      .print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }

      .no-print {
        display: none !important;
      }

      .id-card {
        break-inside: avoid;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        box-shadow: none !important;
        border: 1px solid #e5e7eb;
      }

      .id-cards-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10mm;
      }
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: printStyles }} />;
}

export default IDCard;
