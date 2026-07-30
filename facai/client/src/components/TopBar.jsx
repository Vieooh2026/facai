import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { getDailyQuote } from '../data/quotes.js';

const GREETINGS = [
  '今天也要轻盈地完成目标',
  '每一单都是通往财富的一步',
  '发货不停，好运不停',
  '稳扎稳打，日积月累',
  '团队齐心，发货顺心',
  '忙碌的日子最充实',
];

function getGreeting(name) {
  const hour = new Date().getHours();
  let prefix;
  if (hour < 6) prefix = '夜深了';
  else if (hour < 9) prefix = '早上好';
  else if (hour < 12) prefix = '上午好';
  else if (hour < 14) prefix = '中午好';
  else if (hour < 18) prefix = '下午好';
  else if (hour < 22) prefix = '晚上好';
  else prefix = '夜深了';

  const idx = Math.abs(name.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)) % GREETINGS.length;
  return `${name}，${prefix}！${GREETINGS[idx]}`;
}

export default function TopBar({ user, todaySelfCount = 0, onMenu }) {
  const [fortune, setFortune] = useState(null);
  const today = new Date().toISOString().slice(0, 10);
  const quote = getDailyQuote(today);

  useEffect(() => {
    api.fortune(user.zodiac, today).then(setFortune).catch(() => {});
  }, [user]);

  return (
    <div className="topbar">
      {/* 头部行：头像 + 名字 + 菜单按钮 */}
      <div className="header-row">
        <div className="avatar">{user.avatar || '🧑'}</div>
        <div className="who">
          <div className="name">
            {user.username}
            <span className="badge tag-admin">
              {user.role === 'admin' ? '管理员' : '伙伴'}
            </span>
          </div>
          <div className="meta">
            {today} 星期{['日','一','二','三','四','五','六'][new Date().getDay()]} · {user.zodiac}
          </div>
        </div>
        <button className="menu-btn" onClick={onMenu}>☰</button>
      </div>

      {/* 问候语 */}
      <div className="greeting">{getGreeting(user.username)}</div>

      {/* 今日自发货统计：标签 + 大号数字 */}
      <div className="hero-stat">
        <div className="hs-label">今日自发货</div>
        <div className="hs-num">{todaySelfCount} <span className="hs-unit">件</span></div>
      </div>

      {/* 励志语录 */}
      <div className="quote">💡 {quote.text}</div>

      {/* 运势建议 */}
      {fortune && (
        <div className="fortune">
          🌟 <b>{fortune.sign}</b>：{fortune.advice}
          （幸运方向{fortune.luckyDir}·数{fortune.luckyNum}）
        </div>
      )}
    </div>
  );
}
