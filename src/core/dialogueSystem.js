/**
 * Typewriter dialogue with name plate, voice hook, history push, auto and skip.
 * One click completes the line; the next click advances.
 */
import { CHARACTERS } from '../story/characters.js';

export class DialogueSystem {
  constructor(root, { onAdvance, onHistory, audio, voice, settings }) {
    this.root = root;
    this.box = root.querySelector('#dialogue-box');
    this.nameEl = root.querySelector('#speaker-name');
    this.textEl = root.querySelector('#dialogue-text');
    this.hintEl = root.querySelector('#dialogue-hint');
    this.onAdvance = onAdvance;
    this.onHistory = onHistory;
    this.audio = audio;
    this.voice = voice;
    this.settings = settings;

    this.typing = false;
    this.full = '';
    this.shown = 0;
    this.raf = null;
    this.resolver = null;
    this.mode = 'idle'; // idle | typing | waiting
    this.auto = false;
    this.skip = false;
    this.autoTimer = null;

    this.box.addEventListener('click', (e) => {
      if (e.target.closest('[data-no-advance]')) return;
      this.advance();
    });
  }

  get speed() {
    return this.settings.textSpeed ?? 28; // ms per character
  }

  showName(who) {
    if (!who) {
      this.nameEl.textContent = '';
      this.nameEl.classList.add('is-narrator');
      this.box.dataset.who = 'narrator';
      return;
    }
    const c = CHARACTERS[who];
    this.nameEl.textContent = c?.name ?? who;
    this.nameEl.classList.remove('is-narrator');
    this.box.dataset.who = who;
    this.nameEl.style.color = c?.color ?? '#e8c07d';
  }

  /** Show a line and resolve when the player advances past it. */
  line({ who, text, expr, voiceLabel = null, lineKey = null }) {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.showName(who ?? null);
      this.root.classList.add('is-dialogue-on');
      this.box.classList.toggle('is-system', !!voiceLabel);
      this.full = text ?? '';
      this.shown = 0;

      if (who && CHARACTERS[who]) {
        this.voice.speak(who, text, CHARACTERS[who].voice, lineKey);
      } else if (this.settings.voiceNarration) {
        this.voice.speakNarration(text);
      }

      this.onHistory?.({ who, text, voiceLabel });
      this.type();
    });
  }

  type() {
    this.typing = true;
    this.mode = 'typing';
    this.hintEl.classList.remove('is-ready');
    this.textEl.textContent = '';
    const started = performance.now();
    const step = () => {
      const elapsed = performance.now() - started;
      const target = this.skip ? this.full.length : Math.min(this.full.length, Math.floor(elapsed / this.speed));
      if (target !== this.shown) {
        this.shown = target;
        this.textEl.textContent = this.full.slice(0, this.shown);
      }
      if (this.shown >= this.full.length) {
        this.finishTyping();
        return;
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  finishTyping() {
    cancelAnimationFrame(this.raf);
    this.typing = false;
    this.mode = 'waiting';
    this.textEl.textContent = this.full;
    this.hintEl.classList.add('is-ready');
    if (this.auto || this.skip) {
      const delay = this.skip ? 90 : Math.min(2400, 900 + this.full.length * 12);
      clearTimeout(this.autoTimer);
      this.autoTimer = setTimeout(() => this.advance(), delay);
    }
  }

  advance() {
    if (this.mode === 'typing') {
      this.finishTyping();
      return;
    }
    if (this.mode !== 'waiting') return;
    clearTimeout(this.autoTimer);
    this.voice.stop();
    this.mode = 'idle';
    const r = this.resolver;
    this.resolver = null;
    this.hintEl.classList.remove('is-ready');
    r?.();
  }

  /** Instantly resolve the current line (used by Skip and by fast-forward). */
  forceAdvance() {
    if (this.mode === 'typing') this.finishTyping();
    if (this.mode === 'waiting') this.advance();
  }

  setAuto(on) {
    this.auto = on;
    this.root.classList.toggle('is-auto', on);
    if (on && this.mode === 'waiting') this.finishTyping();
  }

  setSkip(on) {
    this.skip = on;
    this.root.classList.toggle('is-skip', on);
    if (on) this.forceAdvance();
  }

  clear() {
    this.mode = 'idle';
    this.textEl.textContent = '';
    this.showName(null);
    this.root.classList.remove('is-dialogue-on');
  }

  hideBox() {
    this.root.classList.remove('is-dialogue-on');
  }
}
