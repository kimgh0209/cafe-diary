// 앱 화면 파일을 저장해 두어 다음부터 빨리 열리게 하는 파일
const CACHE = 'cafe-diary-v40';
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
      if (res.ok && (url.origin === location.origin || url.hostname === 'unpkg.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'cdn.jsdelivr.net')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});

// 알림: 상대가 새로 적으면 서버가 보내 주는 알림을 보여 줌
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || '우리가족기록♡', {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag || 'fam',
    renotify: true,
    data: { url: d.url || './' }
  }));
});
// 알림을 누르면 앱을 열거나 이미 열린 앱으로 이동
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
