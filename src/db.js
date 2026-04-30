const { Pool } = require('pg');

// Single pool, default size of 10 — deliberately naive
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err.message);
});

module.exports = pool;
