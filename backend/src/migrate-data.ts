/**
 * Data Migration Script
 * Copies all data from old Railway PostgreSQL → new Neon PostgreSQL
 * Run with: npx ts-node src/migrate-data.ts
 */

import { Client } from 'pg';

const SOURCE_URL =
  'postgresql://postgres:XZoRrOdWRwLPkUPGMCgSjBTTWsOOTczI@gondola.proxy.rlwy.net:43926/railway?sslmode=no-verify';

const TARGET_URL =
  'postgresql://neondb_owner:npg_NJ8B7qKYPIAR@ep-divine-butterfly-anw5xtln-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Tables in dependency order (parents before children)
const TABLES_IN_ORDER = [
  'User',
  'Affiliate',
  'Brand',
  'AffiliateCoupon',
  'Post',
  'SavedPost',
  'Comment',
  'CommentReport',
  'Like',
  'Session',
  'SessionRegistration',
  'Payment',
  'Partnership',
  'Product',
  'AffiliateLink',
  'Commission',
  'PayoutBatch',
  'CommissionRequest',
  'Notification',
  'GlobalSetting',
  'HealthPlan',
  // New tables (will be empty on source, skip gracefully)
  'Order',
  'OrderItem',
];

async function migrateTable(source: Client, target: Client, tableName: string): Promise<void> {
  // Prisma uses PascalCase model names but actual table names are the same
  // PostgreSQL stores them as-is (case-sensitive with quotes)
  const query = `SELECT * FROM "${tableName}"`;

  let rows: any[];
  try {
    const result = await source.query(query);
    rows = result.rows;
  } catch (err: any) {
    // Table might not exist on old DB (e.g. new Order tables)
    if (err.code === '42P01') {
      console.log(`  ⚠️  Table "${tableName}" not found on source — skipping`);
      return;
    }
    throw err;
  }

  if (rows.length === 0) {
    console.log(`  ✓  "${tableName}" — empty, nothing to migrate`);
    return;
  }

  // Build parameterized INSERT ... ON CONFLICT DO NOTHING
  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(', ');

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const values = columns.map((c) => row[c]);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

    try {
      const result = await target.query(sql, values);
      if (result.rowCount && result.rowCount > 0) inserted++;
      else skipped++;
    } catch (err: any) {
      console.warn(`    ⚠️  Row in "${tableName}" skipped (${err.message})`);
      skipped++;
    }
  }

  console.log(
    `  ✓  "${tableName}" — ${rows.length} rows found → ${inserted} inserted, ${skipped} skipped`
  );
}

async function main() {
  console.log('\n🚀 Starting Data Migration: Railway → Neon\n');
  console.log('Source: Railway PostgreSQL');
  console.log('Target: Neon PostgreSQL\n');

  const source = new Client({ connectionString: SOURCE_URL, ssl: { rejectUnauthorized: false } });
  const target = new Client({ connectionString: TARGET_URL, ssl: { rejectUnauthorized: false } });

  try {
    console.log('🔌 Connecting to source (Railway)...');
    await source.connect();
    console.log('✅ Connected to source\n');

    console.log('🔌 Connecting to target (Neon)...');
    await target.connect();
    console.log('✅ Connected to target\n');

    // Disable foreign key checks on target during migration
    await target.query('SET session_replication_role = replica;');

    console.log('📦 Migrating tables...\n');
    for (const table of TABLES_IN_ORDER) {
      await migrateTable(source, target, table);
    }

    // Re-enable foreign key checks
    await target.query('SET session_replication_role = DEFAULT;');

    console.log('\n✅ Migration complete!\n');
  } catch (err: any) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await source.end().catch(() => {});
    await target.end().catch(() => {});
  }
}

main();
