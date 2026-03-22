// NagarikAI — No-op Service Worker
// Satisfies the browser's automatic service-worker request.
// No caching or offline logic is registered.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
