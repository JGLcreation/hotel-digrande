import mysql from 'mysql2/promise';

async function createDb() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'lozada2004'
  });
  await conn.query('CREATE DATABASE IF NOT EXISTS hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  console.log('[Setup] Database "hotel" created (or already exists).');
  await conn.end();
}

createDb().catch(err => {
  console.error('[Setup] Failed to create database:', err.message);
  process.exit(1);
});

