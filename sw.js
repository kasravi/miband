const cacheName = 'pwa-conf-v1';
const staticAssets = [
    './',
    './index.html',
    './app.js',
    './styles.css'
];

self.addEventListener('install', async event => {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
});

async function cacheFirst(req) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(req);
    return cachedResponse || fetch(req);
}

self.addEventListener('fetch', async event => {
    const req = event.request;
    event.respondWith(cacheFirst(req));
});