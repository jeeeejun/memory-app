// 오프라인 실행용. 앱 파일을 고치면 VERSION 숫자를 올리세요.
const VERSION = 'v16';
const SHELL = ['./', './index.html', './style.css', './app.js', './manifest.json', './icon.svg', './data/cards.json', './data/summaries.json', './data/sources.json', './data/texts.json', './vocab.html', './english.html', './manage.html'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
// 네트워크 우선 → 실패하면 캐시 (새 카드는 온라인일 때 자동 반영)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
