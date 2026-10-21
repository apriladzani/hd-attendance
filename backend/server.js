import express from 'express';
import cors from 'cors';
import { pool, ensureDatabase } from './db.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

async function validateAdminPin(req, res, pinOverride) {
  const providedPin = String(pinOverride ?? req.get('x-admin-pin') ?? '').trim();
  if (!providedPin) {
    res.status(401).json({ error: 'PIN admin diperlukan.' });
    return false;
  }
  const [rows] = await pool.query(
    'SELECT pin_code FROM admin_pins WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
  );
  if (!rows.length || providedPin !== String(rows[0].pin_code)) {
    res.status(401).json({ error: 'PIN admin tidak valid.' });
    return false;
  }
  return true;
}

function mapPayrollBatch(row) {
  let details = row.details;
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch { details = []; }
  }
  return {
    id: String(row.id),
    batchCode: row.batch_code,
    generatedAt: row.generated_at,
    periodLabel: row.period_label,
    startDate: row.start_date,
    endDate: row.end_date,
    outlet: row.outlet,
    totalEmployees: Number(row.total_employees),
    totalDays: Number(row.total_days),
    grandTotal: Number(row.grand_total),
    details: Array.isArray(details) ? details : [],
  };
}

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', service: 'backend', port: PORT, db: rows[0]?.ok === 1 ? 'connected' : 'unknown' });
  } catch (error) {
    res.status(500).json({ status: 'error', service: 'backend', port: PORT, db: 'disconnected', message: error.message });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.id, e.employee_code, e.name, e.position_id,
        COALESCE(p.name, e.position) AS position_name,
        e.status, e.phone, e.join_date
      FROM employees e
      LEFT JOIN positions p ON p.id = e.position_id
      ORDER BY e.id ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees', detail: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  const { employee_code, name, position_id, join_date, status, phone, email } = req.body;

  try {
    const nip = String(employee_code || '').trim();
    const employeeName = String(name || '').trim();
    const positionId = Number(position_id);
    if (!nip || !employeeName || !Number.isInteger(positionId) || positionId <= 0) {
      return res.status(400).json({ error: 'NIP, name, and position are required' });
    }
    const [duplicateRows] = await pool.execute('SELECT id FROM employees WHERE employee_code = ? LIMIT 1', [nip]);
    if (duplicateRows.length) return res.status(409).json({ error: 'NIP sudah digunakan karyawan lain.' });
    const [positionRows] = await pool.execute('SELECT id, name FROM positions WHERE id = ? LIMIT 1', [positionId]);
    if (!positionRows.length) return res.status(400).json({ error: 'Posisi / level tidak ditemukan.' });

    const [result] = await pool.execute(
      `INSERT INTO employees (employee_code, name, position, position_id, join_date, status, phone, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nip, employeeName, positionRows[0].name, positionRows[0].id, join_date || new Date().toISOString().slice(0, 10), status === 'inactive' ? 'inactive' : 'active', phone || '', email || '']
    );

    const [rows] = await pool.execute(`
      SELECT e.id, e.employee_code, e.name, e.position_id, p.name AS position_name,
        e.status, e.phone, e.join_date
      FROM employees e LEFT JOIN positions p ON p.id = e.position_id WHERE e.id = ?
    `, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'NIP sudah digunakan karyawan lain.' });
    }
    res.status(500).json({ error: 'Failed to create employee', detail: error.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  const employeeId = Number(req.params.id);
  const nip = String(req.body?.employee_code || '').trim();
  const employeeName = String(req.body?.name || '').trim();
  const positionId = Number(req.body?.position_id);
  const status = String(req.body?.status || '').toLowerCase();
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({ error: 'ID internal karyawan tidak valid.' });
  }
  if (!nip || !employeeName || !Number.isInteger(positionId) || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'NIP, nama, posisi, dan status karyawan wajib valid.' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT id FROM employees WHERE id = ? FOR UPDATE', [employeeId]);
    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Karyawan tidak ditemukan.' });
    }
    const [duplicateRows] = await connection.execute(
      'SELECT id FROM employees WHERE employee_code = ? AND id <> ? LIMIT 1',
      [nip, employeeId]
    );
    if (duplicateRows.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'NIP sudah digunakan karyawan lain.' });
    }
    const [positionRows] = await connection.execute('SELECT id, name FROM positions WHERE id = ? LIMIT 1', [positionId]);
    if (!positionRows.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'Posisi / level tidak ditemukan.' });
    }
    await connection.execute(
      'UPDATE employees SET employee_code = ?, name = ?, position = ?, position_id = ?, status = ? WHERE id = ?',
      [nip, employeeName, positionRows[0].name, positionRows[0].id, status, employeeId]
    );
    await connection.commit();
    const [rows] = await pool.execute(`
      SELECT e.id, e.employee_code, e.name, e.position_id, p.name AS position_name,
        e.status, e.phone, e.join_date
      FROM employees e LEFT JOIN positions p ON p.id = e.position_id WHERE e.id = ?
    `, [employeeId]);
    res.json(rows[0]);
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch { /* transaction may not have started */ }
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'NIP sudah digunakan karyawan lain.' });
    }
    res.status(500).json({ error: 'Failed to update employee', detail: error.message });
  } finally {
    connection?.release();
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const ref = String(req.params.id || '');
  const field = /^\d+$/.test(ref) ? 'id' : 'employee_code';

  try {
    const [usageRows] = await pool.execute(
      `SELECT
        (SELECT COUNT(*) FROM attendances WHERE employee_id = e.id) AS attendance_count,
        (SELECT COUNT(*) FROM payrolls WHERE employee_id = e.id) AS payroll_count
       FROM employees e WHERE e.${field} = ?`,
      [ref]
    );
    if (usageRows.length && (Number(usageRows[0].attendance_count) > 0 || Number(usageRows[0].payroll_count) > 0)) {
      return res.status(409).json({ error: 'Karyawan memiliki riwayat absensi atau gaji. Ubah status menjadi nonaktif agar riwayat tetap tersimpan.' });
    }
    const [result] = await pool.execute(
      `DELETE FROM employees WHERE ${field} = ?`,
      [ref]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ success: true, deleted: result.affectedRows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee', detail: error.message });
  }
});

app.get('/api/admin-pin', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT pin_code, is_active FROM admin_pins ORDER BY id DESC LIMIT 1');
    if (!rows.length) {
      return res.status(404).json({ error: 'No admin pin found' });
    }
    res.json({ is_active: !!rows[0].is_active });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin pin', detail: error.message });
  }
});

app.post('/api/admin-pin/verify', async (req, res) => {
  try {
    if (!await validateAdminPin(req, res, req.body?.pin_code)) return;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Verifikasi PIN gagal.', detail: error.message });
  }
});

app.put('/api/admin-pin', async (req, res) => {
  const { pin_code } = req.body || {};

  if (!pin_code || String(pin_code).trim().length === 0) {
    return res.status(400).json({ error: 'pin_code is required' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE admin_pins SET pin_code = ?, updated_at = CURRENT_TIMESTAMP WHERE is_active = TRUE ORDER BY id DESC LIMIT 1',
      [String(pin_code).trim()]
    );

    if (result.affectedRows === 0) {
      const [insertResult] = await pool.execute(
        'INSERT INTO admin_pins (pin_code, is_active) VALUES (?, TRUE)',
        [String(pin_code).trim()]
      );
      return res.json({ success: true, id: insertResult.insertId, pin_code: String(pin_code).trim() });
    }

    res.json({ success: true, updated: result.affectedRows, pin_code: String(pin_code).trim() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update admin pin', detail: error.message });
  }
});

app.get('/api/payroll-batches', async (req, res) => {
  try {
    if (!await validateAdminPin(req, res)) return;
    const [rows] = await pool.query(`
      SELECT id, batch_code, generated_at, period_label,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        outlet, total_employees, total_days, grand_total, details
      FROM payroll_batches
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC, id DESC
    `);
    res.json(rows.map(mapPayrollBatch));
  } catch (error) {
    res.status(500).json({ error: 'Riwayat rekap gaji gagal dimuat.', detail: error.message });
  }
});

app.post('/api/payroll-batches', async (req, res) => {
  try {
    if (!await validateAdminPin(req, res)) return;
    const batch = req.body || {};
    const requiredText = ['batchCode', 'generatedAt', 'periodLabel', 'startDate', 'endDate'];
    if (requiredText.some((key) => !String(batch[key] || '').trim()) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(String(batch.startDate)) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(String(batch.endDate)) ||
        !Array.isArray(batch.details)) {
      return res.status(400).json({ error: 'Data rekap gaji tidak valid.' });
    }
    const [result] = await pool.execute(`
      INSERT INTO payroll_batches
        (batch_code, generated_at, period_label, start_date, end_date, outlet,
         total_employees, total_days, grand_total, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      String(batch.batchCode), String(batch.generatedAt), String(batch.periodLabel),
      batch.startDate, batch.endDate, String(batch.outlet || 'all'),
      Math.max(0, Number(batch.totalEmployees) || 0), Math.max(0, Number(batch.totalDays) || 0),
      Math.max(0, Number(batch.grandTotal) || 0), JSON.stringify(batch.details),
    ]);
    const [rows] = await pool.execute(`
      SELECT id, batch_code, generated_at, period_label,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        outlet, total_employees, total_days, grand_total, details
      FROM payroll_batches WHERE id = ?
    `, [result.insertId]);
    res.status(201).json(mapPayrollBatch(rows[0]));
  } catch (error) {
    res.status(500).json({ error: 'Rekap gaji gagal disimpan.', detail: error.message });
  }
});

app.delete('/api/payroll-batches/:id', async (req, res) => {
  try {
    if (!await validateAdminPin(req, res)) return;
    const batchId = String(req.params.id || '');
    if (!/^\d+$/.test(batchId)) return res.status(400).json({ error: 'ID rekap gaji tidak valid.' });
    const [result] = await pool.execute(`
      UPDATE payroll_batches
      SET deleted_at = CURRENT_TIMESTAMP, deleted_by = 'admin'
      WHERE id = ? AND deleted_at IS NULL
    `, [batchId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Rekap gaji tidak ditemukan.' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Rekap gaji gagal dihapus.', detail: error.message });
  }
});

app.get('/api/outlets', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM outlets ORDER BY id ASC');
    res.json(rows.map((row) => ({ id: String(row.id), name: row.name, outlet_code: row.outlet_code })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch outlets', detail: error.message });
  }
});

app.post('/api/outlets', async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Outlet name is required' });
  }

  try {
    const outletCode = String(name).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    const [result] = await pool.execute(
      'INSERT INTO outlets (outlet_code, name) VALUES (?, ?)',
      [outletCode, String(name).trim()]
    );

    res.status(201).json({ success: true, id: result.insertId, name: String(name).trim() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create outlet', detail: error.message });
  }
});

app.put('/api/outlets/:id', async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Outlet name is required' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE outlets SET name = ?, outlet_code = ? WHERE id = ?',
      [String(name).trim(), String(name).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_'), Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    res.json({ success: true, updated: result.affectedRows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update outlet', detail: error.message });
  }
});

app.delete('/api/outlets/:id', async (req, res) => {
  try {
    const outletId = Number(req.params.id);
    const [attendanceRows] = await pool.execute(
      'SELECT id FROM attendances WHERE outlet_id = ? LIMIT 1',
      [outletId]
    );
    if (attendanceRows.length) {
      return res.status(409).json({ error: 'Outlet tidak dapat dihapus karena digunakan dalam riwayat absensi.' });
    }
    const [result] = await pool.execute('DELETE FROM outlets WHERE id = ?', [outletId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Outlet not found' });
    }
    res.json({ success: true, deleted: result.affectedRows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete outlet', detail: error.message });
  }
});

app.get('/api/positions', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM positions ORDER BY id ASC');
    res.json(rows.map((row) => ({ id: String(row.id), name: row.name, dailyWage: Number(row.daily_wage) })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch positions', detail: error.message });
  }
});

app.post('/api/positions', async (req, res) => {
  const { name, dailyWage } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Position name is required' });
  }

  try {
    const positionCode = String(name).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    const [result] = await pool.execute(
      'INSERT INTO positions (position_code, name, daily_wage) VALUES (?, ?, ?)',
      [positionCode, String(name).trim(), Number(dailyWage) || 0]
    );

    res.status(201).json({ success: true, id: result.insertId, name: String(name).trim(), dailyWage: Number(dailyWage) || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create position', detail: error.message });
  }
});

app.put('/api/positions/:id', async (req, res) => {
  const { name, dailyWage } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Position name is required' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE positions SET name = ?, daily_wage = ?, position_code = ? WHERE id = ?',
      [String(name).trim(), Number(dailyWage) || 0, String(name).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_'), Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }

    res.json({ success: true, updated: result.affectedRows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update position', detail: error.message });
  }
});

app.delete('/api/positions/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM positions WHERE id = ?', [Number(req.params.id)]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }
    res.json({ success: true, deleted: result.affectedRows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete position', detail: error.message });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, o.name AS outlet_name
      FROM attendances a
      LEFT JOIN outlets o ON o.id = a.outlet_id
      ORDER BY a.attendance_date DESC, a.id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance', detail: error.message });
  }
});

app.get('/api/payroll', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payrolls ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payrolls', detail: error.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { employee_id, attendance_date, check_in, check_out, work_hours, overtime_hours, status, notes, outlet_name } = req.body;

  if (!employee_id || !attendance_date || !outlet_name) {
    return res.status(400).json({ error: 'Employee, attendance date, and selected outlet are required.' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [employeeRows] = await connection.execute(
      'SELECT id FROM employees WHERE id = ? FOR UPDATE',
      [employee_id]
    );
    if (!employeeRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Karyawan tidak ditemukan.' });
    }
    const [existingRows] = await connection.execute(
      'SELECT id FROM attendances WHERE employee_id = ? AND attendance_date = ? LIMIT 1',
      [employee_id, attendance_date]
    );
    if (existingRows.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'Absensi karyawan untuk tanggal ini sudah tercatat.' });
    }
    const [outletRows] = await connection.execute(
      'SELECT id FROM outlets WHERE name = ? LIMIT 1',
      [String(outlet_name).trim()]
    );
    if (outletRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Outlet yang dipilih tidak ditemukan.' });
    }
    const outletId = outletRows[0].id;
    const [result] = await connection.execute(
      `INSERT INTO attendances (employee_id, outlet_id, attendance_date, check_in, check_out, work_hours, overtime_hours, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, outletId, attendance_date, check_in || null, check_out || null, work_hours || 0, overtime_hours || 0, status || 'present', notes || '']
    );
    await connection.commit();
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch { /* transaction may not have started */ }
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Absensi karyawan untuk tanggal ini sudah tercatat.' });
    }
    res.status(500).json({ error: 'Failed to create attendance record', detail: error.message });
  } finally {
    connection?.release();
  }
});

app.put('/api/attendance/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'A valid attendance id is required' });
  }

  const { check_in, check_out, work_hours, overtime_hours, status, notes } = req.body || {};
  try {
    const [result] = await pool.execute(
      `UPDATE attendances
       SET check_in = ?, check_out = ?, work_hours = ?, overtime_hours = ?, status = ?, notes = ?
       WHERE id = ?`,
      [check_in || null, check_out || null, work_hours || 0, overtime_hours || 0, status || 'present', notes || '', id]
    );
    if (result.affectedRows === 0) {
      const [rows] = await pool.execute('SELECT id FROM attendances WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Attendance record not found' });
      }
    }
    res.json({ success: true, updated: result.affectedRows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update attendance record', detail: error.message });
  }
});

app.delete('/api/attendance/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'A valid attendance id is required' });
  }

  try {
    const [result] = await pool.execute('DELETE FROM attendances WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json({ success: true, deleted: result.affectedRows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attendance record', detail: error.message });
  }
});

app.post('/api/payroll', async (req, res) => {
  const { employee_id, payroll_period, total_attendance_hours, base_salary, overtime_pay, deductions, net_salary, status } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO payrolls (employee_id, payroll_period, total_attendance_hours, base_salary, overtime_pay, deductions, net_salary, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, payroll_period, total_attendance_hours || 0, base_salary || 0, overtime_pay || 0, deductions || 0, net_salary || 0, status || 'draft']
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payroll record', detail: error.message });
  }
});

try {
  await ensureDatabase();
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error('MySQL connection failed. Make sure MySQL Workbench server is running and the credentials in .env are correct.');
  console.error(error.message);
  process.exit(1);
}
