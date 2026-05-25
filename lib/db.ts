import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql = ((...args: any[]) => {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return (_sql as Function)(...args);
}) as ReturnType<typeof neon>;
