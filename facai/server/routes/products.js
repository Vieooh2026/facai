import express from 'express';
import db from '../db/index.js';
import { getUserFromReq } from '../auth.js';

const router = express.Router();

function currentUser(req) {
  const p = getUserFromReq(req);
  if (!p) return null;
  return db.prepare('SELECT * FROM users WHERE id=?').get(p.id);
}

// 查看商品库（需登录）
router.get('/', (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: '未登录' });
  const list = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
  res.json({ products: list });
});

// 添加商品（需 can_add_product 权限）
router.post('/', (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: '未登录' });
  if (!u.is_active) return res.status(403).json({ error: '等待管理员开通' });
  if (!u.can_add_product) return res.status(403).json({ error: '你没有添加商品的权限' });
  const { name, unit, category } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: '商品名称必填' });
  const info = db.prepare(
    'INSERT INTO products (name,unit,category,created_at) VALUES (?,?,?,?)'
  ).run(name.trim(), unit || '件', category || null, new Date().toISOString());
  const p = db.prepare('SELECT * FROM products WHERE id=?').get(info.lastInsertRowid);
  res.json({ product: p });
});

// 删除商品（管理员）
router.delete('/:id', (req, res) => {
  const u = currentUser(req);
  if (!u || u.role !== 'admin') return res.status(403).json({ error: '仅管理员可删除商品' });
  db.prepare('DELETE FROM products WHERE id=?').run(Number(req.params.id));
  res.json({ ok: true });
});

export default router;
