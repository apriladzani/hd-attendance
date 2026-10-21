import React, { useState, useMemo } from 'react';
import { 
  Employee, 
  AttendanceRecord, 
  PayrollFilter, 
  EmployeePayrollSummary, 
  GeneratedPayrollRecord,
  OutletItem,
  PositionLevel,
  SalaryAdjustment
} from '../types';
import { PayrollFilters } from './PayrollFilters';
import { PayrollSummary } from './PayrollSummary';
import { PayrollTable } from './PayrollTable';
import { AttendanceDetailModal } from './AttendanceDetailModal';
import { GeneratePayrollModal } from './GeneratePayrollModal';
import { PayrollExportModal } from './PayrollExportModal';
import { PayslipModal } from './PayslipModal';
import { EditSalaryModal } from './EditSalaryModal';
import { ChangePinModal } from './ChangePinModal';
import { MasterDataModal } from './MasterDataModal';
import { formatIndonesianDate, formatRupiah, exportPayrollToCSV, getPayrollDateRange, getTodayDateString } from '../utils/formatters';
import { 
  Lock, 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  History, 
  Check, 
  X,
  Layers,
  KeyRound,
  FileCheck,
  Trash2
} from 'lucide-react';

interface PayrollPageProps {
  employees: Employee[];
  outlets: OutletItem[];
  positions: PositionLevel[];
  attendanceRecords: AttendanceRecord[];
  generatedBatches: GeneratedPayrollRecord[];
  adminPin: string;
  onLock: () => void;
  onVerifyRecord: (recordId: string) => void;
  onDeleteAttendanceRecord: (recordId: string) => Promise<void>;
  onAddGeneratedBatch: (batch: GeneratedPayrollRecord) => Promise<void>;
  onDeleteGeneratedBatch: (batchId: string) => Promise<void>;
  onUpdateOutlets: (outlets: OutletItem[]) => Promise<void>;
  onUpdateEmployees: (employees: Employee[]) => Promise<void>;
  onUpdatePositions: (positions: PositionLevel[]) => Promise<void>;
  onUpdatePin: (newPin: string) => void;
}

export const PayrollPage: React.FC<PayrollPageProps> = ({
  employees,
  outlets,
  positions,
  attendanceRecords,
  generatedBatches,
  adminPin,
  onLock,
  onVerifyRecord,
  onDeleteAttendanceRecord,
  onAddGeneratedBatch,
  onDeleteGeneratedBatch,
  onUpdateOutlets,
  onUpdateEmployees,
  onUpdatePositions,
  onUpdatePin,
}) => {
  // Current active filter state
  const [filters, setFilters] = useState<PayrollFilter>({
    period: 'bulanan',
    ...getPayrollDateRange('bulanan'),
    outlet: 'all',
    search: '',
  });

  // Salary adjustments state associated with employeeId AND payroll period
  // Key format: `${employeeId}_${startDate}_${endDate}`
  const [salaryAdjustments, setSalaryAdjustments] = useState<Record<string, SalaryAdjustment>>({
    // Pre-populated demo data matching prompt example for Andi Saputra (EMP-001) in current monthly period
    'EMP-001_2026-09-16_2026-10-15': {
      thr: 500000,
      tunjanganLainnya: 100000,
      bonus: 0,
      potongan: 0,
      keteranganPotongan: '',
    },
    'EMP-002_2026-09-16_2026-10-15': {
      thr: 0,
      tunjanganLainnya: 150000,
      bonus: 100000,
      potongan: 50000,
      keteranganPotongan: 'Kasbon operasional',
    },
  });

  // Modal states
  const [selectedDetailSummary, setSelectedDetailSummary] = useState<EmployeePayrollSummary | null>(null);
  const [selectedSlipSummary, setSelectedSlipSummary] = useState<EmployeePayrollSummary | null>(null);
  const [selectedEditSummary, setSelectedEditSummary] = useState<EmployeePayrollSummary | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isExportPDFModalOpen, setIsExportPDFModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isMasterDataModalOpen, setIsMasterDataModalOpen] = useState(false);
  const [masterDataInitialTab, setMasterDataInitialTab] = useState<'outlets' | 'employees' | 'positions'>('outlets');
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [batchPendingDelete, setBatchPendingDelete] = useState<GeneratedPayrollRecord | null>(null);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  
  // Success notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Period label computation
  const periodLabel = useMemo(() => {
    if (filters.period === 'harian') {
      return `Harian (${formatIndonesianDate(filters.startDate)})`;
    }
    if (filters.period === 'mingguan') {
      return `Mingguan (${formatIndonesianDate(filters.startDate)} - ${formatIndonesianDate(filters.endDate)})`;
    }
    if (filters.period === 'bulanan') {
      return `Bulanan (${formatIndonesianDate(filters.startDate)} - ${formatIndonesianDate(filters.endDate)})`;
    }
    return `Custom (${formatIndonesianDate(filters.startDate)} - ${formatIndonesianDate(filters.endDate)})`;
  }, [filters]);

  const outletLabel = useMemo(() => {
    if (filters.outlet === 'all') return 'Semua Outlet';
    return `Outlet ${filters.outlet}`;
  }, [filters.outlet]);

  // Derive payroll calculations strictly from attendanceRecords, position levels, and period adjustments
  const payrollSummaries: EmployeePayrollSummary[] = useMemo(() => {
    const periodKey = `${filters.startDate}_${filters.endDate}`;

    // 1. Filter employees by outlet & search
    let targetEmployees = [...employees];
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      targetEmployees = targetEmployees.filter(e => 
        e.nip.toLowerCase().includes(term) ||
        e.name.toLowerCase().includes(term) || 
        e.positionName.toLowerCase().includes(term) ||
        attendanceRecords.some(record => record.employeeId === e.id &&
          record.date >= filters.startDate && record.date <= filters.endDate &&
          record.outlet.toLowerCase().includes(term))
      );
    }
    if (filters.outlet !== 'all') {
      targetEmployees = targetEmployees.filter(employee => attendanceRecords.some(record =>
        record.employeeId === employee.id &&
        record.date >= filters.startDate && record.date <= filters.endDate &&
        record.outlet === filters.outlet
      ));
    }

    // 2. Compute summary for each employee
    return targetEmployees.map((emp, idx) => {
      // Find all records within date range
      const recordsInRange = attendanceRecords.filter((rec) => {
        if (rec.employeeId !== emp.id) return false;
        if (rec.date < filters.startDate || rec.date > filters.endDate) return false;
        if (filters.outlet !== 'all' && rec.outlet !== filters.outlet) return false;
        return true;
      });

      // Deduplicate by date for valid working days
      const validDateMap = new Set<string>();
      let unverifiedCount = 0;

      recordsInRange.forEach((rec) => {
        if (rec.isValid) {
          validDateMap.add(rec.date);
        } else if (rec.status === 'Perlu Verifikasi') {
          unverifiedCount++;
        }
      });

      // Find position daily wage
      const pos = positions.find(p => p.id === emp.positionId);
      const dailyWage = pos ? pos.dailyWage : 50000;
      const positionName = pos ? pos.name : emp.positionName;

      const validDays = validDateMap.size;
      const gajiPokok = validDays * dailyWage;

      // Retrieve period adjustment for this specific employee
      const adjKey = `${emp.id}_${periodKey}`;
      const adj = salaryAdjustments[adjKey] || {
        thr: 0,
        tunjanganLainnya: 0,
        bonus: 0,
        potongan: 0,
        keteranganPotongan: '',
      };

      const thr = adj.thr || 0;
      const tunjanganLainnya = adj.tunjanganLainnya || 0;
      const bonus = adj.bonus || 0;
      const totalTunjangan = thr + tunjanganLainnya + bonus;
      const totalPenghasilan = gajiPokok + totalTunjangan;

      const potongan = adj.potongan || 0;
      const totalPotongan = potongan;
      const totalWage = Math.max(0, totalPenghasilan - totalPotongan);

      const slipNumber = `PAY-${filters.startDate.slice(0, 7).replace('-', '')}-${String(idx + 1).padStart(3, '0')}`;
      const issueDate = formatIndonesianDate(getTodayDateString());

      return {
        employeeId: emp.id,
        nip: emp.nip,
        employeeName: emp.name,
        outlet: recordsInRange[0]?.outlet || (filters.outlet === 'all' ? '-' : filters.outlet),
        positionName,
        slipNumber,
        periodLabel,
        issueDate,
        validDays,
        unverifiedDays: unverifiedCount,
        dailyWage,
        gajiPokok,
        thr,
        tunjanganLainnya,
        bonus,
        totalTunjangan,
        totalPenghasilan,
        potongan,
        keteranganPotongan: adj.keteranganPotongan || '',
        totalPotongan,
        totalWage,
        records: recordsInRange.sort((a, b) => b.date.localeCompare(a.date)),
      };
    });
  }, [employees, positions, attendanceRecords, filters, salaryAdjustments, periodLabel]);

  // Totals for summary sections
  const totalAttendanceDays = useMemo(() => {
    return payrollSummaries.reduce((sum, item) => sum + item.validDays, 0);
  }, [payrollSummaries]);

  const totalGajiPokok = useMemo(() => {
    return payrollSummaries.reduce((sum, item) => sum + item.gajiPokok, 0);
  }, [payrollSummaries]);

  const totalTunjangan = useMemo(() => {
    return payrollSummaries.reduce((sum, item) => sum + item.totalTunjangan, 0);
  }, [payrollSummaries]);

  const totalPotongan = useMemo(() => {
    return payrollSummaries.reduce((sum, item) => sum + item.totalPotongan, 0);
  }, [payrollSummaries]);

  const grandTotalSalary = useMemo(() => {
    return payrollSummaries.reduce((sum, item) => sum + item.totalWage, 0);
  }, [payrollSummaries]);

  const totalUnverified = useMemo(() => {
    return payrollSummaries.reduce((sum, item) => sum + item.unverifiedDays, 0);
  }, [payrollSummaries]);

  // Active synced summary for open modals
  const activeDetailSummary = useMemo(() => {
    if (!selectedDetailSummary) return null;
    return payrollSummaries.find(s => s.employeeId === selectedDetailSummary.employeeId) || selectedDetailSummary;
  }, [payrollSummaries, selectedDetailSummary]);

  const activeSlipSummary = useMemo(() => {
    if (!selectedSlipSummary) return null;
    return payrollSummaries.find(s => s.employeeId === selectedSlipSummary.employeeId) || selectedSlipSummary;
  }, [payrollSummaries, selectedSlipSummary]);

  const activeEditSummary = useMemo(() => {
    if (!selectedEditSummary) return null;
    return payrollSummaries.find(s => s.employeeId === selectedEditSummary.employeeId) || selectedEditSummary;
  }, [payrollSummaries, selectedEditSummary]);

  // Save Salary Adjustment
  const handleSaveAdjustment = (employeeId: string, adj: SalaryAdjustment) => {
    const periodKey = `${filters.startDate}_${filters.endDate}`;
    const adjKey = `${employeeId}_${periodKey}`;

    setSalaryAdjustments(prev => ({
      ...prev,
      [adjKey]: adj,
    }));

    setToastMessage('Rincian komponen gaji karyawan berhasil diperbarui dan disinkronkan.');
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Handle Generate Gaji Confirmation (Prevent duplicate batch for same period)
  const handleConfirmGenerate = async () => {
    // Check duplicate
    const isDuplicate = generatedBatches.some(
      b => b.startDate === filters.startDate && b.endDate === filters.endDate && b.outlet === filters.outlet
    );

    if (isDuplicate) {
      if (!confirm(`Batch gaji untuk periode ${periodLabel} sudah pernah digenerate. Tetap buat rekapan baru?`)) {
        return;
      }
    }

    const newBatch: GeneratedPayrollRecord = {
      id: `BATCH-${Date.now()}`,
      batchCode: `PAY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
      generatedAt: `${formatIndonesianDate(new Date().toISOString().slice(0, 10))} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      periodLabel,
      startDate: filters.startDate,
      endDate: filters.endDate,
      outlet: filters.outlet,
      totalEmployees: payrollSummaries.length,
      totalDays: totalAttendanceDays,
      grandTotal: grandTotalSalary,
      details: payrollSummaries.map(s => ({
        nip: s.nip,
        employeeName: s.employeeName,
        outlet: s.outlet,
        positionName: s.positionName,
        validDays: s.validDays,
        dailyWage: s.dailyWage,
        totalWage: s.totalWage,
      })),
    };

    setIsSavingBatch(true);
    try {
      await onAddGeneratedBatch(newBatch);
      setIsGenerateModalOpen(false);
      setToastMessage(`Sukses! Rekap gaji periode ${periodLabel} berhasil digenerate (${formatRupiah(grandTotalSalary)} untuk ${payrollSummaries.length} karyawan).`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Rekap gaji gagal disimpan.');
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Handle Export Excel (.csv)
  const handleExportCSV = () => {
    const items = payrollSummaries.map((s, idx) => ({
      no: idx + 1,
      nip: s.nip,
      name: s.employeeName,
      outlet: s.outlet,
      positionName: s.positionName,
      validDays: s.validDays,
      dailyWage: s.dailyWage,
      gajiPokok: s.gajiPokok,
      thr: s.thr,
      tunjanganLainnya: s.tunjanganLainnya,
      bonus: s.bonus,
      totalTunjangan: s.totalTunjangan,
      potongan: s.totalPotongan,
      totalWage: s.totalWage,
    }));

    exportPayrollToCSV(periodLabel, outletLabel, items, grandTotalSalary);

    setToastMessage(`File CSV Rekap Gaji (${periodLabel}) berhasil diunduh untuk Microsoft Excel.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <main className="py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-neutral-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#0F172A]">
              Rekap & Generate Gaji
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              Kelola rekap presensi, komponen gaji (THR, tunjangan, potongan), dan cetak slip gaji karyawan.
            </p>
          </div>

          {/* Action Toolbar: Adaptive wrapping on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
            {/* CRUD Master Data Button */}
            <button
              type="button"
              onClick={() => {
                setMasterDataInitialTab('outlets');
                setIsMasterDataModalOpen(true);
              }}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 hover:border-neutral-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Kelola Master Outlet, Karyawan, dan Posisi/Gaji"
            >
              <Layers className="w-3.5 h-3.5 text-[#F19012] shrink-0" />
              <span>Master Data & Tarif</span>
            </button>

            {/* Ganti PIN Button */}
            <button
              type="button"
              onClick={() => setIsChangePinModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 hover:border-neutral-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Ganti PIN Keamanan Admin"
            >
              <KeyRound className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              <span>Ganti PIN</span>
            </button>

            {/* View Past Batches Button */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Lihat Riwayat Batch yang Pernah Digenerate"
            >
              <History className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              <span>Riwayat ({generatedBatches.length})</span>
            </button>

            {/* Lock Page Button */}
            <button
              type="button"
              onClick={onLock}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto sm:ml-0"
              title="Kunci Halaman"
            >
              <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>Kunci</span>
            </button>
          </div>
        </div>

        {/* Filtering Section */}
        <PayrollFilters
          filters={filters}
          outlets={outlets}
          onApplyFilters={(newFilters) => setFilters(newFilters)}
        />

        {/* Payroll Summary Section (Exactly Two Compact KPI Sections) */}
        <PayrollSummary
          totalAttendanceDays={totalAttendanceDays}
          grandTotalSalary={grandTotalSalary}
          unverifiedDaysCount={totalUnverified}
        />

        {/* Actions Bar (Generate Gaji & Export Buttons) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-neutral-500">
            Menampilkan kalkulasi untuk: <strong className="text-neutral-800">{periodLabel}</strong> · <strong className="text-neutral-800">{outletLabel}</strong>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              title="Unduh laporan dalam format CSV/Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            {/* Export Rekap PDF */}
            <button
              type="button"
              onClick={() => setIsExportPDFModalOpen(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              title="Pratinjau cetak slip rekap PDF"
            >
              <FileText className="w-4 h-4 text-[#F19012]" />
              <span>Export Rekap PDF</span>
            </button>

            {/* Primary Action: Generate Gaji */}
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              disabled={payrollSummaries.length === 0}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                payrollSummaries.length > 0
                  ? 'bg-[#F19012] hover:bg-[#D97E0A] text-white'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Gaji</span>
            </button>
          </div>
        </div>

        {/* Payroll Table */}
        <PayrollTable
          summaries={payrollSummaries}
          grandTotal={grandTotalSalary}
          totalValidDays={totalAttendanceDays}
          totalGajiPokok={totalGajiPokok}
          totalTunjangan={totalTunjangan}
          totalPotongan={totalPotongan}
          onOpenDetail={(summary) => setSelectedDetailSummary(summary)}
          onOpenSlip={(summary) => setSelectedSlipSummary(summary)}
        />
      </div>

      {/* Attendance Detail Modal */}
      {activeDetailSummary && (
        <AttendanceDetailModal
          summary={activeDetailSummary}
          periodLabel={periodLabel}
          onClose={() => setSelectedDetailSummary(null)}
          onVerifyRecord={(recordId) => {
            onVerifyRecord(recordId);
            setToastMessage('Kehadiran berhasil diverifikasi dan ditambahkan ke kalkulasi gaji.');
            setTimeout(() => setToastMessage(null), 4000);
          }}
          onDeleteAttendanceRecord={onDeleteAttendanceRecord}
          onOpenSlip={(summary) => {
            setSelectedDetailSummary(null);
            setSelectedSlipSummary(summary);
          }}
        />
      )}

      {/* Payslip Modal (Preview, Edit Rincian, Cetak Slip, Download PDF) */}
      <PayslipModal
        isOpen={!!activeSlipSummary}
        summary={activeSlipSummary}
        onClose={() => setSelectedSlipSummary(null)}
        onOpenEdit={(summary) => {
          setSelectedEditSummary(summary);
        }}
      />

      {/* Edit Salary Components Modal */}
      <EditSalaryModal
        isOpen={!!activeEditSummary}
        summary={activeEditSummary}
        onClose={() => setSelectedEditSummary(null)}
        onSave={(employeeId, adjustment) => {
          handleSaveAdjustment(employeeId, adjustment);
        }}
      />

      {/* Change PIN Modal (Fitur Ganti Password) */}
      <ChangePinModal
        isOpen={isChangePinModalOpen}
        currentPin={adminPin}
        onClose={() => setIsChangePinModalOpen(false)}
        onUpdatePin={(newPin) => {
          onUpdatePin(newPin);
          setToastMessage('PIN Admin berhasil diperbarui! Silakan gunakan PIN baru saat mengakses kembali.');
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />

      {/* Master Data CRUD Modal (Fitur CRUD Outlet, Karyawan, Posisi/Level) */}
      <MasterDataModal
        isOpen={isMasterDataModalOpen}
        activeInitialTab={masterDataInitialTab}
        outlets={outlets}
        employees={employees}
        positions={positions}
        onClose={() => setIsMasterDataModalOpen(false)}
        onUpdateOutlets={onUpdateOutlets}
        onUpdateEmployees={onUpdateEmployees}
        onUpdatePositions={onUpdatePositions}
        onToast={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 4500);
        }}
      />

      {/* Generate Payroll Confirmation Modal */}
      <GeneratePayrollModal
        isOpen={isGenerateModalOpen}
        periodLabel={periodLabel}
        startDate={filters.startDate}
        endDate={filters.endDate}
        outletLabel={outletLabel}
        summaries={payrollSummaries}
        grandTotal={grandTotalSalary}
        totalDays={totalAttendanceDays}
        isSaving={isSavingBatch}
        onClose={() => setIsGenerateModalOpen(false)}
        onConfirmGenerate={handleConfirmGenerate}
      />

      {/* Export / Printable PDF Modal */}
      <PayrollExportModal
        isOpen={isExportPDFModalOpen}
        periodLabel={periodLabel}
        outletLabel={outletLabel}
        summaries={payrollSummaries}
        grandTotal={grandTotalSalary}
        totalDays={totalAttendanceDays}
        onClose={() => setIsExportPDFModalOpen(false)}
        onDownloadCSV={handleExportCSV}
      />

      {/* Generated Batches History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#F19012]" />
                <h3 className="text-base font-bold text-[#171717]">
                  Riwayat Rekap Gaji
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {generatedBatches.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-8">
                  Belum ada batch rekap gaji yang digenerate.
                </p>
              ) : (
                generatedBatches.map((batch) => (
                  <div key={batch.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-900 font-mono">{batch.batchCode}</span>
                      <span className="text-neutral-500">{batch.generatedAt}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-neutral-200/80">
                      <div>
                        <span className="text-neutral-500">Periode: </span>
                        <span className="font-semibold text-neutral-800">{batch.periodLabel}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Karyawan: </span>
                        <span className="font-semibold text-neutral-800">{batch.totalEmployees} Orang ({batch.totalDays} Hari)</span>
                      </div>
                      <div className="font-extrabold text-[#F19012] font-mono text-sm">
                        {formatRupiah(batch.grandTotal)}
                      </div>
                      <button type="button" onClick={() => setBatchPendingDelete(batch)} title="Hapus Rekap" aria-label="Hapus rekap payroll"
                        className="p-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 text-right">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {batchPendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs animate-fadeIn">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-payroll-title" className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200">
              <h3 id="delete-payroll-title" className="text-base font-bold text-[#171717]">Hapus Rekap Gaji?</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">Apakah Anda yakin ingin menghapus rekap gaji periode {batchPendingDelete.periodLabel}? Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="p-5 space-y-2 text-xs">
              <div className="flex justify-between gap-4"><span className="text-neutral-500">Periode</span><strong className="text-right text-neutral-800">{batchPendingDelete.periodLabel}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-500">Jumlah karyawan</span><strong className="text-neutral-800">{batchPendingDelete.totalEmployees} orang</strong></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-500">Total gaji</span><strong className="text-neutral-800">{formatRupiah(batchPendingDelete.grandTotal)}</strong></div>
            </div>
            <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-2">
              <button type="button" onClick={() => setBatchPendingDelete(null)} className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-100 cursor-pointer">Batal</button>
              <button type="button" disabled={isDeletingBatch} onClick={async () => {
                setIsDeletingBatch(true);
                try {
                  await onDeleteGeneratedBatch(batchPendingDelete.id);
                  setBatchPendingDelete(null);
                  setToastMessage('Rekap gaji berhasil dihapus.');
                  setTimeout(() => setToastMessage(null), 4500);
                } catch (error) {
                  setToastMessage(error instanceof Error ? error.message : 'Rekap gaji gagal dihapus. Silakan coba lagi.');
                  setTimeout(() => setToastMessage(null), 4500);
                } finally {
                  setIsDeletingBatch(false);
                }
              }} className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 disabled:opacity-60 disabled:cursor-wait cursor-pointer">{isDeletingBatch ? 'Menghapus…' : 'Hapus Rekap'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
