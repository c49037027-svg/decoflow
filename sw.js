// DecoFlow PWA — Service Worker
// 提供應用程式殼層（App Shell）快取，加到主畫面後即使網路差也能開啟
// v3 = 2026-06-01: 緊湊 UI + iOS 防滾動鎖
const CACHE = 'decoflow-v3';
const APP_SHELL = [
  './demo.html',
  './styles.css',
  './demo.js',
  './icon.svg',
  './manifest.json',
  'https://unpkg.com/three@0.128.0/build/three.min.js',
  'https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js'
];

// 自己網站的關鍵 HTML/CSS/JS 用 network-first（每次優先抓最新版本），
// 第三方 CDN（Three.js）用 cache-first 加速。
const NETWORK_FIRST = ['demo.html', 'styles.css', 'demo.js', 'index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL).catch(() => {}))
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
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isNetworkFirst = NETWORK_FIRST.some((name) => url.pathname.endsWith(name));

  if (isNetworkFirst) {
    // network-first：每次優先去拉新版本，失敗才用快取
    e.respondWith(
      fetch(e.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match(e.request).then((c) => c || caches.match('./demo.html')))
    );
    return;
  }

  // 其他資源 cache-first
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request)
          .then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
            return resp;
          })
          .catch(() => caches.match('./demo.html'))
    )
  );
});
