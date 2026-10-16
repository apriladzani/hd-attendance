import React from 'react';
import { EmployeePayrollSummary } from '../types';
import { formatRupiah } from '../utils/formatters';

interface PayslipDocumentProps {
  summary: EmployeePayrollSummary;
  id?: string;
}

export const PayslipDocument: React.FC<PayslipDocumentProps> = ({ summary, id = 'payslip-print-area' }) => {
  return (
    <div
      id={id}
      className="bg-white text-[#171717] w-full max-w-[148mm] mx-auto p-4 sm:p-7 border border-neutral-200/90 rounded-xl shadow-xs print:border-none print:shadow-none print:p-0 font-sans"
      style={{ minHeight: '190mm' }}
    >
      {/* 1. Header */}
      <div className="text-center pb-4 border-b border-neutral-300">
        <div className="inline-flex items-center justify-center gap-2 mb-1">
          <img src="/hd-attendance-logo.png" alt="Logo HD Attendance" className="w-10 h-10 object-contain" />
          <h1 className="text-lg font-black tracking-wider text-[#171717] uppercase">
            HD FRIED CHICKEN
          </h1>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">
          SLIP GAJI KARYAWAN
        </p>
      </div>

      {/* 2. Employee & Period Metadata (NO OUTLET - replaced by Posisi/Level) */}
      <div className="py-3.5 border-b border-neutral-200 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
        <div>
          <span className="text-[11px] text-neutral-500 uppercase font-medium block">
            Nama Karyawan
          </span>
          <span className="font-bold text-neutral-900 text-sm">
            {summary.employeeName}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-neutral-500 uppercase font-medium block">
            Posisi / Level
          </span>
          <span className="font-bold text-neutral-900 text-sm">
            {summary.positionName}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-neutral-500 uppercase font-medium block">
            Nomor Slip Gaji
          </span>
          <span className="font-mono font-semibold text-neutral-800">
            {summary.slipNumber}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-neutral-500 uppercase font-medium block">
            Periode Penggajian
          </span>
          <span className="font-medium text-neutral-800">
            {summary.periodLabel}
          </span>
        </div>

        <div className="col-span-2 pt-0.5 text-[11px] text-neutral-500 flex items-center justify-between">
          <span>Tanggal Terbit: <strong className="text-neutral-700">{summary.issueDate}</strong></span>
          <span className="font-mono text-[10px] text-neutral-400">NIP: {summary.nip}</span>
        </div>
      </div>

      {/* 3. Section A: PENGHASILAN */}
      <div className="py-3.5 border-b border-neutral-200 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-sm bg-[#F19012]"></span>
            A. PENGHASILAN
          </h2>
          <span className="text-[10px] text-neutral-400 italic">
            ({summary.validDays} Hari Hadir valid)
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-neutral-700">
            <span>Gaji Pokok ({summary.validDays} Hari × {formatRupiah(summary.dailyWage)})</span>
            <span className="font-mono tabular-nums font-semibold text-neutral-900">
              {formatRupiah(summary.gajiPokok)}
            </span>
          </div>

          <div className="flex items-center justify-between text-neutral-700">
            <span>THR (Tunjangan Hari Raya)</span>
            <span className="font-mono tabular-nums font-semibold text-neutral-900">
              {formatRupiah(summary.thr)}
            </span>
          </div>

          <div className="flex items-center justify-between text-neutral-700">
            <span>Tunjangan Lainnya</span>
            <span className="font-mono tabular-nums font-semibold text-neutral-900">
              {formatRupiah(summary.tunjanganLainnya)}
            </span>
          </div>

          <div className="flex items-center justify-between text-neutral-700">
            <span>Bonus</span>
            <span className="font-mono tabular-nums font-semibold text-neutral-900">
              {formatRupiah(summary.bonus)}
            </span>
          </div>

          <div className="pt-2 border-t border-dashed border-neutral-200 flex items-center justify-between font-bold text-neutral-900 text-xs">
            <span>Total Penghasilan</span>
            <span className="font-mono tabular-nums text-neutral-900">
              {formatRupiah(summary.totalPenghasilan)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Section B: POTONGAN */}
      <div className="py-3.5 border-b border-neutral-200 space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-sm bg-neutral-400"></span>
          B. POTONGAN
        </h2>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-neutral-700">
            <div>
              <span>Potongan Lainnya</span>
              {summary.keteranganPotongan && (
                <span className="block text-[11px] text-neutral-500 italic">
                  ({summary.keteranganPotongan})
                </span>
              )}
            </div>
            <span className="font-mono tabular-nums font-semibold text-neutral-900">
              {summary.potongan > 0 ? `- ${formatRupiah(summary.potongan)}` : formatRupiah(0)}
            </span>
          </div>

          <div className="pt-2 border-t border-dashed border-neutral-200 flex items-center justify-between font-bold text-neutral-900 text-xs">
            <span>Total Potongan</span>
            <span className="font-mono tabular-nums text-neutral-900">
              {formatRupiah(summary.totalPotongan)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Section C: TOTAL GAJI BERSIH */}
      <div className="py-3.5 sm:py-4 border-b-2 border-neutral-900 bg-neutral-50/70 -mx-4 sm:-mx-7 px-4 sm:px-7 my-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F19012] block">
              TOTAL GAJI BERSIH
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">
              (Total Penghasilan − Total Potongan)
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg sm:text-xl font-black font-mono tracking-tight tabular-nums text-neutral-900">
              {formatRupiah(summary.totalWage)}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Signatures */}
      <div className="pt-6 grid grid-cols-2 text-xs text-neutral-700">
        <div className="text-center space-y-12">
          <p className="font-medium text-neutral-600">Disetujui oleh,</p>
          <div>
            <p className="font-bold underline text-neutral-900 uppercase tracking-wide">
              Admin
            </p>
            <p className="text-[10px] text-neutral-400">HD Fried Chicken</p>
          </div>
        </div>

        <div className="text-center space-y-12">
          <p className="font-medium text-neutral-600">Diterima oleh,</p>
          <div>
            <p className="font-bold underline text-neutral-900">
              {summary.employeeName}
            </p>
            <p className="text-[10px] text-neutral-400">{summary.positionName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
