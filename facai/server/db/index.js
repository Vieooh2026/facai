import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../../facai.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT DEFAULT '🧑',
  zodiac TEXT DEFAULT '双子座',
  role TEXT NOT NULL DEFAULT 'member',
  is_active INTEGER NOT NULL DEFAULT 0,
  can_edit_today INTEGER DEFAULT 0,
  can_edit_other INTEGER DEFAULT 0,
  can_add_product INTEGER DEFAULT 0,
  can_view_customer INTEGER DEFAULT 0,
  can_view_receive INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shipment_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  is_tomorrow INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  sub_type TEXT,
  product_name TEXT,
  multiple REAL DEFAULT 1,
  quantity REAL DEFAULT 0,
  pieces REAL DEFAULT 0,
  unit TEXT DEFAULT '件',
  remark TEXT,
  customer_name TEXT,
  receive_info TEXT,
  group_index INTEGER DEFAULT 0,
  author_id INTEGER,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unit TEXT DEFAULT '件',
  category TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_ship_date ON shipment_items(date, is_tomorrow, category);
`);

// 兼容已存在的旧库（无 pieces 列时自动补列）
try { db.exec('ALTER TABLE shipment_items ADD COLUMN pieces REAL DEFAULT 0'); } catch (e) {}
// 兼容旧库（无 can_view_receive 列时自动补列）
try { db.exec('ALTER TABLE users ADD COLUMN can_view_receive INTEGER DEFAULT 0'); } catch (e) {}
// 兼容旧库：管理员默认可查看收货信息
try { db.exec("UPDATE users SET can_view_receive=1 WHERE role='admin' AND (can_view_receive IS NULL OR can_view_receive=0)"); } catch (e) {}

export default db;
