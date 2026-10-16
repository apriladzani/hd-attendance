CREATE DATABASE IF NOT EXISTS hd_attendance;
USE hd_attendance;

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attendances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  work_hours DECIMAL(10,2) DEFAULT 0,
  overtime_hours DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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

INSERT INTO employees (employee_code, name, department, position, join_date, base_salary, status, phone, email)
SELECT 'EMP-001', 'Andi Pratama', 'Engineering', 'Developer', '2023-01-10', 5000000, 'active', '081234567890', 'andi@example.com'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code = 'EMP-001');

INSERT INTO employees (employee_code, name, department, position, join_date, base_salary, status, phone, email)
SELECT 'EMP-002', 'Sari Dewi', 'Finance', 'Accounting Staff', '2022-06-15', 4200000, 'active', '081298765432', 'sari@example.com'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code = 'EMP-002');

INSERT INTO employees (employee_code, name, department, position, join_date, base_salary, status, phone, email)
SELECT 'EMP-003', 'Rizky Hidayat', 'HR', 'HR Specialist', '2024-03-01', 3900000, 'active', '081255443322', 'rizky@example.com'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code = 'EMP-003');
