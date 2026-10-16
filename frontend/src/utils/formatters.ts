export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace(/\s+/g, '');
}

export function formatIndonesianDate(dateStr: string, withDay: boolean = false): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    };
    
    if (withDay) {
      options.weekday = 'long';
      options.month = 'long';
    }

    return new Intl.DateTimeFormat('id-ID', options).format(date);
  } catch {
    return dateStr;
  }
}

export function getTodayDateString(): string {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const parts = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getPayrollDateRange(period: 'harian' | 'mingguan' | 'bulanan') {
  const today = getTodayDateString();
  const [year, month, day] = today.split('-').map(Number);

  if (period === 'harian') {
    return { startDate: today, endDate: today };
  }

  if (period === 'mingguan') {
    const startDate = new Date(Date.UTC(year, month - 1, day - 6)).toISOString().slice(0, 10);
    return { startDate, endDate: today };
  }

  const monthOffset = day < 16 ? -1 : 0;
  const cycleStart = new Date(Date.UTC(year, month - 1 + monthOffset, 16))
    .toISOString()
    .slice(0, 10);
  const cycleEnd = new Date(Date.UTC(year, month - 1 + monthOffset + 1, 15))
    .toISOString()
    .slice(0, 10);
  return { startDate: cycleStart, endDate: cycleEnd };
}

export function formatWIBTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds} WIB`;
}

export function exportPayrollToCSV(
  periodLabel: string,
  outletLabel: string,
  items: {
    no: number;
    nip: string;
    name: string;
    outlet: string;
    positionName: string;
    validDays: number;
    dailyWage: number;
    gajiPokok: number;
    thr: number;
    tunjanganLainnya: number;
    bonus: number;
    totalTunjangan: number;
    potongan: number;
    totalWage: number;
  }[],
  grandTotal: number
): void {
  const header = [
    'No',
    'NIP',
    'Nama Karyawan',
    'Outlet',
    'Posisi / Level',
    'Hari Hadir',
    'Gaji Harian',
    'Gaji Pokok',
    'THR',
    'Tunjangan Lainnya',
    'Bonus',
    'Total Tunjangan',
    'Potongan',
    'Total Gaji Bersih'
  ];
  const rows = items.map(item => [
    item.no,
    `"${item.nip}"`,
    `"${item.name}"`,
    `"${item.outlet}"`,
    `"${item.positionName}"`,
    `${item.validDays} Hari`,
    item.dailyWage,
    item.gajiPokok,
    item.thr,
    item.tunjanganLainnya,
    item.bonus,
    item.totalTunjangan,
    item.potongan,
    item.totalWage
  ]);

  // Summary footer
  rows.push(['', '', 'TOTAL KESELURUHAN', '', '', '', '', '', '', '', '', '', '', grandTotal]);

  const metaRows = [
    ['LAPORAN REKAP GAJI KARYAWAN - HD FRIED CHICKEN'],
    [`Periode: ${periodLabel}`],
    [`Outlet: ${outletLabel}`],
    [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')} WIB`],
    []
  ];

  const csvContent = '\uFEFF' + [
    ...metaRows.map(r => r.join(',')),
    header.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Gaji_HD_${periodLabel.replace(/[\s\(\)\/:]+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
