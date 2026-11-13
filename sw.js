// 오프라인 실행용. 앱 파일을 고치면 VERSION 숫자를 올리세요.
const VERSION = 'v20';
const SHELL = ['./', './index.html', './style.css', './app.js', './manifest.json', './icon.svg', './data/cards.json', './data/summaries.json', './data/sources.json', './data/texts.json', './vocab.html', './english.html', './manage.html', './korean-grammar.html', './data/korean-grammar.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
// 네트워크 우선 → 실패하면 캐시 (새 카드는 온라인일 때 자동 반영)
// 같은 사이트 파일은 브라우저 HTTP 캐시(최대 10분)도 건너뛰고 서버에 다시 확인 → 고친 내용이 바로 보임
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === self.location.origin;
  const req = same ? new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }) : e.request;
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
