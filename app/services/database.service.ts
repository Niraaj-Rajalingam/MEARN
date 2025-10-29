import { Pool } from 'pg';

export const pool = new Pool({
  user: 'postgres',
  password: process.env.NODE_ENV === 'test'
    ? 'mearn-app-db-test'
    : 'mearn-app-db',
  host: process.env.NODE_ENV === 'test' 
    ? 'localhost' 
    : 'mearn-database',
  port: process.env.NODE_ENV === 'test'
    ? 5433
    : 5432,
  database: 'postgres',
  max: 20, // max number of connections
  idleTimeoutMillis: 30000, // max idle time
  connectionTimeoutMillis: 2000, // connection timeout
});

export const poolQuery = async (
  queryString: string,
  params?: any[]
): Promise<any[] | undefined> => {
  try {
    const result = await pool.query(queryString, params);
    return result.rows;
  } catch (error) {
    console.log(`An error occurred when executing db query: \n${queryString}`);
    console.log(error);
    throw 'A database error occurred';
  }
}

/** Use this instead of poolQuery if you need to use transactions. */
export const poolClientQuery = async (
  queryString: string,
): Promise<any[] | undefined> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    const result = await client.query(queryString);
    await client.query('COMMIT;');

    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK;');
    console.log(`An error occurred when executing db query: \n${queryString}`);
    console.log(error);
    throw 'A database error occurred';
  } finally {
    client.release();
  }
}
