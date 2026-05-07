const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err.message);
});

module.exports = pool;
