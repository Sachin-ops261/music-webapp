const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle unexpected errors without crashing
pool.on('error', (err) => {
  console.error('Database connection lost, will reconnect on next query:', err.message);
});

// Test connection without holding a client open
pool.query('SELECT 1')
  .then(() => console.log('PostgreSQL connected ✅'))
  .catch(err => console.error('PostgreSQL connection error:', err));

module.exports = pool;