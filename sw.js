// おうちアプリ：電波がなくても起動できるよう、アプリのファイルを端末に保存する
// ファイルを増やしたときは CACHE の番号を上げる
const CACHE = 'ouchi-v1';
const ASSETS = ['./', './index.html', './logo.png', './apple-touch-icon.png'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
    self.skipWaiting();
});

// 古い番号の保存分を削除する
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

    if (req.mode === 'navigate') {
        // ページ本体：電波があれば常に最新版を取り、保存分も更新する。なければ保存分で起動する
        event.respondWith(
            fetch(req)
                .then(res => {
                    const copy = res.clone();
                    caches.open(CACHE).then(cache => cache.put('./index.html', copy));
                    return res;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // 画像など：保存分を優先し、なければネットから取る
    event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
