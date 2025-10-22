import { Pool } from 'pg';

export const pool = new Pool({
  user: 'postgres',
  password: 'mearn-app-db',
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  max: 20, // max number of connections
  idleTimeoutMillis: 30000, // max idle time
  connectionTimeoutMillis: 2000, // connection timeout
});

interface IPoolClientQueryParams {
  queryString: string;
  queryStringParams: (string | number | boolean)[]
}

export const poolClientQuery = async ({
  queryString,
  queryStringParams
}: IPoolClientQueryParams) => {
  const client = await pool.connect();
  try {
    const result = await client.query(queryString, queryStringParams);
    return result.rows;
  } catch (error) {
    console.log(`An error occurred when executing db query: 
      ${queryString}
      with params:
      ${queryStringParams}`);
  } finally {
    client.release();
  }
}
