/*
  File: scripts/_pg-client.cjs
  Shared PostgreSQL client for Neon database operations
  Forces SSL and remote TCP connections (no local sockets)
*/
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('❌ NEON_DATABASE_URL (or DATABASE_URL) not set in .env.local');
  process.exit(1);
}

// Force SSL and TCP host usage to avoid local socket fallback
const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

module.exports = { pool }; 