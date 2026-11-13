/**
 * Three independent buses: BGM, ambience and SFX, plus a voice bus owned by
 * VoiceManager. BGM cross-fades on change. Everything is file-based; if a file
 * is missing the bus simply stays silent and the game keeps running.
 */

const BASE = 'assets/audio';

export class AudioManager {
  constructor(settings = {}) {
    this.settings = {
      bgm: 0.55, sfx: 0.7, amb: 0.4, voice: 0.8, muted: false,
      ...settings,
    };
    this.unlocked = false;
    this.current = { bgm: null, amb: null };
    this.layers = { bgm: [], amb: [] };
    this.sfxPool = new Map();
    this.ready = false;
  }

  /** Browsers require a gesture before audio may start. */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.ready = true;
    if (this.pendingBgm) { const id = this.pendingBgm; this.pendingBgm = null; this.playBgm(id); }
    if (this.pendingAmb) { const id = this.pendingAmb; this.pendingAmb = null; this.playAmb(id); }
  }

  get masterGain() {
    return this.settings.muted ? 0 : 1;
  }

  _setVol(audio, value, fadeMs = 600, thenPause = false) {
    const target = Math.max(0, Math.min(1, value)) * this.masterGain;
    const start = audio.volume;
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / Math.max(1, fadeMs));
      audio.volume = Math.max(0, Math.min(1, start + (target - start) * k));
      if (k < 1) requestAnimationFrame(step);
      else if (thenPause) audio.pause();
    };
    if (fadeMs <= 0) { audio.volume = target; if (thenPause) audio.pause(); return; }
    requestAnimationFrame(step);
  }

  _make(src, loop) {
    const audio = new Audio();
    audio.src = src;
    audio.loop = loop;
    audio.preload = 'auto';
    audio.addEventListener('error', () => { audio.dataset.failed = '1'; }, { once: true });
    return audio;
  }

  playBgm(id, fadeMs = 900) {
    if (!id) return this.stopBgm(fadeMs);
    if (this.current.bgm === id) return;
    if (!this.unlocked) { this.pendingBgm = id; return; }
    const incoming = this._make(`${BASE}/bgm/${id}.ogg`, true);
    incoming.volume = 0;
    incoming.play().catch(() => {});
    const outgoing = this.layers[0];
    this._setVol(incoming, this.settings.bgm, fadeMs);
    if (outgoing) this._setVol(outgoing, 0, fadeMs, true);
    this.layers = [incoming];
    this.current.bgm = id;
  }

  stopBgm(fadeMs = 700) {
    for (const a of this.layers) this._setVol(a, 0, fadeMs, true);
    this.layers = [];
    this.current.bgm = null;
  }

  playAmb(id, fadeMs = 1200) {
    if (!id) return this.stopAmb(fadeMs);
    if (this.current.amb === id) return;
    if (!this.unlocked) { this.pendingAmb = id; return; }
    const incoming = this._make(`${BASE}/amb/${id}.ogg`, true);
    incoming.volume = 0;
    incoming.play().catch(() => {});
    const outgoing = this.ambLayer;
    this._setVol(incoming, this.settings.amb, fadeMs);
    if (outgoing) this._setVol(outgoing, 0, fadeMs, true);
    this.ambLayer = incoming;
    this.current.amb = id;
  }

  get ambLayer() {
    return this._ambLayer ?? null;
  }

  set ambLayer(v) { this._ambLayer = v; }

  stopAmb(fadeMs = 700) {
    if (this._ambLayer) this._setVol(this._ambLayer, 0, fadeMs, true);
    this._ambLayer = null;
    this.current.amb = null;
  }

  playSfx(id) {
    if (!this.unlocked || !id) return;
    const src = `${BASE}/sfx/${id}.ogg`;
    let el = this.sfxPool.get(id);
    if (!el) {
      el = this._make(src, false);
      this.sfxPool.set(id, el);
    }
    try {
      el.currentTime = 0;
      el.volume = Math.max(0, Math.min(1, this.settings.sfx)) * this.masterGain;
      el.play().catch(() => {});
    } catch { /* ignore */ }
  }

  setSettings(patch) {
    Object.assign(this.settings, patch);
    if (this.layers[0]) this._setVol(this.layers[0], this.settings.bgm, 200);
    if (this._ambLayer) this._setVol(this._ambLayer, this.settings.amb, 200);
  }

  duck(amount = 0.35, ms = 500) {
    if (!this.layers[0]) return;
    this._setVol(this.layers[0], this.settings.bgm * amount, ms);
    setTimeout(() => {
      if (this.layers[0]) this._setVol(this.layers[0], this.settings.bgm, ms);
    }, ms * 3);
  }

  reset() {
    this.stopBgm(0);
    this.stopAmb(0);
  }
}
