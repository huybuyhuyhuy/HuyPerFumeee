import 'dotenv/config';

const dbPort = process.env.DB_PORT?.trim() ? Number(process.env.DB_PORT) : null;

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort,
  dbName: process.env.DB_NAME || 'huyperfume',
  dbUser: process.env.DB_USER || '',
  dbPassword: process.env.DB_PASSWORD || '',
  dbDriver: process.env.DB_DRIVER || 'ODBC Driver 18 for SQL Server',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpirationMs: Number(process.env.JWT_EXPIRATION_MS || 86400000),
};
