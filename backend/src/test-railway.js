const { Client } = require('pg');

const BASE = 'postgresql://postgres:XZoRrOdWRwLPkUPGMCgSjBTTWsOOTczI@gondola.proxy.rlwy.net:43926/railway';

async function tryConnect(config, label) {
  const c = new Client(config);
  try {
    await c.connect();
    console.log('SUCCESS:', label);
    const r = await c.query('SELECT tablename FROM pg_tables WHERE schemaname=\'public\' LIMIT 5');
    console.log('Tables found:', r.rows.map(r => r.tablename).join(', '));
    await c.end();
    return true;
  } catch(e) {
    console.log('FAILED:', label, '->', e.message);
    try { await c.end(); } catch {}
    return false;
  }
}

async function main() {
  await tryConnect({ connectionString: BASE, ssl: false }, 'No SSL');
  await tryConnect({ connectionString: BASE, ssl: { rejectUnauthorized: false } }, 'SSL rejectUnauthorized false');
  await tryConnect({ connectionString: BASE + '?sslmode=disable' }, 'sslmode disable');
  await tryConnect({
    host: 'gondola.proxy.rlwy.net',
    port: 43926,
    database: 'railway',
    user: 'postgres',
    password: 'XZoRrOdWRwLPkUPGMCgSjBTTWsOOTczI',
    ssl: false
  }, 'Direct params no SSL');
}

main();
