// OpenAPI 3.0 specification for the HD Attendance & Payroll backend.
// Served as JSON at /openapi.json and rendered by Swagger UI at /docs.

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ 'application/json': { schema } });
const body = (schema, required = true) => ({ required, content: json(schema) });
const ok = (description, schema) => ({ description, content: json(schema) });
const err = (description) => ({ description, content: json(ref('Error')) });

const idParam = (description = 'ID internal (angka).') => ({
  name: 'id', in: 'path', required: true, description, schema: { type: 'integer', minimum: 1 },
});

const std = {
  401: { $ref: '#/components/responses/Unauthorized' },
  500: { $ref: '#/components/responses/ServerError' },
};
const adminSecurity = [{ ApiKeyAuth: [], AdminPin: [] }];

export function buildOpenApiSpec({ port } = {}) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'HD Attendance & Payroll API',
      version: '1.0.0',
      description: [
        'REST API untuk data karyawan, absensi, outlet, posisi/level gaji, dan rekap gaji.',
        '',
        '**Autentikasi:** setiap endpoint di bawah `/api` (kecuali `/api/health`) wajib mengirim header `X-API-Key`.',
        'Klik tombol **Authorize** di kanan atas untuk mengisinya.',
        '',
        'Endpoint rekap gaji (`/api/payroll-batches`) juga memerlukan header `X-Admin-Pin`.',
      ].join('\n'),
    },
    servers: [
      { url: '/', description: 'Server ini' },
      ...(port ? [{ url: `http://localhost:${port}`, description: 'Lokal' }] : []),
    ],
    security: [{ ApiKeyAuth: [] }],
    tags: [
      { name: 'System', description: 'Status layanan' },
      { name: 'Employees', description: 'Master data karyawan' },
      { name: 'Attendance', description: 'Catatan absensi harian' },
      { name: 'Outlets', description: 'Master data outlet' },
      { name: 'Positions', description: 'Posisi / level dan upah harian' },
      { name: 'Payroll', description: 'Data gaji per karyawan' },
      { name: 'Payroll Batches', description: 'Riwayat rekap gaji (butuh PIN admin)' },
      { name: 'Admin PIN', description: 'Pengelolaan PIN admin' },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['System'], summary: 'Cek status server & koneksi database',
          security: [],
          responses: {
            200: ok('Server dan database sehat', ref('Health')),
            500: ok('Database tidak terhubung', ref('Health')),
          },
        },
      },

      '/api/employees': {
        get: {
          tags: ['Employees'], summary: 'Daftar semua karyawan',
          responses: { 200: ok('Daftar karyawan', { type: 'array', items: ref('Employee') }), ...std },
        },
        post: {
          tags: ['Employees'], summary: 'Tambah karyawan',
          requestBody: body(ref('EmployeeCreate')),
          responses: {
            201: ok('Karyawan dibuat', ref('Employee')),
            400: err('Data tidak valid atau posisi tidak ditemukan'),
            409: err('NIP sudah digunakan'),
            ...std,
          },
        },
      },
      '/api/employees/{id}': {
        put: {
          tags: ['Employees'], summary: 'Ubah karyawan',
          parameters: [idParam()],
          requestBody: body(ref('EmployeeUpdate')),
          responses: {
            200: ok('Karyawan diperbarui', ref('Employee')),
            400: err('Data tidak valid'),
            404: err('Karyawan tidak ditemukan'),
            409: err('NIP sudah digunakan'),
            ...std,
          },
        },
        delete: {
          tags: ['Employees'], summary: 'Hapus karyawan',
          description: 'Ditolak (409) jika karyawan sudah punya riwayat absensi/gaji — ubah status ke `inactive` sebagai gantinya.',
          parameters: [{
            name: 'id', in: 'path', required: true,
            description: 'ID internal (angka) atau NIP (`employee_code`).',
            schema: { type: 'string' },
          }],
          responses: {
            200: ok('Karyawan dihapus', ref('DeleteResult')),
            404: err('Karyawan tidak ditemukan'),
            409: err('Karyawan memiliki riwayat absensi atau gaji'),
            ...std,
          },
        },
      },

      '/api/attendance': {
        get: {
          tags: ['Attendance'], summary: 'Daftar semua absensi (terbaru dulu)',
          responses: { 200: ok('Daftar absensi', { type: 'array', items: ref('Attendance') }), ...std },
        },
        post: {
          tags: ['Attendance'], summary: 'Catat absensi',
          description: 'Satu karyawan hanya boleh punya satu absensi per tanggal.',
          requestBody: body(ref('AttendanceCreate')),
          responses: {
            201: ok('Absensi dicatat', ref('CreateResult')),
            400: err('Field wajib kosong atau outlet tidak ditemukan'),
            404: err('Karyawan tidak ditemukan'),
            409: err('Absensi untuk tanggal ini sudah tercatat'),
            ...std,
          },
        },
      },
      '/api/attendance/{id}': {
        put: {
          tags: ['Attendance'], summary: 'Ubah absensi',
          parameters: [idParam()],
          requestBody: body(ref('AttendanceUpdate')),
          responses: {
            200: ok('Absensi diperbarui', ref('UpdateResult')),
            400: err('ID tidak valid'),
            404: err('Absensi tidak ditemukan'),
            ...std,
          },
        },
        delete: {
          tags: ['Attendance'], summary: 'Hapus absensi',
          parameters: [idParam()],
          responses: {
            200: ok('Absensi dihapus', ref('DeleteResult')),
            400: err('ID tidak valid'),
            404: err('Absensi tidak ditemukan'),
            ...std,
          },
        },
      },

      '/api/outlets': {
        get: {
          tags: ['Outlets'], summary: 'Daftar outlet',
          responses: { 200: ok('Daftar outlet', { type: 'array', items: ref('Outlet') }), ...std },
        },
        post: {
          tags: ['Outlets'], summary: 'Tambah outlet',
          requestBody: body(ref('OutletInput')),
          responses: {
            201: ok('Outlet dibuat', {
              type: 'object',
              properties: { success: { type: 'boolean' }, id: { type: 'integer' }, name: { type: 'string' } },
            }),
            400: err('Nama outlet wajib diisi'),
            ...std,
          },
        },
      },
      '/api/outlets/{id}': {
        put: {
          tags: ['Outlets'], summary: 'Ubah nama outlet',
          parameters: [idParam()],
          requestBody: body(ref('OutletInput')),
          responses: {
            200: ok('Outlet diperbarui', ref('UpdateResult')),
            400: err('Nama outlet wajib diisi'),
            404: err('Outlet tidak ditemukan'),
            ...std,
          },
        },
        delete: {
          tags: ['Outlets'], summary: 'Hapus outlet',
          parameters: [idParam()],
          responses: {
            200: ok('Outlet dihapus', ref('DeleteResult')),
            404: err('Outlet tidak ditemukan'),
            409: err('Outlet dipakai di riwayat absensi'),
            ...std,
          },
        },
      },

      '/api/positions': {
        get: {
          tags: ['Positions'], summary: 'Daftar posisi / level',
          responses: { 200: ok('Daftar posisi', { type: 'array', items: ref('Position') }), ...std },
        },
        post: {
          tags: ['Positions'], summary: 'Tambah posisi / level',
          requestBody: body(ref('PositionInput')),
          responses: {
            201: ok('Posisi dibuat', {
              type: 'object',
              properties: {
                success: { type: 'boolean' }, id: { type: 'integer' },
                name: { type: 'string' }, dailyWage: { type: 'number' },
              },
            }),
            400: err('Nama posisi wajib diisi'),
            ...std,
          },
        },
      },
      '/api/positions/{id}': {
        put: {
          tags: ['Positions'], summary: 'Ubah posisi / level',
          parameters: [idParam()],
          requestBody: body(ref('PositionInput')),
          responses: {
            200: ok('Posisi diperbarui', ref('UpdateResult')),
            400: err('Nama posisi wajib diisi'),
            404: err('Posisi tidak ditemukan'),
            ...std,
          },
        },
        delete: {
          tags: ['Positions'], summary: 'Hapus posisi / level',
          parameters: [idParam()],
          responses: {
            200: ok('Posisi dihapus', ref('DeleteResult')),
            404: err('Posisi tidak ditemukan'),
            ...std,
          },
        },
      },

      '/api/payroll': {
        get: {
          tags: ['Payroll'], summary: 'Daftar data gaji',
          responses: { 200: ok('Daftar gaji', { type: 'array', items: ref('Payroll') }), ...std },
        },
        post: {
          tags: ['Payroll'], summary: 'Tambah data gaji',
          requestBody: body(ref('PayrollCreate')),
          responses: { 201: ok('Data gaji dibuat', ref('CreateResult')), ...std },
        },
      },

      '/api/payroll-batches': {
        get: {
          tags: ['Payroll Batches'], summary: 'Riwayat rekap gaji',
          security: adminSecurity,
          responses: { 200: ok('Daftar rekap', { type: 'array', items: ref('PayrollBatch') }), ...std },
        },
        post: {
          tags: ['Payroll Batches'], summary: 'Simpan rekap gaji',
          security: adminSecurity,
          requestBody: body(ref('PayrollBatchCreate')),
          responses: {
            201: ok('Rekap disimpan', ref('PayrollBatch')),
            400: err('Data rekap tidak valid'),
            ...std,
          },
        },
      },
      '/api/payroll-batches/{id}': {
        delete: {
          tags: ['Payroll Batches'], summary: 'Hapus rekap gaji (soft delete)',
          security: adminSecurity,
          parameters: [idParam()],
          responses: {
            200: ok('Rekap dihapus', ref('SuccessResult')),
            400: err('ID tidak valid'),
            404: err('Rekap tidak ditemukan'),
            ...std,
          },
        },
      },

      '/api/admin-pin': {
        get: {
          tags: ['Admin PIN'], summary: 'Cek apakah PIN admin aktif',
          responses: {
            200: ok('Status PIN', { type: 'object', properties: { is_active: { type: 'boolean' } } }),
            404: err('Belum ada PIN admin'),
            ...std,
          },
        },
        put: {
          tags: ['Admin PIN'], summary: 'Ganti PIN admin',
          description: [
            'PIN **lama** wajib dikirim lewat header `X-Admin-Pin` (atau field `current_pin` di body).',
            '',
            'Lupa PIN? Reset dari terminal server: `cd backend && npm run reset-pin -- <PIN baru>`.',
          ].join('\n'),
          security: adminSecurity,
          requestBody: body({
            type: 'object', required: ['pin_code'],
            properties: {
              pin_code: { type: 'string', pattern: '^\\d{4,12}$', description: 'PIN baru (4–12 digit)', example: '567890' },
              current_pin: { type: 'string', description: 'Alternatif header X-Admin-Pin', example: '1234' },
            },
          }),
          responses: {
            200: ok('PIN diperbarui', {
              type: 'object',
              properties: { success: { type: 'boolean' }, updated: { type: 'integer' } },
            }),
            400: err('PIN baru tidak valid'),
            ...std,
          },
        },
      },
      '/api/admin-pin/verify': {
        post: {
          tags: ['Admin PIN'], summary: 'Verifikasi PIN admin',
          requestBody: body({
            type: 'object', required: ['pin_code'],
            properties: { pin_code: { type: 'string', example: '123456' } },
          }),
          responses: {
            200: ok('PIN valid', ref('SuccessResult')),
            401: err('API key atau PIN tidak valid'),
            500: { $ref: '#/components/responses/ServerError' },
          },
        },
      },
    },

    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey', in: 'header', name: 'X-API-Key',
          description: 'API key dari variabel lingkungan `API_KEYS` di backend.',
        },
        AdminPin: {
          type: 'apiKey', in: 'header', name: 'X-Admin-Pin',
          description: 'PIN admin aktif. Hanya untuk endpoint rekap gaji.',
        },
      },
      responses: {
        Unauthorized: { description: 'X-API-Key (atau X-Admin-Pin) tidak ada / tidak valid', content: json(ref('Error')) },
        ServerError: { description: 'Kesalahan server / database', content: json(ref('Error')) },
      },
      schemas: {
        Error: {
          type: 'object', required: ['error'],
          properties: {
            error: { type: 'string', example: 'API key tidak valid.' },
            detail: { type: 'string', description: 'Detail teknis (opsional)' },
          },
        },
        Health: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            service: { type: 'string', example: 'backend' },
            port: { type: 'integer', example: 4001 },
            db: { type: 'string', enum: ['connected', 'disconnected', 'unknown'] },
            message: { type: 'string' },
          },
        },
        SuccessResult: { type: 'object', properties: { success: { type: 'boolean', example: true } } },
        CreateResult: {
          type: 'object',
          properties: { success: { type: 'boolean', example: true }, id: { type: 'integer', example: 42 } },
        },
        UpdateResult: {
          type: 'object',
          properties: { success: { type: 'boolean', example: true }, updated: { type: 'integer', example: 1 } },
        },
        DeleteResult: {
          type: 'object',
          properties: { success: { type: 'boolean', example: true }, deleted: { type: 'integer', example: 1 } },
        },

        Employee: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            employee_code: { type: 'string', description: 'NIP', example: 'HD-001' },
            name: { type: 'string', example: 'Andi Pratama' },
            position_id: { type: 'integer', nullable: true, example: 2 },
            position_name: { type: 'string', nullable: true, example: 'Barista' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            phone: { type: 'string', nullable: true, example: '081234567890' },
            join_date: { type: 'string', format: 'date', nullable: true },
          },
        },
        EmployeeCreate: {
          type: 'object', required: ['employee_code', 'name', 'position_id'],
          properties: {
            employee_code: { type: 'string', description: 'NIP, harus unik', example: 'HD-010' },
            name: { type: 'string', example: 'Sari Dewi' },
            position_id: { type: 'integer', minimum: 1, example: 2 },
            join_date: { type: 'string', format: 'date', description: 'Default: hari ini' },
            status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        EmployeeUpdate: {
          type: 'object', required: ['employee_code', 'name', 'position_id', 'status'],
          properties: {
            employee_code: { type: 'string', example: 'HD-010' },
            name: { type: 'string', example: 'Sari Dewi' },
            position_id: { type: 'integer', example: 2 },
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
        },

        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employee_id: { type: 'integer' },
            outlet_id: { type: 'integer', nullable: true },
            outlet_name: { type: 'string', nullable: true },
            attendance_date: { type: 'string', format: 'date' },
            check_in: { type: 'string', nullable: true, example: '08:00:00' },
            check_out: { type: 'string', nullable: true, example: '17:00:00' },
            work_hours: { type: 'number', example: 8 },
            overtime_hours: { type: 'number', example: 1 },
            status: { type: 'string', example: 'present' },
            notes: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        AttendanceCreate: {
          type: 'object', required: ['employee_id', 'attendance_date', 'outlet_name'],
          properties: {
            employee_id: { type: 'integer', example: 1 },
            attendance_date: { type: 'string', format: 'date', example: '2026-11-17' },
            outlet_name: { type: 'string', description: 'Nama outlet yang sudah terdaftar', example: 'Outlet Pusat' },
            check_in: { type: 'string', example: '08:00' },
            check_out: { type: 'string', example: '17:00' },
            work_hours: { type: 'number', default: 0 },
            overtime_hours: { type: 'number', default: 0 },
            status: { type: 'string', default: 'present' },
            notes: { type: 'string' },
          },
        },
        AttendanceUpdate: {
          type: 'object',
          description: 'Semua field ditimpa; field yang tidak dikirim di-reset ke default.',
          properties: {
            check_in: { type: 'string', example: '08:00' },
            check_out: { type: 'string', example: '17:00' },
            work_hours: { type: 'number' },
            overtime_hours: { type: 'number' },
            status: { type: 'string', default: 'present' },
            notes: { type: 'string' },
          },
        },

        Outlet: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1' },
            name: { type: 'string', example: 'Outlet Pusat' },
            outlet_code: { type: 'string', example: 'OUTLET_PUSAT' },
          },
        },
        OutletInput: {
          type: 'object', required: ['name'],
          properties: { name: { type: 'string', example: 'Outlet Pusat' } },
        },

        Position: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1' },
            name: { type: 'string', example: 'Barista' },
            dailyWage: { type: 'number', example: 150000 },
          },
        },
        PositionInput: {
          type: 'object', required: ['name'],
          properties: {
            name: { type: 'string', example: 'Barista' },
            dailyWage: { type: 'number', default: 0, example: 150000 },
          },
        },

        Payroll: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employee_id: { type: 'integer' },
            payroll_period: { type: 'string', example: '2026-11' },
            total_attendance_hours: { type: 'number' },
            base_salary: { type: 'number' },
            overtime_pay: { type: 'number' },
            deductions: { type: 'number' },
            net_salary: { type: 'number' },
            status: { type: 'string', example: 'draft' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        PayrollCreate: {
          type: 'object', required: ['employee_id', 'payroll_period'],
          properties: {
            employee_id: { type: 'integer', example: 1 },
            payroll_period: { type: 'string', example: '2026-11' },
            total_attendance_hours: { type: 'number', default: 0 },
            base_salary: { type: 'number', default: 0 },
            overtime_pay: { type: 'number', default: 0 },
            deductions: { type: 'number', default: 0 },
            net_salary: { type: 'number', default: 0 },
            status: { type: 'string', default: 'draft' },
          },
        },

        PayrollBatch: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '7' },
            batchCode: { type: 'string', example: 'PAY-20261117-001' },
            generatedAt: { type: 'string' },
            periodLabel: { type: 'string', example: '1–15 Nov 2026' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            outlet: { type: 'string', example: 'all' },
            totalEmployees: { type: 'integer' },
            totalDays: { type: 'integer' },
            grandTotal: { type: 'number' },
            details: { type: 'array', items: { type: 'object', additionalProperties: true } },
          },
        },
        PayrollBatchCreate: {
          type: 'object',
          required: ['batchCode', 'generatedAt', 'periodLabel', 'startDate', 'endDate', 'details'],
          properties: {
            batchCode: { type: 'string', example: 'PAY-20261117-001' },
            generatedAt: { type: 'string', example: '2026-11-17T10:00:00.000Z' },
            periodLabel: { type: 'string', example: '1–15 Nov 2026' },
            startDate: { type: 'string', format: 'date', example: '2026-11-01' },
            endDate: { type: 'string', format: 'date', example: '2026-11-15' },
            outlet: { type: 'string', default: 'all' },
            totalEmployees: { type: 'integer', minimum: 0 },
            totalDays: { type: 'integer', minimum: 0 },
            grandTotal: { type: 'number', minimum: 0 },
            details: { type: 'array', items: { type: 'object', additionalProperties: true } },
          },
        },
      },
    },
  };
}
