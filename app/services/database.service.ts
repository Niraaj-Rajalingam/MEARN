import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'mearn-app-db',
  host: 'mearn-database', // needs to be the same as the docker container name
  port: 5432,
  database: 'postgres',
  max: 20, // max number of connections
  idleTimeoutMillis: 30000, // max idle time
  connectionTimeoutMillis: 2000, // connection timeout
});

export const poolQuery = async (
  queryString: string,
): Promise<any[] | undefined> => {
  try {
    const result = await pool.query(queryString);
    return result.rows;
  } catch (error) {
    console.log(`An error occurred when executing db query: \n${queryString}`);
    console.log(`${error}`);
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
    console.log(`${error}`);
  } finally {
    client.release();
  }
}
