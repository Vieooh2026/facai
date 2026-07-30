const MODULES = [
  { key: 'today', ico: '📦', label: '今日发货' },
  { key: 'tomorrow', ico: '📅', label: '明日发货' },
  { key: 'history', ico: '📜', label: '历史发货' },
  { key: 'stats', ico: '📊', label: '发货统计' },
  { key: 'customers', ico: '👥', label: '客户分析' },
  { key: 'analysis', ico: '📈', label: '数据分析' },
  { key: 'partners', ico: '🤝', label: '发财伙伴' }
];

export default function SideNav({ open, active, onNav, onClose, user }) {
  return (
    <>
      {/* 移动端遮罩 */}
      {open && <div className="mask" onClick={onClose} />}

      {/* 左侧导航栏 */}
      <div className={`sidenav ${open ? 'open' : ''}`}>
        {/* 用户头像 */}
        <div className="nav-avatar">{user.avatar || '🧑'}</div>
        <div className="nav-user-name">{user.username}</div>

        {/* 导航项 */}
        {MODULES.map((m) => (
          <div
            key={m.key}
            className={`nav-item ${active === m.key ? 'active' : ''}`}
            onClick={() => onNav(m.key)}
            title={m.label}
          >
            <span className="ico">{m.ico}</span>
            <span className="nav-label">{m.label}</span>
          </div>
        ))}

        {/* 底部信息 */}
        <div className="nav-foot">
          发财致富 v1.0
        </div>
      </div>
    </>
  );
}
