import { useEffect, useState } from 'react';
import { api } from '../api.js';

const PERMS = [
  { k: 'can_edit_today', l: '修改今日发货' },
  { k: 'can_edit_other', l: '修改其他数据' },
  { k: 'can_add_product', l: '添加商品' },
  { k: 'can_view_customer', l: '查看客户资料' },
  { k: 'can_view_receive', l: '查看收货信息' }
];

export default function Partners({ user, notify }) {
  const [list, setList] = useState([]);
  const [me, setMe] = useState(user);
  const isAdmin = me.role === 'admin';
  useEffect(() => {
    api.partners().then((r) => { setList(r.partners || []); setMe(r.me || user); }).catch((e) => notify(e.message));
  }, [notify]);

  async function toggle(p, key) {
    if (!isAdmin) return;
    try {
      const r = await api.setPartner(p.id, { [key]: p[key] ? 0 : 1 });
      setList((l) => l.map((x) => (x.id === p.id ? r.user : x)));
      notify('权限已更新');
    } catch (e) { notify(e.message); }
  }
  async function activate(p, active) {
    try {
      const r = await api.setPartner(p.id, { is_active: active ? 1 : 0 });
      setList((l) => l.map((x) => (x.id === p.id ? r.user : x)));
      notify(active ? '已开通伙伴' : '已停用伙伴');
    } catch (e) { notify(e.message); }
  }

  return (
    <div className="content">
      <div className="page-title"><span>发财伙伴</span><span className="date">{list.length} 人</span></div>
      {!isAdmin && <div className="card mini">你是伙伴，权限由管理员统一设置。以下为团队成员一览。</div>}
      {list.map((p) => (
        <div className="card" key={p.id}>
          <div className="row" style={{ alignItems: 'center' }}>
            <div style={{ flex: '0 0 auto', fontSize: 28 }}>{p.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{p.username} {p.role === 'admin' && <span className="badge tag-admin">管理员</span>}</div>
              <div className="mini">{p.zodiac} · {p.is_active ? '已开通' : '待开通'}</div>
            </div>
            {isAdmin && p.role !== 'admin' && (
              <button className={`btn btn-sm ${p.is_active ? 'btn-ghost' : 'btn-primary'}`} onClick={() => activate(p, !p.is_active)}>
                {p.is_active ? '停用' : '开通'}
              </button>
            )}
          </div>
          {isAdmin && p.role !== 'admin' && (
            <div style={{ marginTop: 8 }}>
              {PERMS.map((perm) => (
                <div className="toggle" key={perm.k}>
                  <span>{perm.l}</span>
                  <div className={`switch-ui ${p[perm.k] ? 'on' : ''}`} onClick={() => toggle(p, perm.k)} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
