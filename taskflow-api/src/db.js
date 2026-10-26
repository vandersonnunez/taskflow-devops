import pg from 'pg';

const { Pool } = pg;

export function getPoolConfig(environment = process.env) {
  const useSsl = environment.PGSSL === 'true';

  const sslConfig = useSsl
    ? { ssl: { rejectUnauthorized: true } }
    : {};

  if (environment.DATABASE_URL) {
    return {
      connectionString: environment.DATABASE_URL,
      ...sslConfig,
    };
  }

  const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = environment;

  if (!PGHOST || !PGDATABASE || !PGUSER || PGPASSWORD === undefined) {
    throw new Error(
      'Set DATABASE_URL or PGHOST, PGDATABASE, PGUSER, and PGPASSWORD before starting the API'
    );
  }

  const port = Number.parseInt(environment.PGPORT ?? '5432', 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PGPORT must be a valid port number');
  }

  return {
    host: PGHOST,
    port,
    database: PGDATABASE,
    user: PGUSER,
    password: PGPASSWORD,
    ...sslConfig,
  };
}

export function createPool(environment = process.env) {
  return new Pool(getPoolConfig(environment));
}