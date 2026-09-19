// اسم الكاش الخاص بالتطبيق (تمت الترقية إلى v3 لتخزين الملفات المقسمة الجديدة فوراً)
const CACHE_NAME = 'studio-pwa-v3';

// قائمة الملفات والمكتبات والخطوط المطلوب تخزينها للعمل بدون إنترنت
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',

  // ملفات الـ CSS المقسمة
  './css/base.css',
  './css/components.css',
  './css/studios.css',
  './css/responsive.css',

  // ملفات الـ JavaScript المقسمة
  './js/main.js',
  './js/state.js',
  './js/utils.js',
  './js/shell.js',
  './js/modules/collage.js',
  './js/modules/sprite.js',
  './js/modules/pivot.js',
  './js/modules/video.js',
  './js/modules/rename.js',

  // الخطوط والأيقونات الخارجية
  'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700;800&family=Tajawal:wght@500;700;800&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500..700,0..1,0&display=swap',

  // المكتبات الخارجية
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/gifshot@0.4.5/build/gifshot.min.js'
];

// مرحلة التثبيت: حفظ الملفات في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// مرحلة التفعيل: حذف أي كاش قديم (مثل v1 أو v2) لتحديث التطبيق فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// مرحلة الاستجابة للطلبات: إرجاع النسخة المخزنة عند انقطاع الاتصال
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // في حال انقطاع النت وطلب صفحة تنقل، يتم إرجاع الصفحة الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});