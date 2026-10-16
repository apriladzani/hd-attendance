import React, { useState, useEffect } from 'react';
import { EmployeePayrollSummary, SalaryAdjustment } from '../types';
import { formatRupiah } from '../utils/formatters';
import { Edit3, X, Check, AlertCircle, Info, Calculator } from 'lucide-react';

interface EditSalaryModalProps {
  isOpen: boolean;
  summary: EmployeePayrollSummary | null;
  onClose: () => void;
  onSave: (employeeId: string, adjustment: SalaryAdjustment) => void;
}

export const EditSalaryModal: React.FC<EditSalaryModalProps> = ({
  isOpen,
  summary,
  onClose,
  onSave,
}) => {
  const [thr, setThr] = useState<number>(0);
  const [tunjanganLainnya, setTunjanganLainnya] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [potongan, setPotongan] = useState<number>(0);
  const [keteranganPotongan, setKeteranganPotongan] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (summary) {
      setThr(summary.thr || 0);
      setTunjanganLainnya(summary.tunjanganLainnya || 0);
      setBonus(summary.bonus || 0);
      setPotongan(summary.potongan || 0);
      setKeteranganPotongan(summary.keteranganPotongan || '');
      setError('');
    }
  }, [summary]);

  if (!isOpen || !summary) return null;

  // Real-time calculation previews
  const safeThr = Math.max(0, Number(thr) || 0);
  const safeTunjangan = Math.max(0, Number(tunjanganLainnya) || 0);
  const safeBonus = Math.max(0, Number(bonus) || 0);
  const safePotongan = Math.max(0, Number(potongan) || 0);

  const previewTotalPenghasilan = summary.gajiPokok + safeThr + safeTunjangan + safeBonus;
  const previewTotalPotongan = safePotongan;
  const previewTotalGajiBersih = Math.max(0, previewTotalPenghasilan - previewTotalPotongan);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (thr < 0 || tunjanganLainnya < 0 || bonus < 0 || potongan < 0) {
      setError('Nilai komponen gaji tidak boleh bernilai negatif.');
      return;
    }

    onSave(summary.employeeId, {
      thr: safeThr,
      tunjanganLainnya: safeTunjangan,
      bonus: safeBonus,
      potongan: safePotongan,
      keteranganPotongan: keteranganPotongan.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-neutral-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-[#F19012]/15 border border-[#F19012]/30 flex items-center justify-center text-[#F19012] shrink-0">
              <Edit3 className="w-4 h-4 text-[#F19012]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#171717] truncate">
                Edit Rincian Gaji
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-500 truncate">
                {summary.employeeName} ({summary.positionName}) · {summary.periodLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Read-Only Attendance Calculation */}
          <div className="p-3 sm:p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-neutral-600">
              <Calculator className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span>Kalkulasi Kehadiran (Read-Only)</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1 text-center">
              <div className="p-1.5 sm:p-2 bg-white rounded-lg border border-neutral-200/80">
                <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold block">Hari Hadir</span>
                <span className="text-xs sm:text-sm font-bold text-neutral-900 tabular-nums">{summary.validDays} Hari</span>
              </div>
              <div className="p-1.5 sm:p-2 bg-white rounded-lg border border-neutral-200/80">
                <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold block">Gaji Harian</span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-neutral-900 tabular-nums">{formatRupiah(summary.dailyWage)}</span>
              </div>
              <div className="p-1.5 sm:p-2 bg-white rounded-lg border border-neutral-200/80">
                <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold block">Gaji Pokok</span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-[#F19012] tabular-nums">{formatRupiah(summary.gajiPokok)}</span>
              </div>
            </div>
            <p className="text-[10px] text-neutral-500 italic text-center">
              Gaji pokok otomatis dihitung dari rekap presensi dan tidak dapat diubah manual.
            </p>
          </div>

          {/* Section: Penyesuaian Penghasilan Tambahan */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-sm bg-[#F19012]"></span>
              Komponen Tambahan (Penghasilan)
            </h4>

            {/* THR */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-neutral-700 uppercase">
                  THR (Tunjangan Hari Raya)
                </label>
                <span className="text-[10px] text-neutral-400">Opsional · Non-recurring</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">Rp</span>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={thr}
                  onChange={(e) => {
                    setError('');
                    setThr(Math.max(0, Number(e.target.value)));
                  }}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg font-mono text-neutral-900 text-xs focus:outline-none focus:border-[#F19012]"
                />
              </div>
            </div>

            {/* Tunjangan Lainnya */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                Tunjangan Lainnya
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">Rp</span>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={tunjanganLainnya}
                  onChange={(e) => {
                    setError('');
                    setTunjanganLainnya(Math.max(0, Number(e.target.value)));
                  }}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg font-mono text-neutral-900 text-xs focus:outline-none focus:border-[#F19012]"
                />
              </div>
            </div>

            {/* Bonus */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                Bonus
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">Rp</span>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={bonus}
                  onChange={(e) => {
                    setError('');
                    setBonus(Math.max(0, Number(e.target.value)));
                  }}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg font-mono text-neutral-900 text-xs focus:outline-none focus:border-[#F19012]"
                />
              </div>
            </div>
          </div>

          {/* Section: Komponen Potongan */}
          <div className="space-y-3 pt-2 border-t border-neutral-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-sm bg-neutral-400"></span>
              Komponen Pengurangan (Potongan)
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                Potongan Lainnya
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">Rp</span>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={potongan}
                  onChange={(e) => {
                    setError('');
                    setPotongan(Math.max(0, Number(e.target.value)));
                  }}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg font-mono text-neutral-900 text-xs focus:outline-none focus:border-[#F19012]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                Keterangan Potongan (Opsional)
              </label>
              <input
                type="text"
                value={keteranganPotongan}
                onChange={(e) => setKeteranganPotongan(e.target.value)}
                placeholder="Contoh: Keterlambatan, Kasbon, Pinjaman Karyawan..."
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 text-xs focus:outline-none focus:border-[#F19012]"
              />
            </div>
          </div>

          {/* Real-time Summary Card */}
          <div className="p-3 bg-neutral-100/90 rounded-xl border border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between text-neutral-600">
              <span>Total Penghasilan:</span>
              <span className="font-mono font-semibold tabular-nums text-neutral-900">
                {formatRupiah(previewTotalPenghasilan)}
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-600">
              <span>Total Potongan:</span>
              <span className="font-mono font-semibold tabular-nums text-neutral-900">
                {formatRupiah(previewTotalPotongan)}
              </span>
            </div>
            <div className="pt-1.5 border-t border-neutral-300 flex items-center justify-between font-bold text-xs text-neutral-900">
              <span className="text-[#F19012] uppercase tracking-wider">TOTAL GAJI BERSIH:</span>
              <span className="text-sm font-mono font-extrabold text-[#F19012] tabular-nums">
                {formatRupiah(previewTotalGajiBersih)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#F19012] hover:bg-[#D97E0A] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
