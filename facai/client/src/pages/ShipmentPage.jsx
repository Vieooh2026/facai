import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const DOUYIN = [
  { key: 'dj_4jin', label: '牛皮豆干4斤' },
  { key: 'dj_10zhang', label: '牛皮豆干10张' },
  { key: 'dj_paopao', label: '泡泡豆干' },
  { key: 'dj_other', label: '其他' }
];
const CHANNELS = [
  { key: 'wechat', label: '微信' },
  { key: 'taobao', label: '淘宝' },
  { key: 'xhs', label: '小红书' }
];

function emptyModel() {
  return {
    douyin: { dj_4jin: [], dj_10zhang: [], dj_paopao: [], dj_other: [] },
    channels: { wechat: [], taobao: [], xhs: [] },
    self: [],
    factory: [],
    carry: []
  };
}

function buildModel(items) {
  const m = emptyModel();
  const selfGroups = {}, factoryGroups = {}, carryGroups = {};
  for (const it of items || []) {
    if (it.category === 'douyin') {
      (m.douyin[it.sub_type] || (m.douyin[it.sub_type] = [])).push({
        product_name: it.product_name, multiple: it.multiple, quantity: it.quantity
      });
    } else if (['wechat', 'taobao', 'xhs'].includes(it.category)) {
      m.channels[it.category].push({
        product_name: it.product_name, multiple: it.multiple, quantity: it.quantity
      });
    } else if (it.category === 'self' || it.category === 'factory') {
      const map = it.category === 'self' ? selfGroups : factoryGroups;
      if (!map[it.group_index]) map[it.group_index] = { customer_name: it.customer_name, receive_info: it.receive_info, items: [] };
      map[it.group_index].items.push({
        product_name: it.product_name, quantity: it.quantity, pieces: it.pieces, unit: it.unit, remark: it.remark
      });
    } else if (it.category === 'carry') {
      if (!carryGroups[it.group_index]) carryGroups[it.group_index] = { customer_name: it.customer_name, items: [] };
      carryGroups[it.group_index].items.push({
        product_name: it.product_name, quantity: it.quantity, unit: it.unit
      });
    }
  }
  m.self = Object.values(selfGroups);
  m.factory = Object.values(factoryGroups);
  m.carry = Object.values(carryGroups);
  return m;
}

function flatten(model) {
  const out = [];
  for (const [sub, rows] of Object.entries(model.douyin))
    for (const r of rows) out.push({ category: 'douyin', sub_type: sub, product_name: r.product_name, multiple: r.multiple ?? 1, quantity: Number(r.quantity) || 0 });
  for (const [ch, rows] of Object.entries(model.channels))
    for (const r of rows) out.push({ category: ch, product_name: r.product_name, multiple: r.multiple ?? 1, quantity: Number(r.quantity) || 0 });
  const priv = (kind) => model[kind].forEach((c, i) => c.items.forEach((it) => out.push({
    category: kind, customer_name: c.customer_name, receive_info: c.receive_info, group_index: i,
    product_name: it.product_name, quantity: Number(it.quantity) || 0, pieces: Number(it.pieces) || 0, unit: it.unit || '件', remark: it.remark
  })));
  priv('self'); priv('factory');
  model.carry.forEach((c, i) => c.items.forEach((it) => out.push({
    category: 'carry', customer_name: c.customer_name, group_index: i,
    product_name: it.product_name, quantity: Number(it.quantity) || 0, unit: it.unit || '件'
  })));
  return out;
}

const sumQty = (arr) => arr.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
const sumPcs = (arr) => arr.reduce((s, r) => s + (Number(r.pieces) || 0), 0);

const TITLES = { today: '今日发货', tomorrow: '明日发货', history: '历史发货' };

export default function ShipmentPage({ mode, user, notify }) {
  const [model, setModel] = useState(emptyModel());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [products, setProducts] = useState([]);
  const [libOpen, setLibOpen] = useState(false);
  const [libTarget, setLibTarget] = useState(null);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('件');
  const canEdit = mode !== 'history' && !!user.can_edit_today;
  const canManage = !!user.can_add_product;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (mode === 'today') { await api.roll(); data = await api.today(date); }
      else if (mode === 'tomorrow') data = await api.tomorrow(date);
      else data = await api.history(date);
      setModel(buildModel(data.items || []));
    } catch (e) { notify(e.message); } finally { setLoading(false); }
  }, [mode, date, notify]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.products().then((r) => setProducts(r.products || [])).catch(() => {}); }, []);

  async function save() {
    if (!canEdit) return;
    setSaving(true);
    try {
      const items = flatten(model);
      if (mode === 'tomorrow') await api.saveTomorrow({ date, items });
      else await api.saveToday({ date, items });
      notify('保存成功，已同步给所有伙伴 🔔');
    } catch (e) { notify(e.message); } finally { setSaving(false); }
  }

  function openLib(target) { setLibTarget(target); setLibOpen(true); }
  function applyProduct(p) {
    const t = libTarget;
    if (!t) return;
    if (t.kind === 'douyin') updateDouyin(t.sub, t.i, 'product_name', p.name);
    else if (t.kind === 'channel') updateChannel(t.ch, t.i, 'product_name', p.name);
    else if (t.kind === 'cust') { updateCustItem(t.kind2, t.ci, t.ii, 'product_name', p.name); updateCustItem(t.kind2, t.ci, t.ii, 'unit', p.unit); }
    setLibOpen(false);
  }
  async function addProduct() {
    if (!newName.trim()) return;
    try {
      const r = await api.addProduct({ name: newName.trim(), unit: newUnit });
      setProducts((ps) => [r.product, ...ps]); setNewName(''); notify('已加入商品库');
    } catch (e) { notify(e.message); }
  }
  async function delProduct(id) {
    try { await api.delProduct(id); setProducts((ps) => ps.filter((x) => x.id !== id)); }
    catch (e) { notify(e.message); }
  }

  function updateDouyin(sub, i, field, val) {
    setModel((m) => {
      const next = { ...m, douyin: { ...m.douyin } };
      const arr = [...next.douyin[sub]];
      if (field === '__del') arr.splice(i, 1);
      else arr[i] = { ...arr[i], [field]: val };
      next.douyin[sub] = arr; return next;
    });
  }
  function updateChannel(ch, i, field, val) {
    setModel((m) => {
      const next = { ...m, channels: { ...m.channels } };
      const arr = [...next.channels[ch]];
      if (field === '__del') arr.splice(i, 1);
      else arr[i] = { ...arr[i], [field]: val };
      next.channels[ch] = arr; return next;
    });
  }
  function updateCustomer(kind, ci, field, val) {
    setModel((m) => ({ ...m, [kind]: m[kind].map((c, idx) => idx === ci ? { ...c, [field]: val } : c) }));
  }
  function updateCustItem(kind, ci, ii, field, val) {
    setModel((m) => ({ ...m, [kind]: m[kind].map((c, idx) => idx === ci ? { ...c, items: c.items.map((it, j) => j === ii ? { ...it, [field]: val } : it) } : c) }));
  }
  function addCustomer(kind) { setModel((m) => ({ ...m, [kind]: [...m[kind], { customer_name: '', receive_info: '', items: [{ product_name: '', quantity: 0, pieces: 0, unit: '件', remark: '' }] }] })); }
  function delCustomer(kind, ci) { setModel((m) => ({ ...m, [kind]: m[kind].filter((_, idx) => idx !== ci) })); }
  function addCustItem(kind, ci) { setModel((m) => ({ ...m, [kind]: m[kind].map((c, idx) => idx === ci ? { ...c, items: [...c.items, { product_name: '', quantity: 0, pieces: 0, unit: '件', remark: '' }] } : c) })); }
  function delCustItem(kind, ci, ii) { setModel((m) => ({ ...m, [kind]: m[kind].map((c, idx) => idx === ci ? { ...c, items: c.items.filter((_, j) => j !== ii) } : c) })); }

  function SimpleSection({ title, rows, onChange, onAdd, onPick }) {
    return (
      <div className="card">
        <div className="card-h"><span>【{title}】</span><span className="count">共 {sumQty(rows)} 件</span></div>
        {rows.length === 0 && <div className="empty">暂无数据</div>}
        {rows.map((r, i) => (
          <div className="row" key={i}>
            <input list="prod-list" placeholder="商品名称" value={r.product_name || ''} disabled={!canEdit}
              onChange={(e) => onChange(i, 'product_name', e.target.value)} />
            {canEdit && onPick && <button className="btn btn-ghost btn-sm ico-btn" onClick={() => onPick({ kind: 'douyin', sub: title, i })}>📚</button>}
            <input className="inline-input" type="number" placeholder="倍数" value={r.multiple ?? 1} disabled={!canEdit}
              onChange={(e) => onChange(i, 'multiple', e.target.value)} />
            <input className="inline-input" style={{ width: 64 }} type="number" placeholder="件数" value={r.quantity || 0} disabled={!canEdit}
              onChange={(e) => onChange(i, 'quantity', e.target.value)} />
            {canEdit && <button className="btn btn-ghost btn-sm ico-btn" onClick={() => onChange(i, '__del')}>✕</button>}
          </div>
        ))}
        {canEdit && <span className="add-line" onClick={onAdd}>＋ 添加一行</span>}
      </div>
    );
  }

  function CustomerCard({ kind, c, ci }) {
    const total = sumPcs(c.items);
    const canViewReceive = !!user.can_view_receive;
    return (
      <div className="card">
        <div className="sub-h">
          <span>① {c.customer_name || '（未填客户名）'}</span>
          {canEdit && canViewReceive && <span className="copy-btn" onClick={() => navigator.clipboard.writeText(c.receive_info || '')}>复制收货信息</span>}
        </div>
        {canEdit && <input placeholder="客户名称" value={c.customer_name || ''} onChange={(e) => updateCustomer(kind, ci, 'customer_name', e.target.value)} style={{ marginBottom: 6 }} />}
        {canViewReceive && (
          canEdit
            ? <textarea placeholder="客户收货信息（可复制）" value={c.receive_info || ''} onChange={(e) => updateCustomer(kind, ci, 'receive_info', e.target.value)} rows={2} style={{ marginBottom: 6 }} />
            : (c.receive_info
                ? <div className="receive-box">{c.receive_info}</div>
                : <div className="mini" style={{ marginBottom: 6 }}>（未填写收货信息）</div>)
        )}
        {!canViewReceive && <div className="mini locked-receive" style={{ marginBottom: 6 }}>🔒 收货信息已隐藏（无查看权限）</div>}
        <table className="tbl">
          <thead><tr><th>商品名称</th><th>数量</th><th>单位</th><th>件数</th><th>备注</th><th></th></tr></thead>
          <tbody>
            {c.items.map((it, ii) => (
              <tr key={ii}>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input list="prod-list" disabled={!canEdit} value={it.product_name || ''} onChange={(e) => updateCustItem(kind, ci, ii, 'product_name', e.target.value)} />
                    {canEdit && <button className="btn btn-ghost btn-sm" onClick={() => openLib({ kind: 'cust', kind2: kind, ci, ii })}>📚</button>}
                  </div>
                </td>
                <td><input className="inline-input" type="number" disabled={!canEdit} value={it.quantity || 0} onChange={(e) => updateCustItem(kind, ci, ii, 'quantity', e.target.value)} /></td>
                <td><input className="inline-input" style={{ width: 48 }} disabled={!canEdit} value={it.unit || '件'} onChange={(e) => updateCustItem(kind, ci, ii, 'unit', e.target.value)} /></td>
                <td><input className="inline-input" type="number" disabled={!canEdit} value={it.pieces || 0} onChange={(e) => updateCustItem(kind, ci, ii, 'pieces', e.target.value)} /></td>
                <td><input disabled={!canEdit} value={it.remark || ''} onChange={(e) => updateCustItem(kind, ci, ii, 'remark', e.target.value)} /></td>
                {canEdit && <td><button className="btn btn-ghost btn-sm" onClick={() => delCustItem(kind, ci, ii)}>✕</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {canEdit && <span className="add-line" onClick={() => addCustItem(kind, ci)}>＋ 添加商品</span>}
        <div className="sub-h" style={{ marginTop: 6 }}><span className="mini">本客户件数</span><span className="cnt">{total} 件</span></div>
        {canEdit && <button className="btn btn-ghost btn-sm btn-block" onClick={() => delCustomer(kind, ci)}>删除该客户</button>}
      </div>
    );
  }

  // 带货/送货/自提：客户名称 + 商品名称 + 数量 + 单位（无件数拆分、无收货信息）
  function CarryCard({ kind, c, ci }) {
    const total = sumQty(c.items);
    return (
      <div className="card">
        <div className="sub-h">
          <span>① {c.customer_name || '（未填客户名）'}</span>
        </div>
        {canEdit && <input placeholder="客户名称" value={c.customer_name || ''} onChange={(e) => updateCustomer(kind, ci, 'customer_name', e.target.value)} style={{ marginBottom: 6 }} />}
        <table className="tbl">
          <thead><tr><th>商品名称</th><th>数量</th><th>单位</th><th></th></tr></thead>
          <tbody>
            {c.items.map((it, ii) => (
              <tr key={ii}>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input list="prod-list" disabled={!canEdit} value={it.product_name || ''} onChange={(e) => updateCustItem(kind, ci, ii, 'product_name', e.target.value)} />
                    {canEdit && <button className="btn btn-ghost btn-sm" onClick={() => openLib({ kind: 'cust', kind2: kind, ci, ii })}>📚</button>}
                  </div>
                </td>
                <td><input className="inline-input" type="number" disabled={!canEdit} value={it.quantity || 0} onChange={(e) => updateCustItem(kind, ci, ii, 'quantity', e.target.value)} /></td>
                <td><input className="inline-input" style={{ width: 48 }} disabled={!canEdit} value={it.unit || '件'} onChange={(e) => updateCustItem(kind, ci, ii, 'unit', e.target.value)} /></td>
                {canEdit && <td><button className="btn btn-ghost btn-sm" onClick={() => delCustItem(kind, ci, ii)}>✕</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {canEdit && <span className="add-line" onClick={() => addCustItem(kind, ci)}>＋ 添加商品</span>}
        <div className="sub-h" style={{ marginTop: 6 }}><span className="mini">本单数量</span><span className="cnt">{total} 件</span></div>
        {canEdit && <button className="btn btn-ghost btn-sm btn-block" onClick={() => delCustomer(kind, ci)}>删除该客户</button>}
      </div>
    );
  }

  if (loading) return <div className="content"><div className="empty">加载中…</div></div>;

  return (
    <div className="content">
      <div className="page-title">
        <span>{TITLES[mode]}</span>
        {mode === 'history'
          ? <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          : <span className="date">{date}{mode === 'tomorrow' ? '（填写明天的）' : ''}</span>}
      </div>

      <div className="page-toolbar">
        <button className="btn btn-ghost btn-sm" onClick={() => openLib(null)}>📚 商品库</button>
        <span className="mini">点商品名旁的 📚 可从商品库快速选品</span>
      </div>

      <div className="card">
        <div className="card-h"><span>📱 抖音发货</span></div>
        {DOUYIN.map((d) => (
          <SimpleSection key={d.key} title={d.label} rows={model.douyin[d.key]}
            onChange={(i, f, v) => updateDouyin(d.key, i, f, v)}
            onPick={(t) => openLib({ kind: 'douyin', sub: d.key, i: t.i })}
            onAdd={() => setModel((m) => ({ ...m, douyin: { ...m.douyin, [d.key]: [...m.douyin[d.key], { product_name: '', multiple: 1, quantity: 0 }] } }))} />
        ))}
      </div>

      <div className="card">
        <div className="card-h"><span>🛒 非抖音发货</span></div>
        {CHANNELS.map((c) => (
          <SimpleSection key={c.key} title={c.label} rows={model.channels[c.key]}
            onChange={(i, f, v) => updateChannel(c.key, i, f, v)}
            onPick={(t) => openLib({ kind: 'channel', ch: c.key, i: t.i })}
            onAdd={() => setModel((m) => ({ ...m, channels: { ...m.channels, [c.key]: [...m.channels[c.key], { product_name: '', multiple: 1, quantity: 0 }] } }))} />
        ))}
      </div>

      <div className="card">
        <div className="card-h"><span>🏠 私域自发货</span><span className="count">共 {model.self.length} 单 {sumPcs(model.self.flatMap((c) => c.items))} 件</span></div>
        {model.self.length === 0 && <div className="empty">暂无客户</div>}
        {model.self.map((c, ci) => <CustomerCard key={ci} kind="self" c={c} ci={ci} />)}
        {canEdit && <button className="btn btn-gold btn-sm btn-block" onClick={() => addCustomer('self')}>＋ 添加客户</button>}
      </div>

      <div className="card">
        <div className="card-h"><span>🏭 私域厂发货</span><span className="count">共 {model.factory.length} 单</span></div>
        {model.factory.length === 0 && <div className="empty">暂无客户</div>}
        {model.factory.map((c, ci) => <CustomerCard key={ci} kind="factory" c={c} ci={ci} />)}
        {canEdit && <button className="btn btn-gold btn-sm btn-block" onClick={() => addCustomer('factory')}>＋ 添加客户</button>}
      </div>

      <div className="card">
        <div className="card-h"><span>🚚 带货/送货/自提</span><span className="count">共 {model.carry.length} 单 {sumQty(model.carry.flatMap((c) => c.items))} 件</span></div>
        {model.carry.length === 0 && <div className="empty">暂无客户</div>}
        {model.carry.map((c, ci) => <CarryCard key={ci} kind="carry" c={c} ci={ci} />)}
        {canEdit && <button className="btn btn-gold btn-sm btn-block" onClick={() => addCustomer('carry')}>＋ 添加客户</button>}
      </div>

      {canEdit && (
        <button className="btn btn-primary btn-block" onClick={save} disabled={saving}>
          {saving ? '保存中…' : '保存并同步给所有伙伴'}
        </button>
      )}
      {!canEdit && mode !== 'history' && (
        <div className="locked"><div className="big">🔒</div>你没有修改今日发货的权限，内容只读。</div>
      )}

      <datalist id="prod-list">
        {products.map((p) => <option key={p.id} value={p.name} />)}
      </datalist>

      {libOpen && (
        <div className="lib-mask" onClick={() => setLibOpen(false)}>
          <div className="lib-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lib-h">📚 商品库 {libTarget && <span className="mini">（点选填入）</span>}</div>
            <div className="lib-list">
              {products.length === 0 && <div className="empty">暂无商品，请在下方添加</div>}
              {products.map((p) => (
                <div className="lib-item" key={p.id} onClick={() => libTarget && applyProduct(p)}>
                  <span>{p.name} <span className="mini">{p.unit}</span></span>
                  {!libTarget && canManage && (
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); delProduct(p.id); }}>删除</button>
                  )}
                </div>
              ))}
            </div>
            {canManage && (
              <div className="lib-add">
                <input placeholder="商品名称" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <input className="inline-input" placeholder="单位" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
                <button className="btn btn-primary btn-sm" onClick={addProduct}>添加</button>
              </div>
            )}
            <button className="btn btn-ghost btn-block" onClick={() => setLibOpen(false)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
