import { useEffect, useState } from 'react';
import { api } from '../api.js';

const RANGES = [{ k: 'day', l: '日' }, { k: 'week', l: '周' }, { k: 'month', l: '月' }, { k: 'year', l: '年' }];
const LABEL = { day: '每日', week: '每周', month: '每月', year: '每年' };

export default function DataAnalysis({ user, notify }) {
  const [range, setRange] = useState('day');
  const [points, setPoints] = useState([]);
  useEffect(() => {
    api.analysis(range).then((r) => setPoints(r.points || [])).catch((e) => notify(e.message));
  }, [range, notify]);
  const max = Math.max(1, ...points.map((p) => p.total || 0));
  const total = points.reduce((s, p) => s + (p.total || 0), 0);
  return (
    <div className="content">
      <div className="page-title"><span>数据分析</span>
        <span>
          {RANGES.map((r) => (
            <button key={r.k} className={`btn btn-sm ${range === r.k ? 'btn-primary' : 'btn-ghost'}`}
              style={{ marginLeft: 4 }} onClick={() => setRange(r.k)}>{r.l}</button>
          ))}
        </span>
      </div>
      <div className="card">
        <div className="card-h"><span>{LABEL[range]}发货量对比</span><span className="count">合计 {total} 件</span></div>
        {points.length === 0 && <div className="empty">暂无数据</div>}
        <div className="chart-bar">
          {points.map((p, i) => (
            <div className="b" key={i} style={{ height: (p.total / max * 100) + '%' }} title={`${p.grp}: ${p.total}`}>
              <span>{p.grp}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>区间</th><th className="num">总件数</th><th className="num">天数</th></tr></thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i}><td>{p.grp}</td><td className="num">{p.total}</td><td className="num">{p.days}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
