// Service Worker for ElectroBrain PWA
// Caches static assets & enables offline support

const CACHE_NAME = 'electrobrain-v1';

// FIX: Variable definieren, damit sie unten in cache.addAll() bekannt ist
const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/learn',
  '/flashcards',
  '/notes',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Falls du eine offline.html hast, füge sie hier hinzu
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets');
      // Jetzt ist urlsToCache definiert und der Fehler verschwindet
      return cache.addAll(urlsToCache).catch((err) => {
        console.log('[SW] Cache error (some files might be missing):', err);
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  // Supabase Calls immer direkt ans Netzwerk (nicht cachen!)
  if (request.url.includes('supabase.co')) {
    return; 
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          
          if (request.destination === 'document') {
            return new Response('Offline - Bitte verbinde dich mit dem Internet.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          }
        });
      })
  );
});

console.log('[SW] Service Worker loaded');