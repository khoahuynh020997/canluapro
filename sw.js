// ============================================
// Service Worker - Tối ưu hiệu suất + Offline
// ============================================

const CACHE_NAME = 'can-lua-pro-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './js/storage.js',
  './js/calc.js',
  './js/grid.js',
  './js/ui.js',
  './js/app.js'
];

// Cài đặt - cache sẵn các file quan trọng
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Đang cache tài nguyên...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Kích hoạt - xóa cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Chiến lược Cache First (nhanh nhất)
self.addEventListener('fetch', (event) => {
  // Chỉ xử lý request cùng origin
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached; // Có trong cache → trả về ngay (siêu nhanh)
      }

      // Không có trong cache → lấy từ mạng rồi lưu lại
      return fetch(event.request).then((response) => {
        // Chỉ cache file thành công
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Offline và không có cache → trả về trang chính
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});