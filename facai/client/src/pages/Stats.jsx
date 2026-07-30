import { useEffect, useState } from 'react';
import { api } from '../api.js';

function catLabel(c, sub) {
  const map = { douyin: '抖音', wechat: '微信', taobao: '淘宝', xhs: '小红书', self: '私域自', factory: '私域厂' };
  if (c === 'douyin') {
    const s = { dj_4jin: '4斤', dj_10zhang: '10张', dj_paopao: '泡泡', dj_other: '其他' };
    return '抖音·' + (s[sub] || sub);
  }
  return map[c] || c;
}

export default function Stats({ user, notify }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.stats(month).then((r) => setRows(r.rows || [])).catch((e) => notify(e.message));
  }, [month, notify]);
  const total = rows.reduce((s, r) => s + (r.total || 0), 0);
  return (
    <div className="content">
      <div className="page-title"><span>发货统计</span>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>
      <div className="card">
        <div className="card-h"><span>当月各商品发货数量</span><span className="count">合计 {total} 件</span></div>
        {rows.length === 0 && <div className="empty">本月暂无数据</div>}
        <table className="tbl">
          <thead><tr><th>商品</th><th>类别</th><th>单位</th><th className="num">数量</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.product_name || '（未命名）'}</td>
                <td>{catLabel(r.category, r.sub_type)}</td>
                <td>{r.unit}</td>
                <td className="num">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
