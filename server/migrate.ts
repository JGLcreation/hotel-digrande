import { initDb } from './mysqlDb.ts';

async function run() {
  console.log('[Migration] Running database migrations for The Grand Luxe Hotel & Resort...');
  console.log('[Migration] Connecting to MySQL...');
  await initDb();
  console.log('[Migration] All migrations and seeding completed successfully.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[Migration] Failed:', err.message || err);
  process.exit(1);
});
