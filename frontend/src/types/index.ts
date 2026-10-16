export type Outlet = string;

export interface OutletItem {
  id: string;
  name: string;
}

export interface PositionLevel {
  id: string;
  name: string;
  dailyWage: number;
}

export interface Employee {
  id: string;
  nip: string; // Format: NIP (Nomor Induk Pegawai)
  name: string;
  outlet: string;
  positionId: string;
  positionName: string; // Level / Posisi
  phone?: string;
  joinDate?: string;
}

export type AttendanceStatus = 'Belum Absen' | 'Sedang Bekerja' | 'Sudah Pulang' | 'Perlu Verifikasi';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  nip: string;
  employeeName: string;
  outlet: string;
  date: string; // YYYY-MM-DD
  clockIn: string | null;
  clockOut: string | null;
  status: AttendanceStatus;
  isValid: boolean;
  verifiedByAdmin?: boolean;
  notes?: string;
}

export type PeriodType = 'harian' | 'mingguan' | 'bulanan' | 'custom';

export interface PayrollFilter {
  period: PeriodType;
  startDate: string;
  endDate: string;
  outlet: 'all' | string;
  search: string;
}

export interface SalaryAdjustment {
  thr: number;
  tunjanganLainnya: number;
  bonus: number;
  potongan: number;
  keteranganPotongan: string;
}

export interface EmployeePayrollSummary {
  employeeId: string;
  nip: string;
  employeeName: string;
  outlet: string;
  positionName: string; // Level / Posisi (misal: Crew/1, Leader/1)
  slipNumber: string; // misal: PAY-202610-001
  periodLabel: string;
  issueDate: string;
  validDays: number;
  unverifiedDays: number;
  dailyWage: number; // Rp50.000 atau sesuai posisi
  gajiPokok: number; // validDays * dailyWage
  // Komponen Penghasilan
  thr: number;
  tunjanganLainnya: number;
  bonus: number;
  totalTunjangan: number; // THR + Tunjangan Lainnya + Bonus
  totalPenghasilan: number; // Gaji Pokok + totalTunjangan
  // Komponen Potongan
  potongan: number;
  keteranganPotongan: string;
  totalPotongan: number;
  // Total Gaji Bersih
  totalWage: number; // totalPenghasilan - totalPotongan
  records: AttendanceRecord[];
}

export interface GeneratedPayrollRecord {
  id: string;
  batchCode: string;
  generatedAt: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  outlet: 'all' | string;
  totalEmployees: number;
  totalDays: number;
  grandTotal: number;
  details: {
    nip: string;
    employeeName: string;
    outlet: string;
    positionName: string;
    validDays: number;
    dailyWage: number;
    totalWage: number;
  }[];
}
