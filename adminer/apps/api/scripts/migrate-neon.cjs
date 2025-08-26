/*
  File: scripts/migrate-neon.cjs
  Runs SQL files in apps/api/src/db/migrations in lexicographic order.
  Ensures each file executes in its own transaction; dry-run supported.
*/
const fs = require('fs');
const path = require('path');
const { pool } = require('./_pg-client.cjs');

const MIGRATIONS_DIR = path.resolve('src/db/migrations');
const DRY = process.argv.includes('--dry-run');

(async () => {
  try {
    if (!fs.existsSync(MIGRATIONS_DIR)) throw new Error(`Migrations dir missing: ${MIGRATIONS_DIR}`);
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`▶ Found ${files.length} SQL migration(s)`);

    const client = await pool.connect();

    // simple bookkeeping table
    await client.query(`
      create table if not exists _migrations (
        id serial primary key,
        filename text not null unique,
        executed_at timestamptz not null default now()
      );
    `);

    const ran = new Set((await client.query('select filename from _migrations')).rows.map(r => r.filename));

    for (const file of files) {
      if (ran.has(file)) { console.log(`✔ Skip (already ran): ${file}`); continue; }
      const full = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(full, 'utf8');

      console.log(`\n🚚 Applying: ${file}${DRY ? ' (dry-run)' : ''}`);
      if (DRY) { console.log(sql.slice(0, 4000)); continue; }

      try {
        await client.query('begin');
        await client.query(sql);
        await client.query('insert into _migrations(filename) values($1)', [file]);
        await client.query('commit');
        console.log(`✅ Applied: ${file}`);
      } catch (e) {
        await client.query('rollback');
        console.error(`❌ Failed: ${file} ->`, e.message);
        process.exit(1);
      }
    }

    client.release();
    await pool.end();
    console.log('\n🎉 All migrations up to date.');
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    process.exit(1);
  }
})(); 