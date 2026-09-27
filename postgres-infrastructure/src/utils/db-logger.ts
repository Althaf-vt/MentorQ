export const logQuery = (query: string, duration: number) => {
  console.log(`[DB] ${query} - ${duration}ms`);
};
