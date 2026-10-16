import express from 'express';
import cors from 'cors';
import { pool, ensureDatabase } from './db.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

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
    const [rows] = await pool.query('SELECT * FROM employees ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees', detail: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  const { employee_code, name, department, position, join_date, base_salary, status, phone, email } = req.body;

  try {
    if (!employee_code || !name) {
      return res.status(400).json({ error: 'employee_code and name are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO employees (employee_code, name, department, position, join_date, base_salary, status, phone, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_code, name, department || '', position || '', join_date || new Date().toISOString().slice(0, 10), base_salary || 0, status || 'active', phone || '', email || '']
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create employee', detail: error.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  const { employee_code, name, department, position, join_date, base_salary, status, phone, email } = req.body;
  const ref = String(req.params.id || employee_code || '');
  const field = /^\d+$/.test(ref) ? 'id' : 'employee_code';

  try {
    const [result] = await pool.execute(
      `UPDATE employees
       SET employee_code = ?, name = ?, department = ?, position = ?, join_date = ?, base_salary = ?, status = ?, phone = ?, email = ?
       WHERE ${field} = ?`,
      [employee_code || ref, name, department || '', position || '', join_date || new Date().toISOString().slice(0, 10), base_salary || 0, status || 'active', phone || '', email || '', ref]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ success: true, updated: result.affectedRows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee', detail: error.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const ref = String(req.params.id || '');
  const field = /^\d+$/.test(ref) ? 'id' : 'employee_code';

  try {
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
    res.json({ pin_code: rows[0].pin_code, is_active: !!rows[0].is_active });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin pin', detail: error.message });
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
    const [result] = await pool.execute('DELETE FROM outlets WHERE id = ?', [Number(req.params.id)]);
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
    const [rows] = await pool.query('SELECT * FROM attendances ORDER BY attendance_date DESC, id DESC');
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
  const { employee_id, attendance_date, check_in, check_out, work_hours, overtime_hours, status, notes } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO attendances (employee_id, attendance_date, check_in, check_out, work_hours, overtime_hours, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, attendance_date, check_in || null, check_out || null, work_hours || 0, overtime_hours || 0, status || 'present', notes || '']
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create attendance record', detail: error.message });
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
