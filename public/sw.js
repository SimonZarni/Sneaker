// SNEAKER.DRP — Service Worker
// Strategy: cache-first for static assets, network-first for pages/API

const CACHE_VERSION = 'sneaker-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to pre-cache on install (Vite build output patterns)
const PRECACHE_URLS = [
    '/',
    '/offline',
];

// ── Install: pre-cache shell ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(PRECACHE_URLS).catch(() => {
                // Silently fail for URLs that aren't available
            });
        }).then(() => self.skipWaiting())
    );
});

// ── Activate: purge old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('sneaker-') && name !== STATIC_CACHE && name !== IMAGE_CACHE)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// ── Fetch: routing strategies ──────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and browser-extension requests
    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // 1. Vite build assets (JS/CSS with content hashes) — cache-first, long TTL
    if (url.pathname.startsWith('/build/')) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // 2. Product/static images — cache-first with image cache
    if (
        url.pathname.startsWith('/storage/') ||
        url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico)$/)
    ) {
        event.respondWith(cacheFirstWithFallback(request, IMAGE_CACHE));
        return;
    }

    // 3. API / broadcasting / Pusher — network only (never cache)
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/broadcasting/') ||
        url.hostname.includes('pusher') ||
        url.hostname.includes('soketi')
    ) {
        return; // Let browser handle normally
    }

    // 4. Inertia page navigations — network-first, fall back to offline page
    if (request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(networkFirstWithOfflineFallback(request));
        return;
    }

    // 5. Everything else — network first
    event.respondWith(networkFirst(request));
});

// ── Push notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: 'SNEAKER.DRP', body: event.data.text() };
    }

    const options = {
        body: data.body || data.message || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        image: data.image || undefined,
        data: {
            url: data.url || '/',
            orderId: data.order_id || null,
        },
        actions: data.actions || [],
        vibrate: [200, 100, 200],
        tag: data.tag || 'sneaker-notification',
        renotify: true,
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'SNEAKER.DRP', options)
    );
});

// ── Notification click ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing tab if already open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(targetUrl);
                    return;
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// ── Cache strategy helpers ─────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
    }
    return response;
}

async function cacheFirstWithFallback(request, cacheName) {
    try {
        const cached = await caches.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached || new Response('', { status: 404 });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached || new Response('Network error', { status: 503 });
    }
}

async function networkFirstWithOfflineFallback(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Return the cached offline page
        return caches.match('/offline') || new Response(
            '<html><body><h1>You are offline</h1></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
        );
    }
}
