/**
 * sw.js
 * Service Worker para "Mi Billetera Lite"
 * Estrategia: Cache First, Network Fallback para funcionamiento 100% Offline.
 */

const CACHE_NAME = 'billetera-lite-v2';

// Recursos críticos del App Shell
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './js/app.js',
  './js/storage.js',
  './js/expenses.js',
  './js/ui.js',
  './js/register-sw.js',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/**
 * INSTALL: Cachea todos los archivos locales del App Shell y activa el SW de inmediato.
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando versión:', CACHE_NAME);
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Guardando App Shell en caché...');
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.error('[SW] Error cacheando archivos estáticos:', err);
    })
  );
});

/**
 * ACTIVATE: Toma el control de los clientes abiertos y elimina cachés obsoletas.
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando versión:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eliminando caché vieja:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

/**
 * FETCH: Estrategia Cache First, Network Fallback.
 */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Solo peticiones del mismo origen (ignora extensiones, etc.)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        // Encontrado en caché: entregarlo al instante sin red
        return cachedResponse;
      }

      // No está en caché: buscar en la red y guardar copia
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback cuando no hay red (modo offline)
        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html').then((res) => res || caches.match('./'));
        }
      });
    })
  );
});

// Escuchar mensaje para forzar skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
