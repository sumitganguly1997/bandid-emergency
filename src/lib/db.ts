// Use the non-WASM (asm.js) build to avoid WASM file path issues in serverless
import initSqlJs from 'sql.js/dist/sql-asm.js';
import type { Database as SqlJsDatabase } from 'sql.js/dist/sql-asm.js';

let _db: SqlJsDatabase | null = null;
let _initPromise: Promise<SqlJsDatabase> | null = null;

async function initDb(): Promise<SqlJsDatabase> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const SQL = await initSqlJs();
    _db = new SQL.Database();

    _db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bands (
        id TEXT PRIMARY KEY,
        band_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS provisioned_bands (
        band_id TEXT PRIMARY KEY,
        secret TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        band_id TEXT UNIQUE NOT NULL,
        full_name TEXT DEFAULT '',
        emergency_contact TEXT DEFAULT '',
        city_country TEXT DEFAULT '',
        blood_group TEXT DEFAULT 'O+',
        emergency_note TEXT DEFAULT '',
        photo_url TEXT DEFAULT '',
        full_name_public INTEGER DEFAULT 1,
        emergency_contact_public INTEGER DEFAULT 1,
        city_country_public INTEGER DEFAULT 0,
        blood_group_public INTEGER DEFAULT 1,
        emergency_note_public INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (band_id) REFERENCES bands(band_id)
      );
    `);

    _db.run('PRAGMA foreign_keys = ON');

    // Seed provisioned bands
    const { SEED_BANDS } = await import('@/lib/seed-bands');
    for (const [bandId, secret] of SEED_BANDS) {
      _db.run(
        'INSERT OR IGNORE INTO provisioned_bands (band_id, secret) VALUES (?, ?)',
        [bandId, secret]
      );
    }

    return _db;
  })();

  return _initPromise;
}

// Compatibility layer that mimics the better-sqlite3 API
// so all existing route handlers work without changes.
interface Statement {
  get(...params: unknown[]): Record<string, unknown> | undefined;
  run(...params: unknown[]): { changes: number };
  all(...params: unknown[]): Record<string, unknown>[];
}

interface DbCompat {
  prepare(sql: string): Statement;
  exec(sql: string): void;
}

function createCompat(database: SqlJsDatabase): DbCompat {
  return {
    prepare(sql: string): Statement {
      return {
        get(...params: unknown[]) {
          const stmt = database.prepare(sql);
          stmt.bind(params as unknown[]);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row as Record<string, unknown>;
          }
          stmt.free();
          return undefined;
        },
        run(...params: unknown[]) {
          database.run(sql, params as unknown[]);
          const changesResult = database.exec('SELECT changes() as c');
          const changes = changesResult.length > 0 ? (changesResult[0].values[0][0] as number) : 0;
          return { changes };
        },
        all(...params: unknown[]) {
          const stmt = database.prepare(sql);
          stmt.bind(params as unknown[]);
          const results: Record<string, unknown>[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject() as Record<string, unknown>);
          }
          stmt.free();
          return results;
        },
      };
    },
    exec(sql: string) {
      database.run(sql);
    },
  };
}

// Since sql.js init is async but better-sqlite3 was sync,
// we use a proxy that lazily resolves. All API routes are async
// so we ensure the DB is initialized before any call.
let _compat: DbCompat | null = null;

export async function getDb(): Promise<DbCompat> {
  if (_compat) return _compat;
  const database = await initDb();
  _compat = createCompat(database);
  return _compat;
}

// For backward compat: a sync proxy that throws if DB isn't ready.
// Routes should use getDb() instead, but this keeps imports simple.
const db = new Proxy({} as DbCompat, {
  get(_target, prop: string) {
    if (!_compat) {
      throw new Error('Database not initialized. Call await getDb() first in your route handler.');
    }
    const val = _compat[prop as keyof DbCompat];
    if (typeof val === 'function') {
      return val.bind(_compat);
    }
    return val;
  },
});

export default db;
