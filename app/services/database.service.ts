import { Pool } from 'pg';

const getPoolConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    // Use Neon connection string (recommended)
    if (process.env.POSTGRES_URL) {
      return {
        connectionString: process.env.POSTGRES_URL,
        ssl: true,
      };
    }
    // Fallback to individual env vars
    return {
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DATABASE || 'postgres',
      ssl: true,
    };
  } else if (env === 'test') {
    return {
      user: 'postgres',
      password: 'mearn-app-db-test',
      host: 'localhost',
      port: 5433,
      database: 'postgres',
    };
  } else {
    // development
    return {
      user: 'postgres',
      password: 'mearn-app-db',
      host: 'mearn-database',
      port: 5432,
      database: 'postgres',
    };
  }
};

export const pool = new Pool({
  ...getPoolConfig(),
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
  params?: any[]
): Promise<any[] | undefined> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    const result = await client.query(queryString, params);
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
