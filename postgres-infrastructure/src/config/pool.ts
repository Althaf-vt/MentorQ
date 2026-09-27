export const poolConfig = {
  connectionLimit: parseInt(process.env.DB_POOL_SIZE || "10"),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
