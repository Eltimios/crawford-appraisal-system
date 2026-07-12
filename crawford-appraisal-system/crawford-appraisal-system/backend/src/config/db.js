const knex = require('knex');
const { types } = require('pg');
require('dotenv').config();

// node-postgres returns NUMERIC/DECIMAL columns as strings by default (to avoid
// float precision loss on huge values) — but every NUMERIC column in this schema
// is a small score/points field the frontend expects as a real number (e.g. calls
// .toFixed() on it). Parse them as floats globally instead of patching every call site.
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

// Prefer a single connection string (DATABASE_URL) if present — this is
// what most hosts (including cPanel's Postgres panel) expose directly.
// Falls back to discrete PG* vars if that's what's configured instead.
const connection = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : {
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    };

if (!process.env.DATABASE_URL && !process.env.PGHOST) {
  console.warn('Warning: Missing database environment variables. Check your .env file.');
}

const db = knex({
  client: 'pg',
  connection,
  pool: { min: 0, max: 10 },
});

module.exports = { db };
