import React, { useState } from 'react';
import { PayrollFilter, PeriodType, Outlet, OutletItem } from '../types';
import { Calendar, Filter, Search, RotateCcw } from 'lucide-react';
import { getPayrollDateRange } from '../utils/formatters';

interface PayrollFiltersProps {
  filters: PayrollFilter;
  outlets: OutletItem[];
  onApplyFilters: (newFilters: PayrollFilter) => void;
}

export const PayrollFilters: React.FC<PayrollFiltersProps> = ({
  filters,
  outlets,
  onApplyFilters,
}) => {
  // Local state until "Terapkan Filter" is clicked
  const [period, setPeriod] = useState<PeriodType>(filters.period);
  const [startDate, setStartDate] = useState<string>(filters.startDate);
  const [endDate, setEndDate] = useState<string>(filters.endDate);
  const [outlet, setOutlet] = useState<'all' | Outlet>(filters.outlet);
  const [search, setSearch] = useState<string>(filters.search);

  // Quick period change
  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      const range = getPayrollDateRange(newPeriod);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onApplyFilters({
      period,
      startDate,
      endDate,
      outlet,
      search,
    });
  };

  const handleReset = () => {
    const defaultFilter: PayrollFilter = {
      period: 'bulanan',
      ...getPayrollDateRange('bulanan'),
      outlet: 'all',
      search: '',
    };
    setPeriod(defaultFilter.period);
    setStartDate(defaultFilter.startDate);
    setEndDate(defaultFilter.endDate);
    setOutlet(defaultFilter.outlet);
    setSearch(defaultFilter.search);
    onApplyFilters(defaultFilter);
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 shadow-xs space-y-4">
      <form onSubmit={handleApply} className="space-y-4">
        {/* Main Toolbar Line 1: Period Tabs & Outlet */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Segmented Control for Period */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider shrink-0">
              Periode:
            </span>
            <div className="flex items-center bg-neutral-100 p-1 rounded-lg overflow-x-auto max-w-full">
              {(
                [
                  { id: 'harian', label: 'Harian' },
                  { id: 'mingguan', label: 'Mingguan' },
                  { id: 'bulanan', label: 'Bulanan' },
                  { id: 'custom', label: 'Custom' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePeriodChange(p.id)}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                    period === p.id
                      ? 'bg-white text-[#D31027] shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outlet Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider shrink-0">
              Outlet:
            </span>
            <select
              value={outlet}
              onChange={(e) => setOutlet(e.target.value as 'all' | Outlet)}
              className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#D31027] cursor-pointer"
            >
              <option value="all">Semua Outlet</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toolbar Line 2: Custom Date Range (if selected) + Search + Apply Action */}
        <div className="pt-2 border-t border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1">
            {/* Custom Range Date Pickers */}
            {period === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                  <span className="text-neutral-500 font-medium">Dari:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-auto px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#D31027]"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                  <span className="text-neutral-500 font-medium">Sampai:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-auto px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#D31027]"
                  />
                </div>
              </div>
            )}

            {/* Employee Search Box */}
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama karyawan..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#D31027]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="Reset Filter"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-4 py-1.5 bg-[#D31027] hover:bg-[#B80D21] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Terapkan Filter</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
