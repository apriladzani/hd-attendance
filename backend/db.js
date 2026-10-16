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
