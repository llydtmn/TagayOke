// config/db.js — Shared MySQL connection pool (mysql2 promise API).
// XAMPP ships with root / no-password by default.

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'calbayog_farmers',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

pool.getConnection()
  .then(conn => {
    console.log(`✅  MySQL connected → ${process.env.DB_NAME || 'calbayog_farmers'}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌  MySQL connection failed:', err.message);
    console.error('    → Is XAMPP MySQL running? Check .env credentials.');
  });

module.exports = pool;