/** Two stacked layers so a background change is a cross-fade, not a flash. */

export class BackgroundRenderer {
  constructor(root) {
    this.root = root;
    this.a = document.createElement('img');
    this.b = document.createElement('img');
    for (const img of [this.a, this.b]) {
      img.className = 'bg-layer';
      img.decoding = 'async';
      img.alt = '';
      this.root.append(img);
    }
    this.active = this.a;
    this.current = null;
    this.cache = new Map();
  }

  url(id) {
    return id === 'black' ? null : `assets/bg/${id}.webp`;
  }

  preload(ids) {
    for (const id of ids) {
      const url = this.url(id);
      if (!url || this.cache.has(url)) continue;
      const img = new Image();
      img.src = url;
      this.cache.set(url, img);
    }
  }

  set(id, { instant = false } = {}) {
    if (id === this.current) return;
    this.current = id;
    const url = this.url(id);
    const next = this.active === this.a ? this.b : this.a;

    const swap = () => {
      next.classList.add('is-active');
      this.active.classList.remove('is-active');
      this.active = next;
    };

    if (!url) {
      next.removeAttribute('src');
      next.style.background = '#000';
      swap();
      return;
    }
    next.style.background = '';
    next.onload = () => { if (!instant) swap(); else swap(); };
    next.src = url;
    if (instant) swap();
    this.root.dataset.bg = id;
  }

  reset() {
    this.current = null;
    this.a.removeAttribute('src');
    this.b.removeAttribute('src');
  }
}
