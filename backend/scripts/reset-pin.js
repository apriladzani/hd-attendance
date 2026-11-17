// Reset the admin PIN directly in the database, for when the current PIN is lost.
// Must be run on the server (it uses the DB credentials in backend/.env), so it is
// not reachable over the API.
//
// Usage:  npm run reset-pin -- 567890
import { pool } from '../db.js';

const newPin = String(process.argv[2] ?? '').trim();

if (!/^\d{4,12}$/.test(newPin)) {
  console.error('Pemakaian: npm run reset-pin -- <PIN baru, 4–12 digit angka>');
  process.exit(1);
}

try {
  const [result] = await pool.execute(
    'UPDATE admin_pins SET pin_code = ?, updated_at = CURRENT_TIMESTAMP WHERE is_active = TRUE ORDER BY id DESC LIMIT 1',
    [newPin]
  );
  if (result.affectedRows === 0) {
    await pool.execute('INSERT INTO admin_pins (pin_code, is_active) VALUES (?, TRUE)', [newPin]);
  }
  console.log('PIN admin berhasil di-reset. Gunakan PIN baru untuk login.');
} catch (error) {
  console.error('Reset PIN gagal:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
