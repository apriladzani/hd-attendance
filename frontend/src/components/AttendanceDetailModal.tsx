import React, { useState } from 'react';
import { EmployeePayrollSummary } from '../types';
import { AttendanceStatusBadge } from './AttendanceStatus';
import { formatIndonesianDate, formatRupiah } from '../utils/formatters';
import { X, CheckCheck, MapPin, AlertCircle, FileText, Printer, Briefcase, Trash2 } from 'lucide-react';

interface AttendanceDetailModalProps {
  summary: EmployeePayrollSummary | null;
  periodLabel: string;
  onClose: () => void;
  onVerifyRecord: (recordId: string) => void;
  onDeleteAttendanceRecord: (recordId: string) => Promise<void>;
  onOpenSlip?: (summary: EmployeePayrollSummary) => void;
}

export const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  summary,
  periodLabel,
  onClose,
  onVerifyRecord,
  onDeleteAttendanceRecord,
  onOpenSlip,
}) => {
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  if (!summary) return null;

  const handleDeleteRecord = async (recordId: string, date: string) => {
    if (!confirm(`Hapus data kehadiran ${summary.employeeName} tanggal ${formatIndonesianDate(date)}? Data ini akan dikeluarkan dari kalkulasi gaji.`)) return;

    setDeletingRecordId(recordId);
    try {
      await onDeleteAttendanceRecord(recordId);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menghapus data kehadiran.');
    } finally {
      setDeletingRecordId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-neutral-900/50 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-[#D31027]/10 border border-[#D31027]/30 flex items-center justify-center text-[#D31027] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#171717] truncate">
                  {summary.employeeName}
                </h3>
                <span className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-neutral-200/80 text-neutral-800 shrink-0">
                  {summary.nip}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-500 truncate">
                Level: <strong className="text-neutral-700">{summary.positionName}</strong> · Periode: {periodLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Cards Summary */}
        <div className="p-3.5 sm:p-5 border-b border-neutral-100 bg-white grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-2.5 sm:p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-[10px] sm:text-[11px] text-neutral-500 uppercase font-semibold block mb-0.5">Outlet</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-neutral-800 truncate">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{summary.outlet}</span>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-[10px] sm:text-[11px] text-neutral-500 uppercase font-semibold block mb-0.5">Hari Hadir Valid</span>
            <span className="text-xs sm:text-sm font-bold text-neutral-900 tabular-nums">
              {summary.validDays} Hari
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-[10px] sm:text-[11px] text-neutral-500 uppercase font-semibold block mb-0.5">Tarif Level</span>
            <span className="text-xs sm:text-sm font-bold text-neutral-900 tabular-nums">
              {formatRupiah(summary.dailyWage)}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-red-50 rounded-lg border border-red-200">
            <span className="text-[10px] sm:text-[11px] text-[#D31027] uppercase font-bold block mb-0.5">Total Gaji</span>
            <span className="text-xs sm:text-sm font-extrabold text-[#D31027] tabular-nums">
              {formatRupiah(summary.totalWage)}
            </span>
          </div>
        </div>

        {/* Unverified Alert if present */}
        {summary.unverifiedDays > 0 && (
          <div className="mx-3.5 sm:mx-5 mt-3 sm:mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Ada {summary.unverifiedDays} data absensi perlu verifikasi admin.</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Absensi belum dihitung ke total gaji sampai admin memverifikasi keabsahannya.
              </p>
            </div>
          </div>
        )}

        {/* Attendance History Table */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Riwayat Kehadiran Pada Periode Ini
            </h4>
            <span className="text-[11px] text-neutral-500">
              Total {summary.records.length} rekaman
            </span>
          </div>

          <div className="border border-neutral-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[520px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <th className="py-2.5 px-3.5">Tanggal</th>
                  <th className="py-2.5 px-3.5 text-center">Jam Datang</th>
                  <th className="py-2.5 px-3.5 text-center">Jam Pulang</th>
                  <th className="py-2.5 px-3.5 text-center">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Hitung Gaji</th>
                  <th className="py-2.5 px-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {summary.records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      Tidak ada riwayat kehadiran dalam rentang periode ini.
                    </td>
                  </tr>
                ) : (
                  summary.records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 px-3.5 font-medium text-neutral-800">
                        {formatIndonesianDate(rec.date)}
                        {rec.notes && (
                          <span className="block text-[10px] text-neutral-400 font-normal">
                            {rec.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-mono tabular-nums text-neutral-700">
                        {rec.clockIn || '-'}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-mono tabular-nums text-neutral-700">
                        {rec.clockOut || '-'}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <AttendanceStatusBadge status={rec.status} />
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {rec.isValid ? (
                          <span className="text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            +{formatRupiah(summary.dailyWage)}
                          </span>
                        ) : rec.status === 'Perlu Verifikasi' ? (
                          <button
                            type="button"
                            onClick={() => onVerifyRecord(rec.id)}
                            className="px-2 py-1 bg-[#D31027] hover:bg-[#B80D21] text-white font-semibold text-[10px] rounded-md transition-colors shadow-xs cursor-pointer"
                          >
                            Verifikasi
                          </button>
                        ) : (
                          <span className="text-neutral-400 text-[11px] italic">
                            Belum selesai
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id, rec.date)}
                          disabled={deletingRecordId === rec.id}
                          className="inline-flex items-center justify-center p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                          title="Hapus data kehadiran"
                          aria-label={`Hapus kehadiran tanggal ${formatIndonesianDate(rec.date)}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Tarif harian: <strong className="text-neutral-800">{formatRupiah(summary.dailyWage)}</strong> (Posisi: {summary.positionName})
          </span>
          <div className="flex items-center gap-2">
            {onOpenSlip && (
              <button
                type="button"
                onClick={() => onOpenSlip(summary)}
                className="px-3.5 py-1.5 bg-[#F19012] hover:bg-[#D97E0A] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buka Slip Gaji</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
