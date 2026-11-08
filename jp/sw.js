// Офлайн: приложение, курс и аудио кэшируются после первого открытия
const V = 'jp-v3';
const CORE = ['./', 'index.html', 'css/app.css', 'js/main.js', 'js/core.js', 'js/fx.js', 'js/ex.js', 'js/gen.js', 'js/screens.js', 'js/writing.js', 'js/icons.js', 'js/art.js',
  'data/course.json', 'data/vocab.json', 'data/kanji.json', 'data/kana.json', 'data/grammar.json', 'data/sentences.json', 'data/interview.json', 'data/strokes.json', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'jp-audio').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const isAudio = /\/audio\/s\//.test(u.pathname) || u.hostname === 'upload.wikimedia.org';
  if (isAudio) {
    // аудио: из кэша (с поддержкой Range для Safari), иначе из сети и сохранить на будущее
    e.respondWith(caches.open('jp-audio').then(async c => {
      const hit = await c.match(e.request.url);
      const range = e.request.headers.get('range');
      if (hit && hit.type !== 'opaque') {
        if (!range) return hit;
        const buf = await hit.clone().arrayBuffer();
        const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
        const start = m[1] ? +m[1] : 0, end = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
        return new Response(buf.slice(start, end + 1), { status: 206, headers: { 'Content-Type': hit.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': 'bytes ' + start + '-' + end + '/' + buf.byteLength, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
      }
      // в кэш кладём целый файл отдельным запросом, а плееру отдаём ответ сети как есть
      fetch(e.request.url, { mode: u.origin === location.origin ? 'same-origin' : 'cors' }).then(r => { if (r.ok) c.put(e.request.url, r); }).catch(() => { });
      return fetch(e.request);
    }));
    return;
  }
  if (u.origin !== location.origin) return;
  // приложение и данные: сначала сеть (чтобы обновления приходили), при офлайне — кэш
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
