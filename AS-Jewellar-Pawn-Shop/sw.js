/**
 * AS JEWELLAR PAWN SHOP - SERVICE WORKER & OFFLINE CACHE
 * Version: 2.0.0
 * Provides Cache-First offline shell and Network-First dynamic asset strategies.
 */

const CACHE_NAME = 'as-jewellar-v3';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './login.html',
  './dashboard.html',
  './customers.html',
  './customer.html',
  './pledges.html',
  './new-pledge.html',
  './payments.html',
  './redemption.html',
  './renewal.html',
  './reminders.html',
  './vault.html',
  './rates.html',
  './reports.html',
  './documents.html',
  './settings.html',
  './manifest.json',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/responsive.css',
  './js/i18n.js',
  './js/auth.js',
  './js/offline.js',
  './js/api.js',
  './js/validation.js',
  './js/ui.js',
  './js/customers.js',
  './js/documents.js',
  './js/rates.js',
  './js/pledgePos.js',
  './js/billing.js',
  './js/payments.js',
  './js/renewalRedemption.js',
  './js/dashboard.js',
  './js/reminders.js',
  './js/vault.js',
  './js/cash.js',
  './js/reports.js',
  './js/app.js',
  './assets/logo/logo.svg',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg'
];

// 1. Install Event - Pre-cache Application Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline application shell');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event - Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event - Cache-First for static assets, Network-First for API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET requests (handled by IndexedDB offline queue)
  if (event.request.method !== 'GET') {
    return;
  }

  // Static Assets - Cache-First Strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Offline background fetch ignored */});

        return cachedResponse;
      }

      // If not in cache, fetch from network and cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for HTML page navigation if completely offline
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./dashboard.html') || caches.match('./index.html');
        }
      });
    })
  );
});
