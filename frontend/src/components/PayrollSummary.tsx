import React from 'react';
import { formatRupiah } from '../utils/formatters';
import { CalendarCheck, Wallet } from 'lucide-react';

interface PayrollSummaryProps {
  totalAttendanceDays: number;
  grandTotalSalary: number;
  unverifiedDaysCount?: number;
}

export const PayrollSummary: React.FC<PayrollSummaryProps> = ({
  totalAttendanceDays,
  grandTotalSalary,
  unverifiedDaysCount = 0,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. Total Hari Kehadiran */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Total Hari Kehadiran
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171717] tabular-nums">
              {totalAttendanceDays}
            </span>
            <span className="text-xs font-medium text-neutral-500">Hari Kerja Valid</span>
          </div>
          {unverifiedDaysCount > 0 && (
            <p className="text-[11px] text-amber-700 font-medium">
              * {unverifiedDaysCount} absensi perlu verifikasi admin
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D31027] shrink-0">
          <CalendarCheck className="w-6 h-6" />
        </div>
      </div>

      {/* 2. Total Gaji Keseluruhan */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Total Gaji Keseluruhan
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#D31027] tabular-nums truncate">
              {formatRupiah(grandTotalSalary)}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 truncate">
            Tarif: <span className="font-semibold text-neutral-700">Rp50.000</span> / hari hadir valid
          </p>
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-neutral-900 flex items-center justify-center text-white shrink-0 shadow-xs">
          <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-[#D31027]" />
        </div>
      </div>
    </div>
  );
};
