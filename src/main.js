import { Game } from './core/game.js';

const root = document.getElementById('app');
const game = new Game(root);
game.init();

/* Audio needs one gesture from the player before any bus may start. */
const unlockOnce = () => {
  game.audio.unlock();
  window.removeEventListener('pointerdown', unlockOnce);
  window.removeEventListener('keydown', unlockOnce);
};
window.addEventListener('pointerdown', unlockOnce, { once: true });
window.addEventListener('keydown', unlockOnce, { once: true });

/* Keep the portrait overlay honest when the browser reports no orientation. */
window.addEventListener('resize', () => {
  const s = game.orientation.state();
  document.getElementById('rotate-overlay')?.classList.toggle('is-on', s.needsRotation);
});

if (document.getElementById('screen-menu')?.classList.contains('is-active')) {
  game.screens.refreshMenu();
}

/* QA / demo jump: index.html?ch=5&node=120 opens chapter 5 at that node. */
function qaJump() {
  const params = new URLSearchParams(location.search);
  const ch = Number(params.get('ch'));
  if (!ch) return;
  const node = Math.max(0, Number(params.get('node')) || 0);
  game.loadPayload({
    chapterId: ch, chapterTitle: '', nodeIndex: node,
    rp: { bond: Number(params.get('bond')) || 0, honesty: 0, resolve: 0 },
    possible: { bond: Number(params.get('bondMax')) || 1, honesty: 1, resolve: 1 },
    flags: {}, history: [],
  });
}
qaJump();

/* PWA: only on real HTTPS hosting, so local test runs are never cache-stale. */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}


/* Surface runtime failures on screen so a broken build is never silent. */
function showFatal(message) {
  let bar = document.getElementById('uylm-err');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'uylm-err';
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:999;background:#3a1512;color:#ffd9d4;font:12px/1.5 monospace;padding:8px 12px;border-top:1px solid #b5615c;max-height:38vh;overflow:auto;white-space:pre-wrap';
    document.body.appendChild(bar);
  }
  bar.textContent += (bar.textContent ? '\n' : '') + message;
}
window.addEventListener('error', (e) => showFatal(`${e.message} @ ${e.filename}:${e.lineno}`));
window.addEventListener('unhandledrejection', (e) => showFatal(`unhandled: ${e.reason?.message ?? e.reason}`));
