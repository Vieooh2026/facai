// 发财致富工作台 Service Worker
const CACHE = 'facai-v1';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => {}) // 首次安装时部分资源可能尚未就绪，不阻塞
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // 只处理同源 GET
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // 永远不缓存接口数据（保证实时性）
  if (url.pathname.startsWith('/api/')) return;

  // 页面导航：网络优先，离线回退到缓存首页
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .catch(() =>
          caches.match('/index.html')
            .then((r) => r || caches.match('/'))
        )
    );
    return;
  }

  // 静态资源：缓存优先 + 后台静默更新
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached); // 网络失败用缓存
      return cached || net;
    })
  );
});
