import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function CustomerAnalysis({ user, notify }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.customers(month).then((r) => setRows(r.rows || [])).catch((e) => notify(e.message));
  }, [month, notify]);
  return (
    <div className="content">
      <div className="page-title"><span>客户分析</span>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>
      <div className="card">
        <div className="card-h"><span>私域客户当月排名</span><span className="count">{rows.length} 位</span></div>
        {rows.length === 0 && <div className="empty">暂无私域客户数据</div>}
        {rows.map((r, i) => (
          <div className="rank" key={i}>
            <div className={`no ${i < 3 ? 'top' : ''}`}>{i + 1}</div>
            <div className="info">
              <div className="nm">{r.customer_name}</div>
              <div className="sub">发货 {r.orders} 单 · 覆盖 {r.days} 天</div>
            </div>
            <div className="qty">{r.total_qty} 件</div>
          </div>
        ))}
      </div>
      {!user.can_view_customer && (
        <div className="locked"><div className="big">👁️</div>你暂无「查看客户资料」权限，客户名称已隐藏。</div>
      )}
    </div>
  );
}
