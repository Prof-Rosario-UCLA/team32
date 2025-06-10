const CACHE_NAME = 'bruin-hot-take-v1';
const API_CACHE_NAME = 'bruin-hot-take-api-v1';
const urlsToCache = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const API_ORIGINS = [
  'http://localhost:3001',
  'https://bruinhottake.brandonle.dev'
];

// Track network state
let isOnline = navigator.onLine;

// Log initial state
console.log('[SW] Initial network state:', isOnline ? 'online' : 'offline');

self.addEventListener('online', () => {
  console.log('[SW] Network is online');
  isOnline = true;
  // Notify clients about online status
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'ONLINE_STATUS', isOnline: true });
    });
  });
});

self.addEventListener('offline', () => {
  console.log('[SW] Network is offline');
  isOnline = false;
  // Notify clients about offline status
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'ONLINE_STATUS', isOnline: false });
    });
  });
});

self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching app shell');
        // cache all urls
        return Promise.allSettled(
          urlsToCache.map(url => 
            fetch(url)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${url}: ${response.status}`);
                }
                return cache.put(url, response);
              })
              .catch(error => {
                console.error(`[SW] Failed to cache ${url}:`, error);
              })
          )
        );
      }),
      caches.open(API_CACHE_NAME)
    ]).then(() => {
      console.log('[SW] Skip waiting');
      return self.skipWaiting();
    }).catch(error => {
      console.error('[SW] Installation failed:', error);
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

function isApiRequest(url) {
  const isAllowedOrigin = API_ORIGINS.includes(url.origin);
  const isApiPath = url.pathname.startsWith('/api/');
  return isAllowedOrigin && isApiPath;
}

function isCacheableApiRequest(url) {
  const cacheableEndpoints = [
    '/api/posts',
    '/api/posts/tags',
    '/api/posts/trending',
  ];
  
  return cacheableEndpoints.some(endpoint => url.pathname.startsWith(endpoint));
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  console.log('[SW] Intercepted request:', {
    url: request.url,
    method: request.method,
    mode: request.mode,
    origin: url.origin,
    pathname: url.pathname,
    isApi: isApiRequest(url)
  });

  if (request.method !== 'GET') {
    console.log('[SW] Skipping non-GET request:', request.method);
    return;
  }

  if (isApiRequest(url)) {
    console.log('[SW] Handling API request:', url.pathname);
    event.respondWith(handleApiRequest(request, url));
    return;
  }

  if (url.origin === location.origin && request.mode === 'navigate') {
    console.log('[SW] Handling navigation request:', url.pathname);
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (url.origin === location.origin) {
    console.log('[SW] Handling static request:', url.pathname);
    event.respondWith(handleStaticRequest(request));
    return;
  }

  console.log('[SW] Letting request pass through:', url.href);
});

// API request handler
async function handleApiRequest(request, url) {
  console.log('[SW] Processing API request:', url.href);
  
  try {
    // Always try network first
    console.log('[SW] Attempting network request...');
    const networkResponse = await fetch(request);
    console.log('[SW] Network response received:', {
      status: networkResponse.status,
      ok: networkResponse.ok,
      url: url.href
    });
    
    // Cache successful responses for cacheable endpoints
    if (networkResponse.ok && isCacheableApiRequest(url)) {
      console.log('[SW] 💾 Caching API response for:', url.href);
      
      try {
        const cache = await caches.open(API_CACHE_NAME);
        const responseToCache = networkResponse.clone();
        await cache.put(request, responseToCache);
        console.log('[SW] ✅ Successfully cached:', url.href);
      } catch (cacheError) {
        console.error('[SW] Cache error:', cacheError);
      }
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed:', error.message);
    
    // If network fails, try cache
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Network failed, serving from cache:', url.href);
      const headers = new Headers(cachedResponse.headers);
      headers.set('sw-cache-hit', 'true');
      headers.set('sw-cached-at', Date.now().toString());
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // If we get here, both network and cache failed
    return new Response(
      JSON.stringify({ 
        error: 'Unable to fetch content and no cache available',
        offline: true,
        url: url.href
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleNavigationRequest(request) {
  try {
    // Double check network state
    isOnline = navigator.onLine;
    console.log('[SW] Handling navigation request, network state:', isOnline ? 'online' : 'offline');

    // Check network state first
    if (!isOnline) {
      console.log('[SW] Offline, serving offline page');
      const offlinePage = await caches.match('/offline');
      if (offlinePage) {
        return offlinePage;
      }
      // Fallback to network request for offline page
      const response = await fetch('/offline');
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put('/offline', response.clone());
        return response;
      }
      throw new Error('Failed to load offline page');
    }

    // If online, try network request
    console.log('[SW] Online, attempting network request');
    const response = await fetch(request);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response;
  } catch (error) {
    console.log('[SW] Navigation failed, serving offline page: ' + error);
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    // Fallback to network request for offline page
    const response = await fetch('/offline');
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/offline', response.clone());
      return response;
    }
    throw error;
  }
}

// Static request handler
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving static from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Error:', error);
    return new Response('Resource unavailable', { status: 503 });
  }
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_API_CACHE') {
    console.log('[SW] Clearing API cache');
    caches.delete(API_CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
  
  if (event.data && event.data.type === 'DEBUG_CACHE') {
    console.log('[SW] Debug cache triggered');
    caches.open(API_CACHE_NAME).then(async cache => {
      const keys = await cache.keys();
      console.log('[SW] API Cache keys:', keys.map(k => k.url));
      console.log('[SW] API Cache size:', keys.length);
      
      for (const key of keys) {
        const response = await cache.match(key);
        console.log('[SW] Cached response for:', key.url, {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        });
      }
    });
  }
});