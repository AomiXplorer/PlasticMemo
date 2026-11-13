/* Service worker: precache the shell, cache art and audio on first use. */
const VERSION = 'uylm-v15';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/main.css',
  './assets/fonts/fonts.css',
  './assets/fonts/shippori-mincho-500.woff2',
  './assets/fonts/zen-kaku-gothic-new-400.woff2',
  './assets/bg/title_art.webp',
  './src/main.js',
  './src/core/game.js',
  './src/core/storyEngine.js',
  './src/core/sceneRenderer.js',
  './src/core/characterSprite.js',
  './src/core/expressionManager.js',
  './src/core/backgroundRenderer.js',
  './src/core/dialogueSystem.js',
  './src/core/choiceManager.js',
  './src/core/relationshipManager.js',
  './src/core/endingManager.js',
  './src/core/audioManager.js',
  './src/core/voiceManager.js',
  './src/core/saveManager.js',
  './src/core/orientationManager.js',
  './src/core/fullscreenManager.js',
  './src/ui/screens.js',
  './src/story/index.js',
  './src/story/dsl.js',
  './src/story/characters.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isMedia = /\.(webp|png|jpg|ogg|mp3|woff2)$/i.test(url.pathname);

  if (isMedia) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      }).catch(() => hit)),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html'))),
  );
});
