import React from 'react';
import { AttendanceStatus as StatusType } from '../types';
import { AlertCircle, CheckCircle, Clock, Coffee } from 'lucide-react';

interface AttendanceStatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
}

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status,
  showIcon = true,
}) => {
  switch (status) {
    case 'Belum Absen':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
          {showIcon && <Clock className="w-3.5 h-3.5 text-neutral-400" />}
          Belum Absen
        </span>
      );
    case 'Sedang Bekerja':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
          {showIcon && <Coffee className="w-3.5 h-3.5 text-[#D31027]" />}
          Sedang Bekerja
        </span>
      );
    case 'Sudah Pulang':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          {showIcon && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
          Sudah Pulang
        </span>
      );
    case 'Perlu Verifikasi':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
          Perlu Verifikasi
        </span>
      );
    default:
      return null;
  }
};
