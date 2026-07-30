import express from 'express';
import db from '../db/index.js';
import { hashPassword, verifyPassword, signToken, getUserFromReq } from '../auth.js';
import { getFortune, SIGNS } from '../fortune.js';
import { broadcast } from '../ws.js';

const router = express.Router();

function now() { return new Date().toISOString(); }

function publicUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

function currentUser(req) {
  const p = getUserFromReq(req);
  if (!p) return null;
  return db.prepare('SELECT * FROM users WHERE id=?').get(p.id);
}

// 注册：首位注册者自动成为管理员并激活全部权限
router.post('/register', (req, res) => {
  const { username, password, avatar, zodiac } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' });
  if (db.prepare('SELECT id FROM users WHERE username=?').get(username))
    return res.status(409).json({ error: '该昵称已被占用' });

  const isFirst = db.prepare('SELECT COUNT(*) c FROM users').get().c === 0;
  const user = {
    username,
    password_hash: hashPassword(password),
    avatar: avatar || '🧑',
    zodiac: zodiac || '双子座',
    role: isFirst ? 'admin' : 'member',
    is_active: isFirst ? 1 : 0,
    can_edit_today: isFirst ? 1 : 0,
    can_edit_other: isFirst ? 1 : 0,
    can_add_product: isFirst ? 1 : 0,
    can_view_customer: isFirst ? 1 : 0,
    can_view_receive: isFirst ? 1 : 0,
    created_at: now()
  };
  const info = db.prepare(
    `INSERT INTO users (username,password_hash,avatar,zodiac,role,is_active,can_edit_today,can_edit_other,can_add_product,can_view_customer,can_view_receive,created_at)
     VALUES (@username,@password_hash,@avatar,@zodiac,@role,@is_active,@can_edit_today,@can_edit_other,@can_add_product,@can_view_customer,@can_view_receive,@created_at)`
  ).run(user);
  const full = db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
  res.json({ token: signToken(full), user: publicUser(full), isFirstAdmin: isFirst });
});

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!u || !verifyPassword(password, u.password_hash))
    return res.status(401).json({ error: '昵称或密码错误' });
  res.json({ token: signToken(u), user: publicUser(u) });
});

// 当前用户
router.get('/me', (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: '未登录' });
  res.json({ user: publicUser(u) });
});

// 伙伴列表（需登录）
router.get('/partners', (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: '未登录' });
  const list = db.prepare(
    'SELECT id,username,avatar,zodiac,role,is_active,can_edit_today,can_edit_other,can_add_product,can_view_customer,can_view_receive,created_at FROM users ORDER BY id'
  ).all();
  res.json({ partners: list, me: publicUser(u) });
});

// 管理员设置伙伴权限 / 激活
router.put('/partners/:id', (req, res) => {
  const me = currentUser(req);
  if (!me || me.role !== 'admin') return res.status(403).json({ error: '仅管理员可管理伙伴权限' });
  const id = Number(req.params.id);
  if (id === me.id) return res.status(400).json({ error: '不能修改自己的权限' });
  const { is_active, can_edit_today, can_edit_other, can_add_product, can_view_customer, can_view_receive } = req.body || {};
  const cur = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ error: '伙伴不存在' });
  db.prepare(
    `UPDATE users SET is_active=?, can_edit_today=?, can_edit_other=?, can_add_product=?, can_view_customer=?, can_view_receive=? WHERE id=?`
  ).run(
    is_active ?? cur.is_active,
    can_edit_today ?? cur.can_edit_today,
    can_edit_other ?? cur.can_edit_other,
    can_add_product ?? cur.can_add_product,
    can_view_customer ?? cur.can_view_customer,
    can_view_receive ?? cur.can_view_receive,
    id
  );
  const updated = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  broadcast('partner-updated', publicUser(updated));
  res.json({ user: publicUser(updated) });
});

// 星座运势
router.get('/fortune', (req, res) => {
  const { sign = '双子座', date = new Date().toISOString().slice(0, 10) } = req.query;
  res.json(getFortune(sign, date));
});

export default router;
