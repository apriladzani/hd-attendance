import React from 'react';
import { Employee, Outlet, OutletItem, AttendanceRecord } from '../types';
import { AttendanceForm } from './AttendanceForm';

interface AttendancePageProps {
  employees: Employee[];
  outlets: OutletItem[];
  attendanceRecords: AttendanceRecord[];
  onClockIn: (employeeId: string, outlet: Outlet, timeStr: string) => Promise<void>;
  onClockOut: (employeeId: string, outlet: Outlet, timeStr: string) => Promise<void>;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({
  employees,
  outlets,
  attendanceRecords,
  onClockIn,
  onClockOut,
}) => {
  return (
    <main className="py-6 sm:py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="text-center max-w-lg mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171717]">
            Absensi Karyawan
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-neutral-600">
            Catat kehadiran dan kepulangan karyawan dengan mudah.
          </p>
        </div>

        {/* Centered Attendance Form */}
        <AttendanceForm
          employees={employees}
          outlets={outlets}
          attendanceRecords={attendanceRecords}
          onClockIn={onClockIn}
          onClockOut={onClockOut}
        />
      </div>
    </main>
  );
};
