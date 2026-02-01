import Database from 'better-sqlite3';
import path from 'path';

let _db: InstanceType<typeof Database> | null = null;

function getDb(): InstanceType<typeof Database> {
  if (!_db) {
    const dbPath = path.join(process.cwd(), 'bandid.db');
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.pragma('busy_timeout = 5000');

    _db.exec(`
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
  }
  return _db;
}

const db = new Proxy({} as InstanceType<typeof Database>, {
  get(_target, prop) {
    const instance = getDb();
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === 'function') {
      return val.bind(instance);
    }
    return val;
  },
});

export default db;
