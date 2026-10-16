import { Employee, AttendanceRecord, GeneratedPayrollRecord, OutletItem, PositionLevel } from '../types';

export const INITIAL_POSITIONS: PositionLevel[] = [
  { id: 'pos-spv', name: 'Supervisor/1', dailyWage: 75000 },
  { id: 'pos-leader', name: 'Leader/1', dailyWage: 65000 },
  { id: 'pos-cook-1', name: 'Cook/1', dailyWage: 60000 },
  { id: 'pos-kasir-1', name: 'Kasir/1', dailyWage: 55000 },
  { id: 'pos-crew-2', name: 'Crew/2', dailyWage: 52000 },
  { id: 'pos-crew-1', name: 'Crew/1', dailyWage: 50000 },
];

export const INITIAL_OUTLETS: OutletItem[] = [
  { id: 'Cisalak', name: 'Cisalak' },
  { id: 'BRP', name: 'BRP' },
  { id: 'Margonda', name: 'Margonda' },
];

export const OUTLETS = INITIAL_OUTLETS;

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'EMP-001', nip: 'HD-001', name: 'Andi Saputra', outlet: 'Cisalak', positionId: 'pos-crew-1', positionName: 'Crew/1', phone: '0812-3456-7890', joinDate: '2024-01-15' },
  { id: 'EMP-002', nip: 'HD-002', name: 'Budi Santoso', outlet: 'BRP', positionId: 'pos-leader', positionName: 'Leader/1', phone: '0813-9876-5432', joinDate: '2024-02-01' },
  { id: 'EMP-003', nip: 'HD-003', name: 'Siti Rahmawati', outlet: 'Cisalak', positionId: 'pos-kasir-1', positionName: 'Kasir/1', phone: '0812-7788-9900', joinDate: '2024-03-10' },
  { id: 'EMP-004', nip: 'HD-004', name: 'Rina Wulandari', outlet: 'BRP', positionId: 'pos-crew-2', positionName: 'Crew/2', phone: '0856-1122-3344', joinDate: '2024-04-05' },
  { id: 'EMP-005', nip: 'HD-005', name: 'Eko Prasetyo', outlet: 'Cisalak', positionId: 'pos-cook-1', positionName: 'Cook/1', phone: '0878-4455-6677', joinDate: '2024-05-20' },
  { id: 'EMP-006', nip: 'HD-006', name: 'Dewi Lestari', outlet: 'BRP', positionId: 'pos-spv', positionName: 'Supervisor/1', phone: '0819-3344-5566', joinDate: '2024-06-01' },
  { id: 'EMP-007', nip: 'HD-007', name: 'Fajar Hidayat', outlet: 'Cisalak', positionId: 'pos-crew-1', positionName: 'Crew/1', phone: '0857-8899-0011', joinDate: '2024-07-12' },
  { id: 'EMP-008', nip: 'HD-008', name: 'Maya Anggraini', outlet: 'BRP', positionId: 'pos-crew-2', positionName: 'Crew/2', phone: '0821-6677-8899', joinDate: '2024-08-01' },
  { id: 'EMP-009', nip: 'HD-009', name: 'Hendra Kusuma', outlet: 'Cisalak', positionId: 'pos-crew-1', positionName: 'Crew/1', phone: '0813-4422-1100', joinDate: '2024-08-15' },
  { id: 'EMP-010', nip: 'HD-010', name: 'Tri Wahyuni', outlet: 'BRP', positionId: 'pos-crew-1', positionName: 'Crew/1', phone: '0858-9900-1122', joinDate: '2024-09-01' },
];

export const DAILY_WAGE = 50000; // default fallback

function generateAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const todayStr = '2026-10-15';

  const employeeProfiles: Record<string, { baseDays: number; offDaysModulo: number; hasUnverified: boolean }> = {
    'EMP-001': { baseDays: 26, offDaysModulo: 7, hasUnverified: false },
    'EMP-002': { baseDays: 24, offDaysModulo: 6, hasUnverified: true },
    'EMP-003': { baseDays: 22, offDaysModulo: 5, hasUnverified: false },
    'EMP-004': { baseDays: 25, offDaysModulo: 7, hasUnverified: true },
    'EMP-005': { baseDays: 20, offDaysModulo: 4, hasUnverified: true },
    'EMP-006': { baseDays: 23, offDaysModulo: 6, hasUnverified: false },
    'EMP-007': { baseDays: 21, offDaysModulo: 5, hasUnverified: false },
    'EMP-008': { baseDays: 19, offDaysModulo: 4, hasUnverified: true },
    'EMP-009': { baseDays: 24, offDaysModulo: 6, hasUnverified: false },
    'EMP-010': { baseDays: 22, offDaysModulo: 5, hasUnverified: false },
  };

  const baseDate = new Date('2026-10-15T00:00:00Z');

  INITIAL_EMPLOYEES.forEach((emp) => {
    const profile = employeeProfiles[emp.id] || { baseDays: 22, offDaysModulo: 5, hasUnverified: false };

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const d = new Date(baseDate.getTime() - dayOffset * 86400000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayOfWeek = d.getUTCDay();

      if (dayOfWeek === 0) continue;

      if ((dayOffset + parseInt(emp.id.replace('EMP-', ''), 10)) % profile.offDaysModulo === 0 && dayOffset > 0) {
        continue;
      }

      if (dateStr === todayStr) {
        if (emp.id === 'EMP-001' || emp.id === 'EMP-003') {
          records.push({
            id: `ATT-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            nip: emp.nip,
            employeeName: emp.name,
            outlet: emp.outlet,
            date: dateStr,
            clockIn: '08:02',
            clockOut: null,
            status: 'Sedang Bekerja',
            isValid: false,
            verifiedByAdmin: false,
            notes: 'Aktif bekerja'
          });
        } else if (emp.id === 'EMP-002') {
          records.push({
            id: `ATT-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            nip: emp.nip,
            employeeName: emp.name,
            outlet: emp.outlet,
            date: dateStr,
            clockIn: '06:00',
            clockOut: '14:00',
            status: 'Sudah Pulang',
            isValid: true,
            verifiedByAdmin: false
          });
        }
        continue;
      }

      if (profile.hasUnverified && dayOffset === 5) {
        records.push({
          id: `ATT-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          nip: emp.nip,
          employeeName: emp.name,
          outlet: emp.outlet,
          date: dateStr,
          clockIn: '07:58',
          clockOut: null,
          status: 'Perlu Verifikasi',
          isValid: false,
          verifiedByAdmin: false,
          notes: 'Tidak ada data jam pulang (perlu verifikasi admin)'
        });
        continue;
      }

      const inMinute = 45 + ((dayOffset * 3 + parseInt(emp.id.replace('EMP-', ''))) % 25);
      const inHour = inMinute >= 60 ? '08' : '07';
      const inMinStr = String(inMinute % 60).padStart(2, '0');
      
      const outMin = 10 + ((dayOffset * 4) % 30);
      const outHour = 17;
      const outMinStr = String(outMin).padStart(2, '0');

      records.push({
        id: `ATT-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        nip: emp.nip,
        employeeName: emp.name,
        outlet: emp.outlet,
        date: dateStr,
        clockIn: `${inHour}:${inMinStr}`,
        clockOut: `${outHour}:${outMinStr}`,
        status: 'Sudah Pulang',
        isValid: true,
        verifiedByAdmin: false
      });
    }
  });

  return records;
}

export const INITIAL_ATTENDANCE: AttendanceRecord[] = generateAttendanceRecords();

export const INITIAL_GENERATED_PAYROLLS: GeneratedPayrollRecord[] = [
  {
    id: 'BATCH-202609',
    batchCode: 'PAY-202609-ALL',
    generatedAt: '2026-10-01 10:00 WIB',
    periodLabel: 'Bulanan (01 Sep 2026 - 30 Sep 2026)',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    outlet: 'all',
    totalEmployees: 10,
    totalDays: 236,
    grandTotal: 14210000,
    details: [
      { nip: 'HD-001', employeeName: 'Andi Saputra', outlet: 'Cisalak', positionName: 'Crew/1', validDays: 26, dailyWage: 50000, totalWage: 26 * 50000 },
      { nip: 'HD-002', employeeName: 'Budi Santoso', outlet: 'BRP', positionName: 'Leader/1', validDays: 24, dailyWage: 65000, totalWage: 24 * 65000 },
      { nip: 'HD-003', employeeName: 'Siti Rahmawati', outlet: 'Cisalak', positionName: 'Kasir/1', validDays: 25, dailyWage: 55000, totalWage: 25 * 55000 },
      { nip: 'HD-004', employeeName: 'Rina Wulandari', outlet: 'BRP', positionName: 'Crew/2', validDays: 24, dailyWage: 52000, totalWage: 24 * 52000 },
      { nip: 'HD-005', employeeName: 'Eko Prasetyo', outlet: 'Cisalak', positionName: 'Cook/1', validDays: 22, dailyWage: 60000, totalWage: 22 * 60000 },
      { nip: 'HD-006', employeeName: 'Dewi Lestari', outlet: 'BRP', positionName: 'Supervisor/1', validDays: 25, dailyWage: 75000, totalWage: 25 * 75000 },
      { nip: 'HD-007', employeeName: 'Fajar Hidayat', outlet: 'Cisalak', positionName: 'Crew/1', validDays: 23, dailyWage: 50000, totalWage: 23 * 50000 },
      { nip: 'HD-008', employeeName: 'Maya Anggraini', outlet: 'BRP', positionName: 'Crew/2', validDays: 22, dailyWage: 52000, totalWage: 22 * 52000 },
      { nip: 'HD-009', employeeName: 'Hendra Kusuma', outlet: 'Cisalak', positionName: 'Crew/1', validDays: 24, dailyWage: 50000, totalWage: 24 * 50000 },
      { nip: 'HD-010', employeeName: 'Tri Wahyuni', outlet: 'BRP', positionName: 'Crew/1', validDays: 21, dailyWage: 50000, totalWage: 21 * 50000 },
    ]
  }
];
