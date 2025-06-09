const CACHE_NAME = 'bruin-hot-take-v1';
const API_CACHE_NAME = 'bruin-hot-take-api-v1';
const urlsToCache = [
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Define your API origins - add both development and production
const API_ORIGINS = [
  'http://localhost:3001',
  'https://bruinhottake.brandonle.dev'
];

// Install event
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      }),
      caches.open(API_CACHE_NAME)
    ]).then(() => {
      console.log('[SW] Skip waiting');
      return self.skipWaiting();
    })
  );
});

// Activate event
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

// Helper function to check if URL is an API request we want to cache
function isApiRequest(url) {
  const isAllowedOrigin = API_ORIGINS.includes(url.origin);
  const isApiPath = url.pathname.startsWith('/api/');
  return isAllowedOrigin && isApiPath;
}

// Helper function to check if it's a cacheable API endpoint
function isCacheableApiRequest(url) {
  const cacheableEndpoints = [
    '/api/posts',
    '/api/posts/tags',
    '/api/posts/trending',
    '/api/users/me' // Add any other endpoints you want to cache
  ];
  
  return cacheableEndpoints.some(endpoint => url.pathname.startsWith(endpoint));
}

// Fetch event
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Log all requests for debugging
  console.log('[SW] Intercepted request:', {
    url: request.url,
    method: request.method,
    mode: request.mode,
    origin: url.origin,
    pathname: url.pathname,
    isApi: isApiRequest(url)
  });

  // Skip non-GET requests
  if (request.method !== 'GET') {
    console.log('[SW] Skipping non-GET request:', request.method);
    return;
  }

  // Handle API requests (including cross-origin)
  if (isApiRequest(url)) {
    console.log('[SW] Handling API request:', url.pathname);
    event.respondWith(handleApiRequest(request, url));
    return;
  }

  // Handle same-origin navigation requests
  if (url.origin === location.origin && request.mode === 'navigate') {
    console.log('[SW] Handling navigation request:', url.pathname);
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle same-origin static requests
  if (url.origin === location.origin) {
    console.log('[SW] Handling static request:', url.pathname);
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Let other requests pass through
  console.log('[SW] Letting request pass through:', url.href);
});

// API request handler
async function handleApiRequest(request, url) {
  console.log('[SW] Processing API request:', url.href);
  
  try {
    console.log('[SW] Attempting network request...');
    const networkResponse = await fetch(request);
    console.log('[SW] Network response received:', {
      status: networkResponse.status,
      ok: networkResponse.ok,
      url: url.href
    });
    
    // Only cache successful responses for cacheable endpoints
    if (networkResponse.ok && isCacheableApiRequest(url)) {
      console.log('[SW] 💾 Caching API response for:', url.href);
      
      try {
        const cache = await caches.open(API_CACHE_NAME);
        const responseToCache = networkResponse.clone();
        
        // Create a custom cache key that includes the full URL
        const cacheKey = new Request(url.href, {
          method: request.method,
          headers: request.headers
        });
        
        await cache.put(cacheKey, responseToCache);
        console.log('[SW] ✅ Successfully cached:', url.href);
        
      } catch (cacheError) {
        console.error('[SW] Cache error:', cacheError);
      }
    } else {
      console.log('[SW] Not caching:', {
        ok: networkResponse.ok,
        cacheable: isCacheableApiRequest(url),
        url: url.href
      });
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed:', error.message);
    console.log('[SW] Checking cache for:', url.href);
    
    // Try to find in cache using the same key format
    const cacheKey = new Request(url.href, {
      method: request.method,
      headers: request.headers
    });
    
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', url.href);
      
      // Add header to indicate it's from cache
      const headers = new Headers(cachedResponse.headers);
      headers.set('sw-cache-hit', 'true');
      headers.set('sw-cached-at', Date.now().toString());
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    console.log('[SW] No cache available for:', url.href);
    return new Response(
      JSON.stringify({ 
        error: 'You are offline and this content is not cached',
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

// Navigation request handler
async function handleNavigationRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Navigation failed, serving offline page: ' + error);
    return await caches.match('/offline') || new Response('Offline', { status: 503 });
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

// Message handler for cache management
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_API_CACHE') {
    console.log('[SW] Clearing API cache');
    caches.delete(API_CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});