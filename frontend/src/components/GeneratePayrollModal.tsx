import React from 'react';
import { EmployeePayrollSummary } from '../types';
import { formatRupiah } from '../utils/formatters';
import { CheckCircle2, AlertTriangle, X, Calculator, ShieldCheck } from 'lucide-react';

interface GeneratePayrollModalProps {
  isOpen: boolean;
  periodLabel: string;
  startDate: string;
  endDate: string;
  outletLabel: string;
  summaries: EmployeePayrollSummary[];
  grandTotal: number;
  totalDays: number;
  isSaving?: boolean;
  onClose: () => void;
  onConfirmGenerate: () => void;
}

export const GeneratePayrollModal: React.FC<GeneratePayrollModalProps> = ({
  isOpen,
  periodLabel,
  outletLabel,
  summaries,
  grandTotal,
  totalDays,
  isSaving = false,
  onClose,
  onConfirmGenerate,
}) => {
  if (!isOpen) return null;

  const totalEmployees = summaries.length;
  const unverifiedTotal = summaries.reduce((acc, s) => acc + s.unverifiedDays, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D31027]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#171717]">
                Konfirmasi Generate Gaji
              </h3>
              <p className="text-xs text-neutral-500">
                Tinjau rincian kalkulasi sebelum memproses rekap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Summary Box */}
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-200/80">
              <span className="text-neutral-500 font-medium">Periode Penggajian:</span>
              <span className="font-semibold text-neutral-900">{periodLabel}</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-200/80">
              <span className="text-neutral-500 font-medium">Cakupan Outlet:</span>
              <span className="font-semibold text-neutral-900">{outletLabel}</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-200/80">
              <span className="text-neutral-500 font-medium">Jumlah Karyawan:</span>
              <span className="font-semibold text-neutral-900 tabular-nums">{totalEmployees} Orang</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-200/80">
              <span className="text-neutral-500 font-medium">Total Hari Hadir Valid:</span>
              <span className="font-semibold text-neutral-900 tabular-nums">{totalDays} Hari</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1">
              <span className="font-bold text-neutral-800">Total Nominal Gaji:</span>
              <span className="text-base font-extrabold text-[#D31027] tabular-nums">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          {/* Warning for unverified records if any */}
          {unverifiedTotal > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-[#D31027] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Catatan Verifikasi:</span>
                Terdapat {unverifiedTotal} absensi berstatus "Perlu Verifikasi" yang otomatis tidak dihitung ke nominal di atas.
              </div>
            </div>
          )}

          <p className="text-[11px] text-neutral-500 text-center leading-relaxed">
            Formula: Total Gaji = Jumlah Hari Hadir Valid × Rp50.000. Data akan disimpan ke riwayat generate rekap gaji.
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onConfirmGenerate}
            className="px-4 py-2 bg-[#D31027] hover:bg-[#B80D21] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan…' : 'Konfirmasi & Generate Gaji'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
