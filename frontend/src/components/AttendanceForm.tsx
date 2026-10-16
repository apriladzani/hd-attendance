import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Employee, Outlet, OutletItem, AttendanceRecord, AttendanceStatus } from '../types';
import { AttendanceStatusBadge } from './AttendanceStatus';
import { formatIndonesianDate, getTodayDateString, formatWIBTime } from '../utils/formatters';
import { 
  LogIn, 
  LogOut, 
  Check, 
  Search, 
  ChevronDown, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Info,
  History
} from 'lucide-react';

interface AttendanceFormProps {
  employees: Employee[];
  outlets: OutletItem[];
  attendanceRecords: AttendanceRecord[];
  onClockIn: (employeeId: string, outlet: Outlet, timeStr: string) => void;
  onClockOut: (employeeId: string, outlet: Outlet, timeStr: string) => void;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({
  employees,
  outlets,
  attendanceRecords,
  onClockIn,
  onClockOut,
}) => {
  // Currently selected employee
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet>(employees[0]?.outlet || outlets[0]?.id || 'Cisalak');
  
  // Searchable dropdown state
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Real-time ticking WIB clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Notification toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Current selected employee object
  const currentEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  useEffect(() => {
    if (employees.length === 0) {
      setSelectedEmpId('');
      return;
    }
    if (!employees.some(employee => employee.id === selectedEmpId)) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId]);

  // When selected employee changes, optionally set default outlet
  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmpId(emp.id);
    setSelectedOutlet(emp.outlet);
    setIsEmployeeDropdownOpen(false);
    setSearchTerm('');
  };

  const todayStr = getTodayDateString();

  // Find attendance record for current employee today
  const todayRecord = useMemo(() => {
    return attendanceRecords.find(
      r => r.employeeId === selectedEmpId && r.date === todayStr
    );
  }, [attendanceRecords, selectedEmpId, todayStr]);

  // Compute status
  const currentStatus: AttendanceStatus = useMemo(() => {
    if (!todayRecord) return 'Belum Absen';
    return todayRecord.status;
  }, [todayRecord]);

  // Button logic
  const canClockIn = currentStatus === 'Belum Absen';
  const canClockOut = currentStatus === 'Sedang Bekerja';
  const isCompleted = currentStatus === 'Sudah Pulang';

  // Handle Clock In
  const handleClockIn = () => {
    if (!canClockIn) return;
    const nowHours = String(currentTime.getHours()).padStart(2, '0');
    const nowMins = String(currentTime.getMinutes()).padStart(2, '0');
    const timeStr = `${nowHours}:${nowMins}`;
    
    onClockIn(selectedEmpId, selectedOutlet, timeStr);
    setNotification({
      type: 'success',
      message: `Berhasil Absen Datang untuk ${currentEmployee.name} pada pukul ${timeStr} WIB di Outlet ${selectedOutlet}.`
    });

    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Handle Clock Out
  const handleClockOut = () => {
    if (!canClockOut) return;
    const nowHours = String(currentTime.getHours()).padStart(2, '0');
    const nowMins = String(currentTime.getMinutes()).padStart(2, '0');
    const timeStr = `${nowHours}:${nowMins}`;
    
    onClockOut(selectedEmpId, selectedOutlet, timeStr);
    setNotification({
      type: 'success',
      message: `Berhasil Absen Pulang untuk ${currentEmployee.name} pada pukul ${timeStr} WIB. Kehadiran hari ini tercatat!`
    });

    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Filtered employees for search
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter(
      e => e.name.toLowerCase().includes(term) || 
           e.nip.toLowerCase().includes(term) || 
           e.outlet.toLowerCase().includes(term) || 
           (e.positionName && e.positionName.toLowerCase().includes(term))
    );
  }, [employees, searchTerm]);

  // Recent attendance for the selected employee (up to 5 records)
  const employeeHistory = useMemo(() => {
    return attendanceRecords
      .filter(r => r.employeeId === selectedEmpId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [attendanceRecords, selectedEmpId]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-xs transition-all animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold ml-2 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Form Box */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-7 shadow-xs">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          {/* Form Grid */}
          <div className="space-y-4">
              {/* 1. Nama Karyawan (Searchable Dropdown) */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Karyawan (NIP · Nama · Outlet · Level)
                </label>
                
                <div
                  onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 sm:px-3.5 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-2">
                    <User className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="font-mono text-[11px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-neutral-200/80 text-neutral-800 shrink-0">
                      {currentEmployee?.nip}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[#171717] truncate">
                      {currentEmployee?.name}
                    </span>
                    <span className="text-[11px] sm:text-xs text-neutral-500 truncate hidden xs:inline">
                      · {currentEmployee?.positionName} ({currentEmployee?.outlet})
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                </div>

                {/* Dropdown Menu */}
                {isEmployeeDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
                    {/* Search input inside dropdown */}
                    <div className="p-2 border-b border-neutral-100 bg-neutral-50">
                      <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
                        <input
                          type="text"
                          autoFocus
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Cari NIP, nama, posisi, outlet..."
                          className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-neutral-200 rounded-md focus:outline-none focus:border-[#D31027]"
                        />
                      </div>
                    </div>

                    <div className="max-h-56 sm:max-h-64 overflow-y-auto divide-y divide-neutral-100">
                      {filteredEmployees.length === 0 ? (
                        <div className="p-4 text-center text-xs text-neutral-500">
                          Tidak ada karyawan ditemukan
                        </div>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => handleSelectEmployee(emp)}
                            className={`w-full text-left px-3 sm:px-3.5 py-2.5 text-xs sm:text-sm hover:bg-red-50/60 flex items-center justify-between transition-colors cursor-pointer ${
                              emp.id === selectedEmpId ? 'bg-red-50 font-semibold text-[#D31027]' : 'text-neutral-800'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-[10px] sm:text-[11px] font-bold text-neutral-700 bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200 shrink-0">
                                  {emp.nip}
                                </span>
                                <p className="font-semibold text-neutral-900 truncate">{emp.name}</p>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5 truncate">
                                {emp.positionName} · Outlet {emp.outlet}
                              </p>
                            </div>
                            {emp.id === selectedEmpId && (
                              <Check className="w-4 h-4 text-[#D31027] shrink-0 ml-1" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

            {/* 2. Outlet Dropdown (Cukup nama outlet) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Outlet Penugasan
              </label>
              <div className="relative">
                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value as Outlet)}
                  className="w-full appearance-none px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-semibold text-[#171717] focus:outline-none focus:border-[#D31027] cursor-pointer"
                >
                  {outlets.map(outlet => (
                    <option key={outlet.id} value={outlet.name}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-neutral-500">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 3. Tanggal dan Waktu (Read-only real-time digital clock) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Date */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-1">
                  Tanggal Hari Ini
                </span>
                <div className="flex items-center gap-2 text-neutral-900 font-semibold text-sm">
                  <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>{formatIndonesianDate(todayStr, true)}</span>
                </div>
              </div>

              {/* Time */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-1">
                  Waktu Sekarang (WIB)
                </span>
                <div className="flex items-center gap-2 text-neutral-900 font-semibold text-sm tabular-nums">
                  <Clock className="w-4 h-4 text-[#D31027] shrink-0" />
                  <span>{formatWIBTime(currentTime)}</span>
                </div>
              </div>
            </div>

            {/* 4. Current Status Display */}
            <div className="pt-2 flex items-center justify-between p-3.5 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="text-xs font-medium text-neutral-600">
                Status Absensi Hari Ini:
              </span>
              <AttendanceStatusBadge status={currentStatus} />
            </div>
          </div>

          {/* 5. Two Main Attendance Buttons */}
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Absen Datang */}
            <button
              type="button"
              disabled={!canClockIn}
              onClick={handleClockIn}
              className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-xs ${
                canClockIn
                  ? 'bg-[#D31027] hover:bg-[#B80D21] text-white active:scale-[0.99] cursor-pointer'
                  : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-60'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Absen Datang</span>
            </button>

            {/* Absen Pulang */}
            <button
              type="button"
              disabled={!canClockOut}
              onClick={handleClockOut}
              className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all shadow-xs ${
                canClockOut
                  ? 'bg-[#171717] hover:bg-neutral-800 text-white active:scale-[0.99] cursor-pointer'
                  : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-60'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Absen Pulang</span>
            </button>
          </div>

          {/* Helper Notice / Duplicate Prevention Explanation */}
          <div className="flex items-start gap-2 text-[11px] text-neutral-500 pt-1">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400" />
            <p>
              {isCompleted
                ? `Absensi hari ini untuk ${currentEmployee.name} telah selesai (Sudah Pulang). Data kehadiran tercatat untuk rekap gaji.`
                : canClockOut
                ? `${currentEmployee.name} sedang bekerja sejak pukul ${todayRecord?.clockIn} WIB. Klik Absen Pulang saat jam kerja selesai.`
                : `Pilih karyawan dan pastikan outlet sesuai sebelum menekan tombol Absen Datang.`}
            </p>
          </div>
        </form>
      </div>

      {/* Attendance Information Summary for Selected Employee */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-neutral-200 bg-neutral-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-500 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 truncate">
              Ringkasan Absensi: {currentEmployee.name}
            </h3>
          </div>
          <span className="text-[11px] text-neutral-500">
            Outlet Utama: <strong className="text-neutral-700">{currentEmployee.outlet}</strong>
          </span>
        </div>

        {/* Mobile View: High-Density Responsive Cards (sm:hidden) */}
        <div className="block sm:hidden divide-y divide-neutral-100 p-3 space-y-3">
          {/* Today's Record / Status Card */}
          <div className="p-3.5 rounded-xl border border-neutral-200/90 bg-neutral-50/50 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800 shrink-0">
                  {currentEmployee.nip}
                </span>
                <span className="text-xs font-bold text-neutral-900 truncate">
                  {formatIndonesianDate(todayStr)}
                </span>
                <span className="text-[10px] font-bold text-[#D31027] shrink-0">(Hari Ini)</span>
              </div>
              <AttendanceStatusBadge status={todayRecord ? todayRecord.status : 'Belum Absen'} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-neutral-200/80">
                <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Jam Datang</span>
                <span className="font-mono font-bold text-neutral-800 text-sm">
                  {todayRecord?.clockIn || '—'}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-neutral-200/80">
                <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Jam Pulang</span>
                <span className="font-mono font-bold text-neutral-800 text-sm">
                  {todayRecord?.clockOut || '—'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
              <span>Outlet: <strong className="text-neutral-700">{todayRecord?.outlet || selectedOutlet}</strong></span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium border border-neutral-200 text-[10px]">
                {currentEmployee.positionName}
              </span>
            </div>
          </div>

          {/* Past 3 records on mobile */}
          {employeeHistory
            .filter(r => r.date !== todayStr)
            .slice(0, 3)
            .map(r => (
              <div key={r.id} className="p-3 rounded-lg border border-neutral-200/60 bg-white space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800">
                    {formatIndonesianDate(r.date)}
                  </span>
                  <AttendanceStatusBadge status={r.status} />
                </div>
                <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                  <span>Masuk: <strong className="font-mono text-neutral-800">{r.clockIn || '-'}</strong> · Pulang: <strong className="font-mono text-neutral-800">{r.clockOut || '-'}</strong></span>
                  <span>{r.outlet}</span>
                </div>
              </div>
            ))}
        </div>

        {/* Desktop / Tablet View: Full Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                <th className="py-2.5 px-3.5">NIP</th>
                <th className="py-2.5 px-3.5">Nama Karyawan</th>
                <th className="py-2.5 px-3.5">Outlet</th>
                <th className="py-2.5 px-3.5">Level / Posisi</th>
                <th className="py-2.5 px-3.5">Tanggal</th>
                <th className="py-2.5 px-3.5 text-center">Jam Datang</th>
                <th className="py-2.5 px-3.5 text-center">Jam Pulang</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {todayRecord ? (
                <tr className="bg-red-50/30 font-medium">
                  <td className="py-3 px-3.5 font-mono font-bold text-neutral-800">{todayRecord.nip || currentEmployee.nip}</td>
                  <td className="py-3 px-3.5 font-semibold text-neutral-900">
                    {todayRecord.employeeName}
                    <span className="ml-1.5 text-[10px] text-[#D31027] font-semibold">(Hari Ini)</span>
                  </td>
                  <td className="py-3 px-3.5 text-neutral-600">{todayRecord.outlet}</td>
                  <td className="py-3 px-3.5 text-neutral-700">
                    <span className="px-1.5 py-0.5 rounded text-[11px] bg-neutral-100 font-medium border border-neutral-200">
                      {currentEmployee.positionName}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-neutral-600">{formatIndonesianDate(todayRecord.date)}</td>
                  <td className="py-3 px-3.5 text-center font-mono tabular-nums text-neutral-800">
                    {todayRecord.clockIn || '-'}
                  </td>
                  <td className="py-3 px-3.5 text-center font-mono tabular-nums text-neutral-800">
                    {todayRecord.clockOut || '-'}
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <AttendanceStatusBadge status={todayRecord.status} />
                  </td>
                </tr>
              ) : (
                <tr className="text-neutral-500">
                  <td className="py-3 px-3.5 font-mono font-bold text-neutral-800">{currentEmployee.nip}</td>
                  <td className="py-3 px-3.5 font-semibold text-neutral-900">{currentEmployee.name}</td>
                  <td className="py-3 px-3.5 text-neutral-600">{selectedOutlet}</td>
                  <td className="py-3 px-3.5 text-neutral-700">
                    <span className="px-1.5 py-0.5 rounded text-[11px] bg-neutral-100 font-medium border border-neutral-200">
                      {currentEmployee.positionName}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-neutral-600">{formatIndonesianDate(todayStr)} (Hari Ini)</td>
                  <td className="py-3 px-3.5 text-center font-mono text-neutral-400">-</td>
                  <td className="py-3 px-3.5 text-center font-mono text-neutral-400">-</td>
                  <td className="py-3 px-3.5 text-center">
                    <AttendanceStatusBadge status="Belum Absen" />
                  </td>
                </tr>
              )}

              {/* Prior historical records for this employee */}
              {employeeHistory
                .filter(r => r.date !== todayStr)
                .slice(0, 3)
                .map(r => (
                  <tr key={r.id} className="hover:bg-neutral-50/50 text-neutral-600">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-neutral-700">{r.nip || currentEmployee.nip}</td>
                    <td className="py-2.5 px-3.5 text-neutral-800">{r.employeeName}</td>
                    <td className="py-2.5 px-3.5">{r.outlet}</td>
                    <td className="py-2.5 px-3.5 text-neutral-500">{currentEmployee.positionName}</td>
                    <td className="py-2.5 px-3.5">{formatIndonesianDate(r.date)}</td>
                    <td className="py-2.5 px-3.5 text-center font-mono tabular-nums">{r.clockIn || '-'}</td>
                    <td className="py-2.5 px-3.5 text-center font-mono tabular-nums">{r.clockOut || '-'}</td>
                    <td className="py-2.5 px-3.5 text-center">
                      <AttendanceStatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
