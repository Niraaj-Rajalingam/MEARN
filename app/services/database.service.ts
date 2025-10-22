import { Pool } from 'pg';

export const createPool = (): Pool => {
  const pool = new Pool({
    user: 'postgres',
    password: 'mearn-app-db',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    max: 20, // max number of connections
    idleTimeoutMillis: 30000, // max idle time
    connectionTimeoutMillis: 2000, // connection timeout
  });

  return pool;
}

export const destroyPool = (pool: Pool) => {
  pool.end();
}
