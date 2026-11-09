/**
 * sw.js
 * Service Worker para "Mi Billetera Lite"
 * Estrategia de almacenamiento: Cache First, Network Fallback para el App Shell.
 */

const CACHE_NAME = 'billetera-lite-v1';

// Recursos estáticos indispensables para el funcionamiento offline (App Shell)
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
 * Fase INSTALL:
 * Pre-cachea todos los recursos críticos del App Shell.
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker y cacheando App Shell...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Error en precaché de recursos:', err);
      })
  );
});

/**
 * Fase ACTIVATE:
 * Limpia versiones obsoletas de cachés previas.
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando nueva versión del Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Eliminando caché antigua:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

/**
 * Fase FETCH:
 * Estrategia Cache First, Network Fallback.
 * 1. Busca en la caché local.
 * 2. Si existe, la entrega de inmediato (tiempo de respuesta ultra rápido y offline).
 * 3. Si no existe, realiza la petición a la red y actualiza la caché dinámicamente.
 */
self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET compatibles (http/https)
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Evitar interceptar extensiones de navegador u orígenes no relacionados
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Servir desde caché (Cache First)
          return cachedResponse;
        }

        // Si no está en caché, intentar red (Network Fallback)
        return fetch(event.request)
          .then((networkResponse) => {
            // Verificar respuesta válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clonar respuesta para guardarla en caché dinámica
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch(() => {
            // Si la red falla y es navegación HTML, devolver index.html de respaldo
            if (event.request.headers.get('accept')?.includes('text/html') || event.request.mode === 'navigate') {
              return caches.match(new URL('./index.html', self.location).href)
                .then(fallback => fallback || caches.match('./index.html'));
            }
          });
      })
  );
});
