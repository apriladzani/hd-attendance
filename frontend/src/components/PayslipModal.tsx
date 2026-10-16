import React, { useState } from 'react';
import { EmployeePayrollSummary } from '../types';
import { PayslipDocument } from './PayslipDocument';
import { Printer, Download, Edit3, X, FileText, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PayslipModalProps {
  isOpen: boolean;
  summary: EmployeePayrollSummary | null;
  onClose: () => void;
  onOpenEdit: (summary: EmployeePayrollSummary) => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  summary,
  onClose,
  onOpenEdit,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen || !summary) return null;

  // Print dialog - Prints ONLY the payslip document due to @media print rules
  const handlePrint = () => {
    window.print();
  };

  // Download PDF using html2canvas & jsPDF with exact name format
  const handleDownloadPDF = async () => {
    const element = document.getElementById('payslip-print-area');
    if (!element) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));

      // Format filename: Slip-Gaji-Andi-Saputra-Oktober-2026.pdf
      const cleanName = summary.employeeName.trim().replace(/\s+/g, '-');
      // Format period for filename
      let periodName = 'Oktober-2026';
      if (summary.periodLabel) {
        periodName = summary.periodLabel
          .replace(/[()]/g, '')
          .trim()
          .replace(/\s+/g, '-');
      }
      const filename = `Slip-Gaji-${cleanName}-${periodName}.pdf`;

      pdf.save(filename);
      setToast(`PDF ${filename} berhasil diunduh.`);
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error('Gagal generate PDF:', err);
      // Fallback to browser print
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-xl bg-neutral-100 rounded-2xl border border-neutral-300 shadow-2xl overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (hidden on print) */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-neutral-200 bg-white flex items-center justify-between gap-1.5 print:hidden shrink-0">
          <div className="flex items-center gap-1.5 truncate min-w-0 pr-1">
            <FileText className="w-4 h-4 text-[#F19012] shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-neutral-800 uppercase tracking-wider truncate">
              Slip Gaji
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* 1. Edit Rincian Button */}
            <button
              type="button"
              onClick={() => onOpenEdit(summary)}
              className="px-2 sm:px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Edit THR, Tunjangan Lainnya, Bonus, atau Potongan"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#F19012]" />
              <span className="hidden sm:inline">Edit Rincian</span>
            </button>

            {/* 2. Download PDF Button */}
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPDF}
              className="px-2 sm:px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-60"
              title="Download file PDF Slip Gaji"
            >
              <Download className="w-3.5 h-3.5 text-neutral-300" />
              <span className="hidden sm:inline">{isDownloading ? 'Menyimpan...' : 'Download PDF'}</span>
            </button>

            {/* 3. Cetak Slip Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 sm:px-3.5 py-1.5 bg-[#F19012] hover:bg-[#D97E0A] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Cetak slip gaji (A5 Portrait)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Cetak</span>
              <span className="hidden sm:inline"> Slip</span>
            </button>

            {/* 4. Tutup Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast Notification inside modal if PDF is downloaded */}
        {toast && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 print:hidden">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* Document Viewer (A5 Portrait presentation) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-neutral-200/60 print:p-0 print:bg-white flex justify-center">
          <PayslipDocument summary={summary} id="payslip-print-area" />
        </div>

        {/* Modal Footer Info (hidden on print) */}
        <div className="px-5 py-2.5 border-t border-neutral-200 bg-white flex items-center justify-between text-xs text-neutral-500 print:hidden shrink-0">
          <span className="text-[11px]">
            Format cetak standar A5 Portrait · Posisi: <strong className="text-neutral-700">{summary.positionName}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-600 hover:text-neutral-900 font-semibold text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
