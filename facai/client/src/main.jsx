import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);

// ── PWA：注册 Service Worker ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('[PWA] SW 已注册:', reg.scope))
      .catch(() => {}); // 开发环境 /sw.js 不存在时静默忽略
  });
}

// ── PWA：「安装到桌面」按钮（beforeinstallprompt）──
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  const deferred = e;
  if (document.getElementById('pwa-install-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'pwa-install-btn';
  btn.textContent = '📲 安装到桌面';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '18px',
    right: '18px',
    zIndex: 9999,
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #2DD4BF, #38BDF8)',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 4px 14px rgba(45,212,191,.35)',
    cursor: 'pointer',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
  });
  btn.onclick = async () => {
    deferred.prompt();
    await deferred.userChoice;
    btn.remove();
  };
  document.body.appendChild(btn);
});
