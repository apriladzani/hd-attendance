import React from 'react';
import { Clock, Calculator, ShieldCheck, Lock } from 'lucide-react';

interface TopNavigationProps {
  activeTab: 'absensi' | 'payroll';
  onTabChange: (tab: 'absensi' | 'payroll') => void;
  isAdminUnlocked: boolean;
  onLockAdmin: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  onTabChange,
  isAdminUnlocked,
  onLockAdmin,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="/hd-attendance-logo.png"
              alt="Logo HD Attendance"
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain shrink-0"
            />
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight text-[#0F172A] block leading-tight truncate">
                HD Fried Chicken
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-[#D31027] block leading-tight mt-0.5 truncate">
                Absensi & Payroll
              </span>
            </div>
          </div>

          {/* Navigation Controls: Exactly Two Main Menus */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <nav className="flex items-center bg-neutral-100 p-0.5 sm:p-1 rounded-xl">
              <button
                type="button"
                onClick={() => onTabChange('absensi')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'absensi'
                    ? 'bg-white text-[#D31027] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Absensi</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('payroll')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'payroll'
                    ? 'bg-white text-[#D31027] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Generate Gaji</span>
                {isAdminUnlocked && (
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shrink-0" title="Admin Terbuka" />
                )}
              </button>
            </nav>

            {/* Quick Lock Action if unlocked & in payroll view */}
            {activeTab === 'payroll' && isAdminUnlocked && (
              <button
                type="button"
                onClick={onLockAdmin}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                title="Kunci Halaman Admin"
              >
                <Lock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="hidden sm:inline">Kunci</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
