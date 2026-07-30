import { useEffect, useState, useCallback } from 'react';
import { api, getToken, clearToken, wsUrl } from './api.js';
import TopBar from './components/TopBar.jsx';
import SideNav from './components/SideNav.jsx';
import Login from './pages/Login.jsx';
import ShipmentPage from './pages/ShipmentPage.jsx';
import Stats from './pages/Stats.jsx';
import CustomerAnalysis from './pages/CustomerAnalysis.jsx';
import DataAnalysis from './pages/DataAnalysis.jsx';
import Partners from './pages/Partners.jsx';
import { playCoinSound, playNotifySound } from './utils/sound.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [page, setPage] = useState('today');
  const [toasts, setToasts] = useState([]);
  const [todaySelfCount, setTodaySelfCount] = useState(0);

  // 计算「今日自发货」件数 = 抖音 + 非抖音 + 私域自发货
  const refreshTodayCount = useCallback(async () => {
    try {
      const d = await api.today(new Date().toISOString().slice(0, 10));
      const items = (d && d.items) || [];
      let total = 0;
      for (const it of items) {
        if (['douyin', 'wechat', 'taobao', 'xhs'].includes(it.category)) total += Number(it.quantity) || 0;
        else if (it.category === 'self') total += Number(it.pieces) || 0;
      }
      setTodaySelfCount(total);
    } catch (e) {}
  }, []);

  const notify = useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    // 每次通知都播放金币音效
    playCoinSound();
  }, []);

  useEffect(() => {
    const tk = getToken();
    if (tk) api.me().then((r) => setUser(r.user)).catch(() => clearToken());
  }, []);

  // 用户就绪后，刷新顶部「今日自发货」件数
  useEffect(() => {
    if (user) refreshTodayCount();
  }, [user, refreshTodayCount]);

  // WebSocket 实时消息 + 音效
  useEffect(() => {
    if (!user) return;
    let ws;
    try { ws = new WebSocket(wsUrl); } catch (e) { return; }
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m.type === 'shipments-updated') {
          notify(`📦 发货数据已更新（${m.payload.by || '伙伴'}）`);
          playNotifySound(); // 额外播放通知音
          refreshTodayCount(); // 刷新顶部「今日自发货」件数
        } else if (m.type === 'partner-updated') {
          notify(`🤝 伙伴权限已更新：${m.payload.username}`);
          playCoinSound();
        }
      } catch (e) {}
    };
    return () => ws && ws.close();
  }, [user, notify]);

  function logout() { clearToken(); setUser(null); }

  if (!user) return <Login onLogin={(u) => { setUser(u); setPage('today'); }} />;

  if (!user.is_active) {
    return (
      <div>
        <SideNav open={navOpen} active={page} onNav={(p) => { setPage(p); setNavOpen(false); }} onClose={() => setNavOpen(false)} user={user} />
        <div className="main-area">
          <TopBar user={user} todaySelfCount={todaySelfCount} onMenu={() => setNavOpen(true)} />
          <div className="logout-area">
            <button className="btn btn-ghost btn-sm" onClick={logout}>退出</button>
          </div>
          <div className="content">
            <div className="locked" style={{ paddingTop: 60 }}>
              <div className="big">⏳</div>
              <h3>等待管理员开通权限</h3>
              <p>你的账号已创建，等管理员在「🤝 发财伙伴」里为你开通后<br />即可查看和编辑数据。</p>
              <button className="btn btn-ghost" onClick={logout}>退出登录</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const go = (p) => { setPage(p); setNavOpen(false); };

  return (
    <div>
      {/* 左侧导航 */}
      <SideNav open={navOpen} active={page} onNav={go} onClose={() => setNavOpen(false)} user={user} />

      {/* 主内容区 */}
      <div className="main-area">
        {/* 顶部大卡片 */}
        <TopBar user={user} todaySelfCount={todaySelfCount} onMenu={() => setNavOpen(true)} />

        {/* 退出按钮 */}
        <div className="logout-area">
          <button className="btn btn-ghost btn-sm" onClick={logout}>退出</button>
        </div>

        {/* 页面内容 */}
        {page === 'today' && <ShipmentPage mode="today" user={user} notify={notify} />}
        {page === 'tomorrow' && <ShipmentPage mode="tomorrow" user={user} notify={notify} />}
        {page === 'history' && <ShipmentPage mode="history" user={user} notify={notify} />}
        {page === 'stats' && <Stats user={user} notify={notify} />}
        {page === 'customers' && <CustomerAnalysis user={user} notify={notify} />}
        {page === 'analysis' && <DataAnalysis user={user} notify={notify} />}
        {page === 'partners' && <Partners user={user} notify={notify} />}

        {/* Toast 提示 */}
        <div className="toast-wrap">
          {toasts.map((t) => <div className="toast" key={t.id}>{t.msg}</div>)}
        </div>
      </div>
    </div>
  );
}
