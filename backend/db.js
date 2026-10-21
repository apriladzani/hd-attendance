import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hd_attendance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

export const pool = mysql.createPool(dbConfig);

export async function ensureDatabase() {
  const adminConnection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    multipleStatements: true
  });

  try {
    await adminConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
  } finally {
    await adminConnection.end();
  }

  const connection = await pool.getConnection();

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS outlets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        outlet_code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS positions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        position_code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        daily_wage DECIMAL(15,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        department VARCHAR(100),
        position VARCHAR(100),
        join_date DATE,
        base_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        phone VARCHAR(50),
        email VARCHAR(150),
        outlet_id INT NULL,
        position_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE SET NULL,
        FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    const [employeeColumns] = await connection.query('SHOW COLUMNS FROM employees');
    if (!employeeColumns.some((column) => column.Field === 'position_id')) {
      await connection.execute('ALTER TABLE employees ADD COLUMN position_id INT NULL');
    }
    await connection.execute(`
      UPDATE employees e
      INNER JOIN positions p ON p.name = e.position
      SET e.position_id = p.id
      WHERE e.position_id IS NULL
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attendances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        outlet_id INT NULL,
        attendance_date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        work_hours DECIMAL(10,2) DEFAULT 0,
        overtime_hours DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'present',
        notes TEXT,
        verified_by_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    const [attendanceColumns] = await connection.query('SHOW COLUMNS FROM attendances');
    if (!attendanceColumns.some((column) => column.Field === 'outlet_id')) {
      await connection.execute('ALTER TABLE attendances ADD COLUMN outlet_id INT NULL');
    }

    const [attendanceIndexRows] = await connection.query(
      "SHOW INDEX FROM attendances WHERE Key_name = 'uq_attendance_employee_date'"
    );
    if (attendanceIndexRows.length === 0) {
      const [duplicateAttendanceRows] = await connection.query(`
        SELECT employee_id, attendance_date
        FROM attendances
        GROUP BY employee_id, attendance_date
        HAVING COUNT(*) > 1
        LIMIT 1
      `);
      if (duplicateAttendanceRows.length === 0) {
        await connection.execute(
          'ALTER TABLE attendances ADD UNIQUE KEY uq_attendance_employee_date (employee_id, attendance_date)'
        );
      }
    }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payrolls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        payroll_period VARCHAR(20) NOT NULL,
        total_attendance_hours DECIMAL(10,2) DEFAULT 0,
        base_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
        overtime_pay DECIMAL(15,2) DEFAULT 0,
        deductions DECIMAL(15,2) DEFAULT 0,
        net_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_pins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pin_code VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payroll_batches (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        batch_code VARCHAR(100) NOT NULL,
        generated_at VARCHAR(100) NOT NULL,
        period_label VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        outlet VARCHAR(100) NOT NULL,
        total_employees INT NOT NULL DEFAULT 0,
        total_days INT NOT NULL DEFAULT 0,
        grand_total DECIMAL(15,2) NOT NULL DEFAULT 0,
        details JSON NOT NULL,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        deleted_by VARCHAR(100) NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_payroll_batches_deleted_created (deleted_at, created_at)
      ) ENGINE=InnoDB;
    `);

    // Migrate the payroll history fixture currently shown by the frontend.
    // The existence check includes soft-deleted rows so a deleted batch never returns.
    const [legacyBatchRows] = await connection.execute(
      'SELECT id FROM payroll_batches WHERE batch_code = ? LIMIT 1',
      ['PAY-202609-ALL']
    );
    if (legacyBatchRows.length === 0) {
      const legacyDetails = [
        { nip: 'HD-001', employeeName: 'Andi Saputra', outlet: 'Cisalak', positionName: 'Crew/1', validDays: 26, dailyWage: 50000, totalWage: 1300000 },
        { nip: 'HD-002', employeeName: 'Budi Santoso', outlet: 'BRP', positionName: 'Leader/1', validDays: 24, dailyWage: 65000, totalWage: 1560000 },
        { nip: 'HD-003', employeeName: 'Siti Rahmawati', outlet: 'Cisalak', positionName: 'Kasir/1', validDays: 25, dailyWage: 55000, totalWage: 1375000 },
        { nip: 'HD-004', employeeName: 'Rina Wulandari', outlet: 'BRP', positionName: 'Crew/2', validDays: 24, dailyWage: 52000, totalWage: 1248000 },
        { nip: 'HD-005', employeeName: 'Eko Prasetyo', outlet: 'Cisalak', positionName: 'Cook/1', validDays: 22, dailyWage: 60000, totalWage: 1320000 },
        { nip: 'HD-006', employeeName: 'Dewi Lestari', outlet: 'BRP', positionName: 'Supervisor/1', validDays: 25, dailyWage: 75000, totalWage: 1875000 },
        { nip: 'HD-007', employeeName: 'Fajar Hidayat', outlet: 'Cisalak', positionName: 'Crew/1', validDays: 23, dailyWage: 50000, totalWage: 1150000 },
        { nip: 'HD-008', employeeName: 'Maya Anggraini', outlet: 'BRP', positionName: 'Crew/2', validDays: 22, dailyWage: 52000, totalWage: 1144000 },
        { nip: 'HD-009', employeeName: 'Hendra Kusuma', outlet: 'Cisalak', positionName: 'Crew/1', validDays: 24, dailyWage: 50000, totalWage: 1200000 },
        { nip: 'HD-010', employeeName: 'Tri Wahyuni', outlet: 'BRP', positionName: 'Crew/1', validDays: 21, dailyWage: 50000, totalWage: 1050000 },
      ];
      await connection.execute(`
        INSERT INTO payroll_batches
          (batch_code, generated_at, period_label, start_date, end_date, outlet,
           total_employees, total_days, grand_total, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'PAY-202609-ALL', '2026-10-01 10:00 WIB',
        'Bulanan (01 Sep 2026 - 30 Sep 2026)', '2026-09-01', '2026-09-30',
        'all', 10, 236, 14210000, JSON.stringify(legacyDetails),
      ]);
    }

    const [adminPinTables] = await connection.query("SHOW TABLES LIKE 'admin_pins'");
    const [adminPinRows] = await connection.execute('SELECT COUNT(*) AS total FROM admin_pins');
    if (adminPinTables.length > 0 && Number(adminPinRows[0].total) === 0) {
      await connection.execute(`
        INSERT INTO admin_pins (pin_code, is_active)
        VALUES ('1234', TRUE);
      `);
    }

    const [outletTables] = await connection.query("SHOW TABLES LIKE 'outlets'");
    const [outletRows] = await connection.execute('SELECT COUNT(*) AS total FROM outlets');
    if (outletTables.length > 0 && Number(outletRows[0].total) === 0) {
      await connection.execute(`
        INSERT INTO outlets (outlet_code, name)
        VALUES
          ('CISALAK', 'Cisalak'),
          ('BRP', 'BRP'),
          ('MARGONDA', 'Margonda');
      `);
    }

    const [positionTables] = await connection.query("SHOW TABLES LIKE 'positions'");
    const [positionRows] = await connection.execute('SELECT COUNT(*) AS total FROM positions');
    if (positionTables.length > 0 && Number(positionRows[0].total) === 0) {
      await connection.execute(`
        INSERT INTO positions (position_code, name, daily_wage)
        VALUES
          ('SPV1', 'Supervisor/1', 75000),
          ('LDR1', 'Leader/1', 65000),
          ('COOK1', 'Cook/1', 60000),
          ('KSR1', 'Kasir/1', 55000),
          ('CRW2', 'Crew/2', 52000),
          ('CRW1', 'Crew/1', 50000);
      `);
    }

    const [rows] = await connection.execute('SELECT COUNT(*) AS total FROM employees');
    if (Number(rows[0].total) === 0) {
      await connection.execute(`
        INSERT INTO employees (employee_code, name, department, position, join_date, base_salary, status, phone, email, outlet_id, position_id)
        VALUES
          ('EMP-001', 'Andi Pratama', 'Engineering', 'Developer', '2023-01-10', 5000000, 'active', '081234567890', 'andi@example.com', 1, 6),
          ('EMP-002', 'Sari Dewi', 'Finance', 'Accounting Staff', '2022-06-15', 4200000, 'active', '081298765432', 'sari@example.com', 2, 2),
          ('EMP-003', 'Rizky Hidayat', 'HR', 'HR Specialist', '2024-03-01', 3900000, 'active', '081255443322', 'rizky@example.com', 3, 4);
      `);
    }
  } finally {
    connection.release();
  }
}
