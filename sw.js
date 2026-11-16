// 앱 화면 파일을 저장해 두어 다음부터 빨리 열리게 하는 파일
const CACHE = 'cafe-diary-v14';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 지도 타일은 저장하지 않고 항상 인터넷에서 받음
  if (url.hostname.endsWith('openstreetmap.org')) return;
  // 로그인·가족 공유 서버 요청은 앱 파일 저장소를 거치지 않음
  if (url.hostname.endsWith('supabase.co')) return;
  // 먼저 인터넷에서 받고, 안 되면 저장해 둔 것 사용
  e.respondWith(
    fetch(req, { cache: 'no-store' }).then(res => {
      if (res.ok && (url.origin === location.origin || url.hostname === 'unpkg.com')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
