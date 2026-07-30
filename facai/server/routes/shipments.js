import express from 'express';
import db from '../db/index.js';
import { getUserFromReq } from '../auth.js';
import { broadcast } from '../ws.js';

const router = express.Router();
const now = () => new Date().toISOString();
const todayStr = () => new Date().toISOString().slice(0, 10);

function currentUser(req) {
  const p = getUserFromReq(req);
  if (!p) return null;
  return db.prepare('SELECT * FROM users WHERE id=?').get(p.id);
}

// 未激活的伙伴只能看基础信息，不能看业务数据
function requireActive(req, res) {
  const u = currentUser(req);
  if (!u) { res.status(401).json({ error: '未登录' }); return null; }
  if (!u.is_active) { res.status(403).json({ error: '等待管理员开通权限', code: 'not_active' }); return null; }
  return u;
}

// 剥离客户隐私字段（按权限分别控制：客户资料、收货信息）
function sanitize(items, u) {
  if (u.can_view_customer && u.can_view_receive) return items;
  return items.map((it) => ({
    ...it,
    customer_name: (u.can_view_customer || !it.customer_name) ? it.customer_name : '***',
    receive_info: u.can_view_receive ? it.receive_info : ''
  }));
}

// 获取某天发货（今日或明日）
function fetchShipments(date, isTomorrow) {
  return db.prepare(
    'SELECT * FROM shipment_items WHERE date=? AND is_tomorrow=? ORDER BY id'
  ).all(date, isTomorrow ? 1 : 0);
}

// 保存（全量覆盖当天的该板块）
function saveShipments(req, res, isTomorrow) {
  const u = requireActive(req, res);
  if (!u) return;
  if (!u.can_edit_today)
    return res.status(403).json({ error: '你没有修改今日发货的权限' });
  const { date, items } = req.body || {};
  if (!date || !Array.isArray(items))
    return res.status(400).json({ error: '参数错误' });

  const tx = db.transaction(() => {
    // 先保留已有收货信息：无查看权限的人保存时不能把收货信息清空
    const prev = db.prepare(
      'SELECT category, group_index, receive_info FROM shipment_items WHERE date=? AND is_tomorrow=?'
    ).all(date, isTomorrow ? 1 : 0);
    const prevMap = {};
    for (const p of prev) if (p.receive_info) prevMap[p.category + '#' + p.group_index] = p.receive_info;

    db.prepare('DELETE FROM shipment_items WHERE date=? AND is_tomorrow=?')
      .run(date, isTomorrow ? 1 : 0);
    const ins = db.prepare(
      `INSERT INTO shipment_items
       (date,is_tomorrow,category,sub_type,product_name,multiple,quantity,pieces,unit,remark,customer_name,receive_info,group_index,author_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    );
    for (const it of items) {
      // 私域(自/厂)区分"数量"与"件数"；抖音/渠道以 quantity 作为件数
      const isPrivate = it.category === 'self' || it.category === 'factory';
      const pieces = isPrivate ? (Number(it.pieces) || 0) : (Number(it.quantity) || 0);
      // 无查看收货信息权限时，沿用库中已有收货信息，避免被清空
      let receive = it.receive_info || null;
      if (!u.can_view_receive && isPrivate) {
        receive = prevMap[it.category + '#' + (it.group_index ?? 0)] || null;
      }
      ins.run(
        date, isTomorrow ? 1 : 0,
        it.category, it.sub_type || null, it.product_name || null,
        it.multiple ?? 1, Number(it.quantity) || 0, pieces, it.unit || '件',
        it.remark || null, it.customer_name || null, receive,
        it.group_index ?? 0, u.id, now(), now()
      );
    }
  });
  tx();
  const result = fetchShipments(date, isTomorrow);
  broadcast('shipments-updated', { date, isTomorrow, by: u.username });
  res.json({ ok: true, items: sanitize(result, u) });
}

// 明日自动转今日
router.post('/roll', (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: '未登录' });
  const t = todayStr();
  const r = db.prepare(
    "UPDATE shipment_items SET is_tomorrow=0, updated_At=? WHERE is_tomorrow=1 AND date<=?"
  ).run(now(), t);
  if (r.changes > 0) broadcast('shipments-updated', { date: t, rolled: true });
  res.json({ ok: true, changed: r.changes });
});

router.get('/today', (req, res) => {
  const u = requireActive(req, res);
  if (!u) return;
  const date = req.query.date || todayStr();
  const items = fetchShipments(date, false);
  res.json({ date, items: sanitize(items, u) });
});

router.post('/today', (req, res) => saveShipments(req, res, false));

router.get('/tomorrow', (req, res) => {
  const u = requireActive(req, res);
  if (!u) return;
  const date = req.query.date || todayStr();
  const items = fetchShipments(date, true);
  res.json({ date, items: sanitize(items, u) });
});

router.post('/tomorrow', (req, res) => saveShipments(req, res, true));

router.get('/history', (req, res) => {
  const u = requireActive(req, res);
  if (!u) return;
  const date = req.query.date || todayStr();
  const items = fetchShipments(date, false);
  res.json({ date, items: sanitize(items, u) });
});

router.get('/history-dates', (req, res) => {
  const u = requireActive(req, res);
  if (!u) return;
  const rows = db.prepare(
    'SELECT DISTINCT date FROM shipment_items WHERE is_tomorrow=0 ORDER BY date DESC'
  ).all();
  res.json({ dates: rows.map((r) => r.date) });
});

// 当月各商品发货数量统计
router.get('/stats/monthly', (req, res) => {
  const u = requireActive(req, res);
  if (!u) return;
  const month = (req.query.month || todayStr().slice(0, 7)) + '%';
  const rows = db.prepare(
    `SELECT category, sub_type, product_name, unit, SUM(pieces) total
     FROM shipment_items WHERE is_tomorrow=0 AND date LIKE ?
     GROUP BY category, sub_type, product_name, unit
     ORDER BY total DESC`
  ).all(month);
  res.json({ rows });
});

// 私域客户排名（当月发货次数与商品数量）
router.get('/customers/monthly', (req, res) => {
  const u = requireActive(req, res);
  if (!u) return;
  const month = (req.query.month || todayStr().slice(0, 7)) + '%';
  const rows = db.prepare(
    `SELECT customer_name,
            COUNT(DISTINCT date || '-' || group_index) orders,
            SUM(pieces) total_qty,
            COUNT(DISTINCT date) days
     FROM shipment_items
     WHERE is_tomorrow=0 AND date LIKE ? AND customer_name IS NOT NULL AND customer_name <> ''
     GROUP BY customer_name
     ORDER BY total_qty DESC`
  ).all(month);
  const hide = !u.can_view_customer;
  res.json({
    rows: rows.map((r) => ({
      ...r,
      customer_name: hide ? '***' : r.customer_name
    }))
  });
});

// 数据分析：日/周/月/年 对比
router.get('/analysis', (req, res) => {
  const u = requireActive(req, res);
  if (!u) return;
  const range = req.query.range || 'day';
  let fmt, limit = 30;
  if (range === 'week') { fmt = '%Y-W%W'; limit = 12; }
  else if (range === 'month') { fmt = '%Y-%m'; limit = 12; }
  else if (range === 'year') { fmt = '%Y'; limit = 6; }
  else { fmt = '%Y-%m-%d'; limit = 30; }
  const rows = db.prepare(
    `SELECT strftime('${fmt}', date) grp, SUM(pieces) total, COUNT(DISTINCT date) days
     FROM shipment_items WHERE is_tomorrow=0
     GROUP BY grp ORDER BY grp DESC LIMIT ?`
  ).all(limit);
  rows.reverse();
  res.json({ range, points: rows });
});

export default router;
