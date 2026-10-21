/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus, GeneratedPayrollRecord, Outlet, OutletItem, PositionLevel } from './types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCE, 
  INITIAL_OUTLETS,
  INITIAL_POSITIONS
} from './data/mockData';
import { getTodayDateString } from './utils/formatters';
import { TopNavigation } from './components/TopNavigation';
import { AttendancePage } from './components/AttendancePage';
import { PinAccess } from './components/PinAccess';
import { PayrollPage } from './components/PayrollPage';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const normalizeEmployee = (row: any, positions: PositionLevel[] = []): Employee => ({
  id: String(row.id ?? row.employee_id ?? row.employeeCode ?? row.employee_code ?? ''),
  nip: String(row.employee_code ?? row.nip ?? `HD-${String(row.id ?? 0).padStart(3, '0')}`),
  name: String(row.name ?? 'Unknown Employee'),
  positionId: String(row.position_id ?? row.positionId ?? positions.find(position => position.name === (row.position_name ?? row.position))?.id ?? row.position ?? 'pos-crew-1'),
  positionName: String(row.position_name ?? row.positionName ?? row.position ?? 'Crew/1'),
  status: String(row.status ?? 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
  phone: row.phone ?? undefined,
  joinDate: row.join_date ?? row.joinDate ?? new Date().toISOString().slice(0, 10),
});

const normalizeOutlet = (row: any): OutletItem => ({
  id: String(row.id ?? row.outlet_id ?? row.outlet_code ?? row.name ?? ''),
  name: String(row.name ?? row.outlet_name ?? 'Outlet'),
});

const normalizePosition = (row: any): PositionLevel => ({
  id: String(row.id ?? row.position_id ?? row.position_code ?? row.name ?? ''),
  name: String(row.name ?? 'Position'),
  dailyWage: Number(row.daily_wage ?? row.dailyWage ?? 50000),
});

const normalizeAttendanceDate = (value: unknown): string => {
  if (!value) return getTodayDateString();
  const dateString = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString.slice(0, 10);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}`;
};

const normalizeAttendance = (row: any, employees: Employee[] = []): AttendanceRecord => {
  const employeeId = String(row.employee_id ?? row.employeeId ?? '0');
  const employee = employees.find(item => item.id === employeeId);
  const outletName = row.outlet_name ?? row.outlet;
  const clockInValue = row.check_in ?? row.clockIn ?? null;
  const clockOutValue = row.check_out ?? row.clockOut ?? null;
  const clockIn = clockInValue ? String(clockInValue).slice(0, 5) : null;
  const clockOut = clockOutValue ? String(clockOutValue).slice(0, 5) : null;
  const rawStatus = String(row.status ?? '').trim().toLowerCase();
  const verifiedByAdmin = Boolean(row.verifiedByAdmin ?? row.verified_by_admin);

  let status: AttendanceStatus;
  if (clockOut || verifiedByAdmin) {
    status = 'Sudah Pulang';
  } else if (rawStatus === 'late' || rawStatus === 'perlu verifikasi') {
    status = 'Perlu Verifikasi';
  } else if (clockIn) {
    status = 'Sedang Bekerja';
  } else {
    status = 'Belum Absen';
  }

  return {
    id: String(row.id ?? `ATT-${employeeId}-${row.attendance_date ?? Date.now()}`),
    employeeId,
    outletId: row.outlet_id == null ? undefined : String(row.outlet_id),
    nip: String(row.nip ?? row.employee_code ?? employee?.nip ?? `HD-${employeeId.padStart(3, '0')}`),
    employeeName: String(row.employeeName ?? row.employee_name ?? row.name ?? employee?.name ?? 'Karyawan'),
    outlet: outletName && !/^\d+$/.test(String(outletName)) ? String(outletName) : 'Outlet tidak ditemukan',
    date: normalizeAttendanceDate(row.attendance_date ?? row.date),
    clockIn,
    clockOut,
    status,
    isValid: Boolean(clockOut || verifiedByAdmin),
    verifiedByAdmin,
    notes: row.notes ?? undefined,
  };
};

export default function App() {
  // Navigation State: 'absensi' (default) or 'payroll'
  const [activeTab, setActiveTab] = useState<'absensi' | 'payroll'>('absensi');

  // Admin PIN Protection State for 'payroll' page (Default mock PIN: 1234)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');

  // Application Data State (Dynamic master data)
  const [outlets, setOutlets] = useState<OutletItem[]>(INITIAL_OUTLETS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [positions, setPositions] = useState<PositionLevel[]>(INITIAL_POSITIONS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [generatedBatches, setGeneratedBatches] = useState<GeneratedPayrollRecord[]>([]);
  const [isLoadingBackendData, setIsLoadingBackendData] = useState(true);
  const [backendLoadError, setBackendLoadError] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        const [employeeRes, attendanceRes, outletRes, positionRes] = await Promise.all([
          fetch(`${API_BASE}/api/employees`),
          fetch(`${API_BASE}/api/attendance`),
          fetch(`${API_BASE}/api/outlets`),
          fetch(`${API_BASE}/api/positions`),
        ]);

        let loadedPositions = positions;
        if (positionRes.ok) {
          const positionRows = await positionRes.json();
          if (Array.isArray(positionRows) && positionRows.length > 0) {
            loadedPositions = positionRows.map(normalizePosition);
            setPositions(loadedPositions);
          }
        }

        let loadedEmployees = employees;
        if (employeeRes.ok) {
          const employeeRows = await employeeRes.json();
          if (Array.isArray(employeeRows)) {
            loadedEmployees = employeeRows.map((row: any) => normalizeEmployee(row, loadedPositions));
            setEmployees(loadedEmployees);
          }
        } else {
          throw new Error('Data karyawan tidak dapat dimuat dari server.');
        }

        if (attendanceRes.ok) {
          const attendanceRows = await attendanceRes.json();
          if (Array.isArray(attendanceRows)) {
            setAttendanceRecords(attendanceRows.map((row: any) => normalizeAttendance(row, loadedEmployees)));
          }
        } else {
          throw new Error('Data absensi tidak dapat dimuat dari server.');
        }

        if (outletRes.ok) {
          const outletRows = await outletRes.json();
          if (Array.isArray(outletRows) && outletRows.length > 0) {
            setOutlets(outletRows.map(normalizeOutlet));
          }
        }

        setBackendLoadError(null);
      } catch (error) {
        setBackendLoadError(error instanceof Error
          ? `${error.message} Tampilan memakai data lokal sementara; perubahan belum tersimpan.`
          : 'Server tidak dapat dihubungi. Tampilan memakai data lokal sementara; perubahan belum tersimpan.');
      } finally {
        setIsLoadingBackendData(false);
      }
    };

    loadFromBackend();
  }, []);

  useEffect(() => {
    if (!isAdminUnlocked || !adminPin) return;
    let active = true;
    const loadPayrollBatches = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/payroll-batches`, {
          headers: { 'x-admin-pin': adminPin },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.detail || data?.error || 'Riwayat rekap gaji tidak dapat dimuat.');
        if (active && Array.isArray(data)) setGeneratedBatches(data);
      } catch {
        // Keep local mock history available when running the frontend without a backend.
      }
    };
    loadPayrollBatches();
    return () => { active = false; };
  }, [isAdminUnlocked, adminPin]);

  const handleSaveEmployeeToBackend = async (nextEmployees: Employee[]) => {
    const previous = employees;
    const previousMap = new Map(previous.map((item) => [item.id, item]));
    const nextMap = new Map(nextEmployees.map((item) => [item.id, item]));

    const removed = previous.filter((item) => !nextMap.has(item.id));
    const added = nextEmployees.filter((item) => !previousMap.has(item.id));
    const updated = nextEmployees.filter((item) => {
      const oldItem = previousMap.get(item.id);
      return Boolean(oldItem) && JSON.stringify(oldItem) !== JSON.stringify(item);
    });

    const request = async (url: string, method: string, payload?: unknown) => {
      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          ...(payload ? { body: JSON.stringify(payload) } : {}),
        });
      } catch {
        throw new Error('Server tidak dapat dihubungi. Perubahan karyawan belum disimpan.');
      }
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || error.error || 'Perubahan karyawan gagal disimpan.');
      }
      return response.status === 204 ? null : response.json().catch(() => null);
    };

    try {
      for (const employee of removed) {
        await request(`${API_BASE}/api/employees/${encodeURIComponent(employee.id)}`, 'DELETE');
      }
      for (const employee of added) {
        await request(`${API_BASE}/api/employees`, 'POST', {
          employee_code: employee.nip,
          name: employee.name,
          position_id: employee.positionId,
          status: employee.status,
          join_date: employee.joinDate ?? getTodayDateString(),
          phone: employee.phone ?? '',
          email: `${employee.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        });
      }
      for (const employee of updated) {
        await request(`${API_BASE}/api/employees/${encodeURIComponent(employee.id)}`, 'PUT', {
          employee_code: employee.nip,
          name: employee.name,
          position_id: employee.positionId,
          status: employee.status,
        });
      }
      const refreshed = await request(`${API_BASE}/api/employees`, 'GET');
      if (!Array.isArray(refreshed)) throw new Error('Server mengembalikan data karyawan yang tidak valid.');
      setEmployees(refreshed.map((row: any) => normalizeEmployee(row, positions)));
    } catch (error) {
      try {
        const refreshed = await fetch(`${API_BASE}/api/employees`);
        if (refreshed.ok) setEmployees((await refreshed.json()).map((row: any) => normalizeEmployee(row, positions)));
      } catch {
        // Keep current UI state when the backend is unreachable.
      }
      throw error;
    }
  };

  // Handle Absen Datang (Clock In)
  const handleClockIn = async (employeeId: string, outlet: Outlet, timeStr: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) throw new Error('Karyawan tidak ditemukan.');
    const existingRecord = attendanceRecords.find(r => r.employeeId === employeeId && r.date === todayStr);

    const localRecord: AttendanceRecord = {
      id: existingRecord?.id || `ATT-${employeeId}-${todayStr}`,
      employeeId,
      nip: emp.nip,
      employeeName: emp.name,
      outlet,
      date: todayStr,
      clockIn: timeStr,
      clockOut: null,
      status: 'Sedang Bekerja',
      isValid: false,
      verifiedByAdmin: false,
      notes: `Absen datang pukul ${timeStr} WIB`
    };

    setAttendanceRecords(prev => {
      const existingIndex = prev.findIndex(r => r.employeeId === employeeId && r.date === todayStr);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = localRecord;
        return updated;
      }
      return [localRecord, ...prev];
    });

    try {
      const isPersisted = /^\d+$/.test(localRecord.id);
      const response = await fetch(isPersisted
        ? `${API_BASE}/api/attendance/${encodeURIComponent(localRecord.id)}`
        : `${API_BASE}/api/attendance`, {
        method: isPersisted ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: Number(employeeId.replace(/\D/g, '')) || 1,
          attendance_date: todayStr,
          outlet_name: outlet,
          check_in: timeStr,
          check_out: null,
          work_hours: 0,
          overtime_hours: 0,
          status: 'present',
          notes: `Absen datang pukul ${timeStr} WIB`,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || error.error || 'Absen datang gagal disimpan.');
      }
      if (!isPersisted) {
        const result = await response.json();
        if (result.id) {
          setAttendanceRecords(prev => prev.map(record => record.id === localRecord.id
            ? { ...record, id: String(result.id) }
            : record));
        }
      }
    } catch (error) {
      const previousRecords = attendanceRecords.filter(record => record.employeeId === employeeId && record.date === todayStr);
      setAttendanceRecords(prev => [
        ...prev.filter(record => record.employeeId !== employeeId || record.date !== todayStr),
        ...previousRecords,
      ]);
      throw error instanceof Error ? error : new Error('Absen datang gagal disimpan.');
    }
  };

  // Handle Absen Pulang (Clock Out)
  const handleClockOut = async (employeeId: string, outlet: Outlet, timeStr: string) => {
    const existingRecord = attendanceRecords.find(r => r.employeeId === employeeId && r.date === todayStr);
    const localRecordId = existingRecord?.id || `ATT-${employeeId}-${todayStr}`;
    setAttendanceRecords(prev => {
      const existingIndex = prev.findIndex(r => r.employeeId === employeeId && r.date === todayStr);

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          clockOut: timeStr,
          status: 'Sudah Pulang',
          isValid: true,
          notes: `Hadir lengkap (${existing.clockIn} - ${timeStr})`
        };
        return updated;
      }

      const emp = employees.find(e => e.id === employeeId);
      const fallbackRecord: AttendanceRecord = {
        id: localRecordId,
        employeeId,
        nip: emp ? emp.nip : '',
        employeeName: emp ? emp.name : employeeId,
        outlet,
        date: todayStr,
        clockIn: '08:00',
        clockOut: timeStr,
        status: 'Sudah Pulang',
        isValid: true,
        verifiedByAdmin: false,
      };
      return [fallbackRecord, ...prev];
    });

    try {
      const isPersisted = /^\d+$/.test(localRecordId);
      const response = await fetch(isPersisted
        ? `${API_BASE}/api/attendance/${encodeURIComponent(localRecordId)}`
        : `${API_BASE}/api/attendance`, {
        method: isPersisted ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: Number(employeeId.replace(/\D/g, '')) || 1,
          attendance_date: todayStr,
          outlet_name: outlet,
          check_in: existingRecord?.clockIn || '08:00',
          check_out: timeStr,
          work_hours: 8,
          overtime_hours: 0,
          status: 'present',
          notes: `Hadir lengkap (${timeStr})`,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || error.error || 'Absen pulang gagal disimpan.');
      }
      if (!isPersisted) {
        const result = await response.json();
        if (result.id) {
          setAttendanceRecords(prev => prev.map(record => record.id === localRecordId
            ? { ...record, id: String(result.id) }
            : record));
        }
      }
    } catch (error) {
      const previousRecords = attendanceRecords.filter(record => record.employeeId === employeeId && record.date === todayStr);
      setAttendanceRecords(prev => [
        ...prev.filter(record => record.employeeId !== employeeId || record.date !== todayStr),
        ...previousRecords,
      ]);
      throw error instanceof Error ? error : new Error('Absen pulang gagal disimpan.');
    }
  };

  // Handle Admin Manual Verification of incomplete records
  const handleVerifyRecord = (recordId: string) => {
    setAttendanceRecords(prev =>
      prev.map(rec => {
        if (rec.id === recordId) {
          return {
            ...rec,
            status: 'Sudah Pulang',
            clockOut: rec.clockOut || '17:00',
            isValid: true,
            verifiedByAdmin: true,
            notes: 'Diverifikasi manual oleh Admin'
          };
        }
        return rec;
      })
    );
  };

  const handleDeleteAttendanceRecord = async (recordId: string) => {
    if (/^\d+$/.test(recordId)) {
      let response: Response;
      try {
        response = await fetch(`${API_BASE}/api/attendance/${encodeURIComponent(recordId)}`, {
          method: 'DELETE',
        });
      } catch {
        throw new Error('Backend tidak dapat dihubungi. Jalankan backend dan pastikan database MySQL aktif.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        if (response.status === 404 && !error) {
          throw new Error('Endpoint hapus belum tersedia di backend. Restart backend setelah perubahan kode.');
        }
        if (response.status === 404) {
          throw new Error('Data kehadiran tidak ditemukan di database. Muat ulang halaman lalu coba lagi.');
        }
        throw new Error(error?.detail || error?.error || `Gagal menghapus data kehadiran (HTTP ${response.status}).`);
      }
    }

    setAttendanceRecords(prev => prev.filter(record => record.id !== recordId));
  };

  // Add new generated payroll batch
  const handleAddGeneratedBatch = async (batch: GeneratedPayrollRecord) => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/api/payroll-batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(batch),
      });
    } catch {
      throw new Error('Server tidak dapat dihubungi. Rekap gaji belum tersimpan.');
    }
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.detail || result?.error || 'Rekap gaji gagal disimpan.');
    setGeneratedBatches(prev => [result as GeneratedPayrollRecord, ...prev]);
  };

  const handleDeleteGeneratedBatch = async (batchId: string) => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/api/payroll-batches/${encodeURIComponent(batchId)}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin },
      });
    } catch {
      throw new Error('Server tidak dapat dihubungi. Rekap gaji belum dihapus.');
    }
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.detail || result?.error || 'Rekap gaji gagal dihapus.');
    setGeneratedBatches(prev => prev.filter(batch => batch.id !== batchId));
  };

  const handleUpdateOutlets = async (nextOutlets: OutletItem[]) => {
    const previous = outlets;
    const previousMap = new Map(previous.map((item) => [item.id, item]));
    const nextMap = new Map(nextOutlets.map((item) => [item.id, item]));

    const removed = previous.filter((item) => !nextMap.has(item.id));
    const added = nextOutlets.filter((item) => !previousMap.has(item.id));
    const updated = nextOutlets.filter((item) => {
      const oldItem = previousMap.get(item.id);
      return Boolean(oldItem) && JSON.stringify(oldItem) !== JSON.stringify(item);
    });

    const save = async (url: string, method: string, name?: string) => {
      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          ...(name ? { body: JSON.stringify({ name }) } : {}),
        });
      } catch {
        throw new Error('Server tidak dapat dihubungi. Perubahan outlet belum disimpan.');
      }
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || error.error || 'Perubahan outlet gagal disimpan.');
      }
    };

    for (const outlet of removed) {
      await save(`${API_BASE}/api/outlets/${encodeURIComponent(outlet.id)}`, 'DELETE');
    }
    for (const outlet of added) {
      await save(`${API_BASE}/api/outlets`, 'POST', outlet.name);
    }
    for (const outlet of updated) {
      await save(`${API_BASE}/api/outlets/${encodeURIComponent(outlet.id)}`, 'PUT', outlet.name);
    }
    const response = await fetch(`${API_BASE}/api/outlets`);
    if (!response.ok) throw new Error('Data outlet gagal dimuat ulang setelah perubahan.');
    const rows = await response.json();
    setOutlets(Array.isArray(rows) ? rows.map(normalizeOutlet) : nextOutlets);
  };

  const handleUpdatePositions = async (nextPositions: PositionLevel[]) => {
    const previous = positions;
    const previousMap = new Map(previous.map((item) => [item.id, item]));
    const nextMap = new Map(nextPositions.map((item) => [item.id, item]));

    const removed = previous.filter((item) => !nextMap.has(item.id));
    const added = nextPositions.filter((item) => !previousMap.has(item.id));
    const updated = nextPositions.filter((item) => {
      const oldItem = previousMap.get(item.id);
      return Boolean(oldItem) && JSON.stringify(oldItem) !== JSON.stringify(item);
    });

    const save = async (url: string, method: string, position?: PositionLevel) => {
      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          ...(position ? { body: JSON.stringify({ name: position.name, dailyWage: position.dailyWage }) } : {}),
        });
      } catch {
        throw new Error('Server tidak dapat dihubungi. Perubahan posisi belum disimpan.');
      }
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || error.error || 'Perubahan posisi gagal disimpan.');
      }
    };
    for (const position of removed) {
      await save(`${API_BASE}/api/positions/${encodeURIComponent(position.id)}`, 'DELETE');
    }
    for (const position of added) {
      await save(`${API_BASE}/api/positions`, 'POST', position);
    }
    for (const position of updated) {
      await save(`${API_BASE}/api/positions/${encodeURIComponent(position.id)}`, 'PUT', position);
    }
    const [positionResponse, employeeResponse] = await Promise.all([
      fetch(`${API_BASE}/api/positions`),
      fetch(`${API_BASE}/api/employees`),
    ]);
    if (!positionResponse.ok || !employeeResponse.ok) {
      throw new Error('Data posisi atau karyawan gagal dimuat ulang.');
    }
    const [positionRows, employeeRows] = await Promise.all([positionResponse.json(), employeeResponse.json()]);
    setPositions(Array.isArray(positionRows) ? positionRows.map(normalizePosition) : nextPositions);
    if (Array.isArray(employeeRows)) {
      setEmployees(employeeRows.map((row: any) => normalizeEmployee(row, positionRows.map(normalizePosition))));
    }
  };

  const handleUpdatePin = async (newPin: string) => {
    setAdminPin(newPin);

    try {
      await fetch(`${API_BASE}/api/admin-pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin_code: newPin }),
      });
    } catch {
      // silent fail
    }
  };

  const handleUpdateEmployees = (nextEmployees: Employee[]) => {
    return handleSaveEmployeeToBackend(nextEmployees);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-[#171717]">
      {/* Top Navigation Bar with exact two main menus */}
      <TopNavigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isAdminUnlocked={isAdminUnlocked}
        onLockAdmin={() => setIsAdminUnlocked(false)}
      />

      {(isLoadingBackendData || backendLoadError) && (
        <div className={`px-4 py-2 text-center text-xs ${backendLoadError ? 'bg-amber-50 text-amber-800 border-b border-amber-200' : 'bg-neutral-100 text-neutral-600'}`}>
          {isLoadingBackendData ? 'Memuat data karyawan dan absensi…' : backendLoadError}
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1">
        {activeTab === 'absensi' ? (
          <AttendancePage
            employees={employees}
            outlets={outlets}
            attendanceRecords={attendanceRecords}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
          />
        ) : (
          !isAdminUnlocked ? (
            <PinAccess 
              onUnlock={(pin) => { setAdminPin(pin); setIsAdminUnlocked(true); }}
            />
          ) : (
            <PayrollPage
              employees={employees}
              outlets={outlets}
              positions={positions}
              attendanceRecords={attendanceRecords}
              generatedBatches={generatedBatches}
              adminPin={adminPin}
              onLock={() => { setIsAdminUnlocked(false); setAdminPin(''); }}
              onVerifyRecord={handleVerifyRecord}
              onDeleteAttendanceRecord={handleDeleteAttendanceRecord}
              onAddGeneratedBatch={handleAddGeneratedBatch}
              onDeleteGeneratedBatch={handleDeleteGeneratedBatch}
              onUpdateOutlets={handleUpdateOutlets}
              onUpdateEmployees={handleUpdateEmployees}
              onUpdatePositions={handleUpdatePositions}
              onUpdatePin={handleUpdatePin}
            />
          )
        )}
      </div>

      {/* Quiet Minimal Footer */}
      <footer className="border-t border-neutral-200 bg-white py-4 px-4 text-center text-xs text-neutral-500 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#D31027]">HD Fried Chicken</span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span className="text-neutral-600">Absensi & Payroll Multi-Outlet</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Kalkulasi gaji per level posisi · Sistem Master Data Terintegrasi
          </div>
        </div>
      </footer>
    </div>
  );
}
