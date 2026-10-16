import React from 'react';
import { EmployeePayrollSummary } from '../types';
import { formatIndonesianDate, formatRupiah } from '../utils/formatters';
import { Printer, X, Download, FileSpreadsheet } from 'lucide-react';

interface PayrollExportModalProps {
  isOpen: boolean;
  periodLabel: string;
  outletLabel: string;
  summaries: EmployeePayrollSummary[];
  grandTotal: number;
  totalDays: number;
  onClose: () => void;
  onDownloadCSV: () => void;
}

export const PayrollExportModal: React.FC<PayrollExportModalProps> = ({
  isOpen,
  periodLabel,
  outletLabel,
  summaries,
  grandTotal,
  totalDays,
  onClose,
  onDownloadCSV,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions */}
        <div className="px-5 py-3.5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Pratinjau Dokumen Laporan Penggajian (PDF / Cetak)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadCSV}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Excel (.csv)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#D31027] hover:bg-[#B80D21] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-8 overflow-y-auto flex-1 bg-white space-y-6 print:p-0">
          {/* Header of Report */}
          <div className="border-b-2 border-neutral-800 pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D31027] flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                  HD
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-[#0F172A] tracking-tight leading-tight">
                    HD Fried Chicken
                  </h1>
                  <span className="text-xs font-semibold text-[#D31027] leading-tight block">
                    Laporan Rekap Gaji & Kehadiran
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right text-xs space-y-0.5 text-neutral-600">
              <p><span className="font-semibold text-neutral-800">Periode:</span> {periodLabel}</p>
              <p><span className="font-semibold text-neutral-800">Outlet:</span> {outletLabel}</p>
              <p><span className="font-semibold text-neutral-800">Tanggal Cetak:</span> 15 Okt 2026</p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-xs text-left border-collapse border border-neutral-300">
            <thead>
              <tr className="bg-neutral-100 text-neutral-800 font-bold border-b border-neutral-300">
                <th className="py-2 px-2 border-r border-neutral-300 w-8 text-center">No</th>
                <th className="py-2 px-2.5 border-r border-neutral-300">NIP</th>
                <th className="py-2 px-2.5 border-r border-neutral-300">Nama Karyawan</th>
                <th className="py-2 px-2.5 border-r border-neutral-300">Posisi / Level</th>
                <th className="py-2 px-2 border-r border-neutral-300 text-center">Hari Hadir</th>
                <th className="py-2 px-2.5 border-r border-neutral-300 text-right">Gaji Pokok</th>
                <th className="py-2 px-2.5 border-r border-neutral-300 text-right">Tunjangan</th>
                <th className="py-2 px-2.5 border-r border-neutral-300 text-right">Potongan</th>
                <th className="py-2 px-2.5 text-right">Total Gaji Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {summaries.map((item, idx) => (
                <tr key={item.employeeId} className="hover:bg-neutral-50">
                  <td className="py-2 px-2 border-r border-neutral-200 text-center text-neutral-600">{idx + 1}</td>
                  <td className="py-2 px-2.5 border-r border-neutral-200 font-mono font-bold text-neutral-800">{item.nip}</td>
                  <td className="py-2 px-2.5 border-r border-neutral-200 font-semibold text-neutral-900">{item.employeeName}</td>
                  <td className="py-2 px-2.5 border-r border-neutral-200 text-neutral-700">{item.positionName}</td>
                  <td className="py-2 px-2 border-r border-neutral-200 text-center tabular-nums">{item.validDays} Hari</td>
                  <td className="py-2 px-2.5 border-r border-neutral-200 text-right font-mono tabular-nums">{formatRupiah(item.gajiPokok)}</td>
                  <td className="py-2 px-2.5 border-r border-neutral-200 text-right font-mono tabular-nums text-emerald-700">+{formatRupiah(item.totalTunjangan)}</td>
                  <td className="py-2 px-2.5 border-r border-neutral-200 text-right font-mono tabular-nums text-rose-600">{item.totalPotongan > 0 ? `-${formatRupiah(item.totalPotongan)}` : 'Rp0'}</td>
                  <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums text-neutral-900">{formatRupiah(item.totalWage)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-100 border-t-2 border-neutral-400 font-bold text-neutral-900">
                <td colSpan={4} className="py-2.5 px-3 border-r border-neutral-300 uppercase text-neutral-700">
                  TOTAL KESELURUHAN
                </td>
                <td className="py-2.5 px-2 border-r border-neutral-300 text-center tabular-nums">
                  {totalDays} Hari
                </td>
                <td className="py-2.5 px-2.5 border-r border-neutral-300 text-right font-mono tabular-nums text-neutral-800">
                  {formatRupiah(summaries.reduce((sum, i) => sum + i.gajiPokok, 0))}
                </td>
                <td className="py-2.5 px-2.5 border-r border-neutral-300 text-right font-mono tabular-nums text-emerald-700">
                  +{formatRupiah(summaries.reduce((sum, i) => sum + i.totalTunjangan, 0))}
                </td>
                <td className="py-2.5 px-2.5 border-r border-neutral-300 text-right font-mono tabular-nums text-rose-600">
                  -{formatRupiah(summaries.reduce((sum, i) => sum + i.totalPotongan, 0))}
                </td>
                <td className="py-2.5 px-2.5 text-right font-mono text-sm text-[#F19012] tabular-nums font-black">
                  {formatRupiah(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures & Notes */}
          <div className="grid grid-cols-2 pt-6 text-xs text-neutral-600">
            <div>
              <p className="font-semibold text-neutral-800">Catatan:</p>
              <ul className="list-disc list-inside text-[11px] text-neutral-500 space-y-0.5 mt-1">
                <li>Tarif harian dihitung berdasarkan level/posisi masing-masing karyawan per hari hadir valid.</li>
                <li>Dokumen ini digenerate secara otomatis oleh HD Fried Chicken Attendance & Payroll.</li>
              </ul>
            </div>
            <div className="text-right space-y-12">
              <p>Disetujui oleh Admin Operasional,</p>
              <p className="font-bold underline text-neutral-800">( Manajemen HD Outlet )</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500 print:hidden">
          <span>Pratinjau cetak PDF/kertas dokumen resmi</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
