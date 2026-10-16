import React, { useState, useMemo } from 'react';
import { EmployeePayrollSummary } from '../types';
import { formatRupiah } from '../utils/formatters';
import { ArrowUpDown, Eye, Search, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface PayrollTableProps {
  summaries: EmployeePayrollSummary[];
  grandTotal: number;
  totalValidDays: number;
  totalGajiPokok: number;
  totalTunjangan: number;
  totalPotongan: number;
  onOpenDetail: (summary: EmployeePayrollSummary) => void;
  onOpenSlip: (summary: EmployeePayrollSummary) => void;
}

type SortField = 'name' | 'position' | 'validDays' | 'gajiPokok' | 'tunjangan' | 'potongan' | 'totalWage';
type SortOrder = 'asc' | 'desc';

export const PayrollTable: React.FC<PayrollTableProps> = ({
  summaries,
  grandTotal,
  totalValidDays,
  totalGajiPokok,
  totalTunjangan,
  totalPotongan,
  onOpenDetail,
  onOpenSlip,
}) => {
  const [sortField, setSortField] = useState<SortField>('validDays');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [localSearch, setLocalSearch] = useState<string>('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const processedData = useMemo(() => {
    let result = [...summaries];

    // Search filter
    if (localSearch.trim()) {
      const term = localSearch.toLowerCase();
      result = result.filter(
        item =>
          item.nip.toLowerCase().includes(term) ||
          item.employeeName.toLowerCase().includes(term) ||
          item.outlet.toLowerCase().includes(term) ||
          item.positionName.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.employeeName.localeCompare(b.employeeName);
      } else if (sortField === 'position') {
        comparison = a.positionName.localeCompare(b.positionName);
      } else if (sortField === 'validDays') {
        comparison = a.validDays - b.validDays;
      } else if (sortField === 'gajiPokok') {
        comparison = a.gajiPokok - b.gajiPokok;
      } else if (sortField === 'tunjangan') {
        comparison = a.totalTunjangan - b.totalTunjangan;
      } else if (sortField === 'potongan') {
        comparison = a.totalPotongan - b.totalPotongan;
      } else if (sortField === 'totalWage') {
        comparison = a.totalWage - b.totalWage;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [summaries, localSearch, sortField, sortOrder]);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
      {/* Table Toolbar Search */}
      <div className="p-3 sm:p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-semibold text-neutral-700">
          Daftar Gaji Karyawan ({processedData.length} Karyawan)
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Cari nama, NIP, posisi..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#F19012]"
          />
        </div>
      </div>

      {/* MOBILE VIEW: Responsive Employee Payroll Cards (block md:hidden) */}
      <div className="block md:hidden divide-y divide-neutral-100 p-3 space-y-3">
        {processedData.length === 0 ? (
          <div className="py-10 text-center text-neutral-400">
            <AlertCircle className="w-6 h-6 mx-auto text-neutral-300 mb-2" />
            <p className="text-xs font-semibold text-neutral-700">Tidak ada data karyawan ditemukan</p>
            <p className="text-[11px] text-neutral-400 mt-1">Sesuaikan filter pencarian atau periode Anda.</p>
          </div>
        ) : (
          processedData.map((item, index) => (
            <div
              key={item.employeeId}
              className="p-3.5 bg-neutral-50/60 rounded-xl border border-neutral-200/90 shadow-2xs space-y-3"
            >
              {/* Header row: Name, NIP, Posisi/Level */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-neutral-600 bg-neutral-200/70 px-1.5 py-0.5 rounded">
                      {item.nip}
                    </span>
                    <span className="text-xs font-bold text-neutral-900 truncate">
                      {item.employeeName}
                    </span>
                    {item.unverifiedDays > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        {item.unverifiedDays} Cek
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-800 font-semibold border border-neutral-200">
                      {item.positionName}
                    </span>
                    <span>· Outlet {item.outlet}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 bg-neutral-200/60 text-neutral-700 rounded-md text-[11px] font-bold tabular-nums">
                    {item.validDays} Hari
                  </span>
                </div>
              </div>

              {/* Financial Breakdown Grid */}
              <div className="grid grid-cols-3 gap-1.5 p-2 bg-white rounded-lg border border-neutral-200/80 text-center text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Gaji Pokok</span>
                  <span className="font-mono font-bold text-neutral-800 text-[11px] tabular-nums block mt-0.5">
                    {formatRupiah(item.gajiPokok)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Tunjangan</span>
                  <span className={`font-mono font-bold text-[11px] tabular-nums block mt-0.5 ${item.totalTunjangan > 0 ? 'text-emerald-700' : 'text-neutral-400'}`}>
                    {item.totalTunjangan > 0 ? `+${formatRupiah(item.totalTunjangan)}` : 'Rp0'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Potongan</span>
                  <span className={`font-mono font-bold text-[11px] tabular-nums block mt-0.5 ${item.totalPotongan > 0 ? 'text-rose-600' : 'text-neutral-400'}`}>
                    {item.totalPotongan > 0 ? `-${formatRupiah(item.totalPotongan)}` : 'Rp0'}
                  </span>
                </div>
              </div>

              {/* Net Salary & Primary Action Buttons */}
              <div className="pt-1 flex items-center justify-between gap-2 border-t border-neutral-200/70">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Total Gaji Bersih
                  </span>
                  <span className="text-sm font-black font-mono text-[#F19012] tabular-nums">
                    {formatRupiah(item.totalWage)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Detail Button */}
                  <button
                    type="button"
                    onClick={() => onOpenDetail(item)}
                    className="p-2 text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                    title="Lihat riwayat absensi"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Slip Gaji Button */}
                  <button
                    type="button"
                    onClick={() => onOpenSlip(item)}
                    className="px-3 py-2 text-xs font-bold text-white bg-[#F19012] hover:bg-[#D97E0A] rounded-lg transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    title="Buka pratinjau Slip Gaji"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Slip Gaji</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Grand Total Summary Card */}
        {processedData.length > 0 && (
          <div className="p-3.5 bg-neutral-900 text-white rounded-xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span className="uppercase tracking-wider font-semibold">Total Seluruh Karyawan:</span>
              <span className="font-bold">{totalValidDays} Hari Hadir</span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1 border-t border-neutral-800">
              <span>Pokok: {formatRupiah(totalGajiPokok)}</span>
              <span>Tunjangan: +{formatRupiah(totalTunjangan)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
              <span className="text-xs font-bold text-neutral-300 uppercase">Grand Total Gaji:</span>
              <span className="text-base font-black font-mono text-[#F19012] tabular-nums">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP VIEW: Full Table (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold select-none">
              <th className="py-3 px-3 w-10 text-center">No</th>

              {/* 1. Nama Karyawan */}
              <th className="py-3 px-3.5">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer"
                >
                  <span>Nama Karyawan</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </button>
              </th>

              {/* 2. Posisi/Level */}
              <th className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('position')}
                  className="flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer"
                >
                  <span>Posisi / Level</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </button>
              </th>

              {/* 3. Hari Hadir */}
              <th className="py-3 px-3 text-center">
                <button
                  type="button"
                  onClick={() => handleSort('validDays')}
                  className="inline-flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer"
                >
                  <span>Hari Hadir</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </button>
              </th>

              {/* 4. Gaji Pokok */}
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('gajiPokok')}
                  className="inline-flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer ml-auto"
                >
                  <span>Gaji Pokok</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </button>
              </th>

              {/* 5. Tunjangan (THR + Tunjangan Lain + Bonus) */}
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('tunjangan')}
                  className="inline-flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer ml-auto"
                >
                  <span>Tunjangan</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </button>
              </th>

              {/* 6. Potongan */}
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('potongan')}
                  className="inline-flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer ml-auto"
                >
                  <span>Potongan</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </button>
              </th>

              {/* 7. Total Gaji (Net) */}
              <th className="py-3 px-3.5 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('totalWage')}
                  className="inline-flex items-center gap-1 font-bold text-neutral-800 hover:text-neutral-900 cursor-pointer ml-auto"
                >
                  <span>Total Gaji</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </button>
              </th>

              {/* 8. Aksi */}
              <th className="py-3 px-3 text-center w-36">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-neutral-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <AlertCircle className="w-6 h-6 mx-auto text-neutral-300" />
                    <p className="text-xs font-medium text-neutral-600">
                      Tidak ada data absensi atau karyawan yang cocok.
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Coba sesuaikan filter periode, outlet, atau kata kunci pencarian Anda.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              processedData.map((item, index) => (
                <tr
                  key={item.employeeId}
                  className="hover:bg-amber-50/20 transition-colors"
                >
                  {/* No */}
                  <td className="py-3 px-3 text-center text-neutral-500 font-mono">
                    {index + 1}
                  </td>

                  {/* Nama Karyawan */}
                  <td className="py-3 px-3.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-neutral-900">{item.employeeName}</span>
                        {item.unverifiedDays > 0 && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-medium"
                            title={`${item.unverifiedDays} hari butuh verifikasi`}
                          >
                            {item.unverifiedDays} Cek
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-neutral-400">
                        {item.nip} · {item.outlet}
                      </span>
                    </div>
                  </td>

                  {/* Posisi/Level */}
                  <td className="py-3 px-3 text-neutral-800">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-neutral-100 text-neutral-800 font-medium border border-neutral-200/80">
                      {item.positionName}
                    </span>
                  </td>

                  {/* Hari Hadir */}
                  <td className="py-3 px-3 text-center font-medium tabular-nums text-neutral-800">
                    {item.validDays} Hari
                  </td>

                  {/* Gaji Pokok */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-700">
                    {formatRupiah(item.gajiPokok)}
                  </td>

                  {/* Tunjangan (THR + Tunjangan Lain + Bonus) */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {item.totalTunjangan > 0 ? (
                      <span className="text-emerald-700 font-semibold" title={`THR: ${formatRupiah(item.thr)}, Tunjangan: ${formatRupiah(item.tunjanganLainnya)}, Bonus: ${formatRupiah(item.bonus)}`}>
                        +{formatRupiah(item.totalTunjangan)}
                      </span>
                    ) : (
                      <span className="text-neutral-400">Rp0</span>
                    )}
                  </td>

                  {/* Potongan */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {item.totalPotongan > 0 ? (
                      <span className="text-rose-600 font-semibold" title={item.keteranganPotongan ? `Ket: ${item.keteranganPotongan}` : undefined}>
                        -{formatRupiah(item.totalPotongan)}
                      </span>
                    ) : (
                      <span className="text-neutral-400">Rp0</span>
                    )}
                  </td>

                  {/* Total Gaji Bersih */}
                  <td className="py-3 px-3.5 text-right font-bold text-neutral-900 font-mono tabular-nums text-[13px]">
                    {formatRupiah(item.totalWage)}
                  </td>

                  {/* Aksi: Slip Gaji & Detail */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Slip Gaji Button */}
                      <button
                        type="button"
                        onClick={() => onOpenSlip(item)}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-[#F19012] hover:bg-[#D97E0A] rounded-md transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                        title="Buka pratinjau Slip Gaji karyawan"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Slip Gaji</span>
                      </button>

                      {/* Detail Absensi Button */}
                      <button
                        type="button"
                        onClick={() => onOpenDetail(item)}
                        className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 rounded-md transition-colors cursor-pointer"
                        title="Lihat riwayat absensi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Footer with Summary Columns */}
          {processedData.length > 0 && (
            <tfoot>
              <tr className="bg-neutral-100/95 border-t-2 border-neutral-300 font-bold text-neutral-900 text-xs">
                <td colSpan={3} className="py-3.5 px-3.5 text-left uppercase tracking-wider text-neutral-700">
                  Total Keseluruhan
                </td>
                <td className="py-3.5 px-3 text-center tabular-nums text-neutral-800">
                  {totalValidDays} Hari
                </td>
                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-neutral-800">
                  {formatRupiah(totalGajiPokok)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-emerald-700">
                  +{formatRupiah(totalTunjangan)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-rose-600">
                  {totalPotongan > 0 ? `-${formatRupiah(totalPotongan)}` : 'Rp0'}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono text-sm text-[#F19012] tabular-nums font-black">
                  {formatRupiah(grandTotal)}
                </td>
                <td className="py-3.5 px-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
