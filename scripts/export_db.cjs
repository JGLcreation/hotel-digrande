const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function exportDb() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'lozada2004',
    database: 'hotel'
  });

  const [tables] = await connection.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);

  let sql = '-- ====================================================================\n' +
            '-- The Grand Luxe Hotel & Resort - Complete MySQL Database Schema & Seeds\n' +
            '-- Database: hotel | Port: 3307\n' +
            '-- Generated for JGLcreation/hotel-digrande\n' +
            '-- ====================================================================\n\n' +
            'CREATE DATABASE IF NOT EXISTS `hotel` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n' +
            'USE `hotel`;\n\n' +
            'SET FOREIGN_KEY_CHECKS = 0;\n\n';

  for (const table of tableNames) {
    const [createRes] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
    sql += `-- --------------------------------------------------------------------\n` +
           `-- Table structure for \`${table}\`\n` +
           `-- --------------------------------------------------------------------\n` +
           `DROP TABLE IF EXISTS \`${table}\`;\n` +
           createRes[0]['Create Table'] + ';\n\n';

    const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      sql += `-- Records for \`${table}\`\nINSERT INTO \`${table}\` VALUES\n`;
      const rowStrings = rows.map(row => {
        const values = Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
        });
        return `(${values.join(', ')})`;
      });
      sql += rowStrings.join(',\n') + ';\n\n';
    }
  }

  sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  const dbDir = path.resolve(__dirname, '../database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const outPath = path.join(dbDir, 'hotel_schema_and_seeds.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log('Database export written successfully to: ' + outPath);

  await connection.end();
}

exportDb().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});

