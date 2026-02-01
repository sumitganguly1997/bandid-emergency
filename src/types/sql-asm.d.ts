declare module 'sql.js/dist/sql-asm.js' {
  import type { SqlJsStatic, Database } from 'sql.js';
  export type { Database };
  const initSqlJs: () => Promise<SqlJsStatic>;
  export default initSqlJs;
}
