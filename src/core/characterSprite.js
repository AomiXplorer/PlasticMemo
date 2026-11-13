/**
 * Half-body sprite slots. One character per position; a new character in a
 * taken position pushes the old one out. The speaking character is bright, the
 * others dim, which is how a visual novel directs the eye.
 */
import { CHARACTERS } from '../story/characters.js';

const POSITIONS = ['farleft', 'left', 'center', 'right', 'farright'];

export class CharacterSprite {
  constructor(layer, expressions) {
    this.layer = layer;
    this.expressions = expressions;
    this.slots = new Map();
    for (const pos of POSITIONS) {
      const slot = document.createElement('div');
      slot.className = 'sprite-slot';
      slot.dataset.pos = pos;
      const img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      slot.append(img);
      layer.append(slot);
      this.slots.set(pos, { el: slot, img, who: null, expr: null });
    }
    this.speaking = null;
  }

  get(who) {
    for (const [pos, slot] of this.slots) if (slot.who === who) return [pos, slot];
    return [null, null];
  }

  show(who, expr = 'neutral', pos = 'center', { instant = false } = {}) {
    if (!CHARACTERS[who]) return;
    const slot = this.slots.get(pos) ?? this.slots.get('center');
    const resolved = this.expressions.resolve(expr);
    const url = this.expressions.url(who, resolved);

    if (slot.who && slot.who !== who) {
      this.hide(slot.who);
    }

    const [oldPos, existing] = this.get(who);
    if (oldPos && oldPos !== pos) {
      existing.el.classList.remove('is-on');
      existing.who = null;
    }

    slot.who = who;
    slot.expr = resolved;
    slot.el.dataset.who = who;
    slot.el.style.setProperty('--name-color', CHARACTERS[who].color ?? '#e8c07d');
    slot.el.style.setProperty('--sprite-scale', String(CHARACTERS[who].spriteScale ?? 1));
    slot.img.onerror = () => {
      const fallback = this.expressions.url(who, 'neutral');
      if (!slot.img.src.endsWith('/neutral.webp')) slot.img.src = fallback;
    };
    if (slot.img.getAttribute('src') !== url) {
      slot.img.src = url;
    }
    if (instant) {
      slot.el.classList.add('is-on', 'no-anim');
      requestAnimationFrame(() => slot.el.classList.remove('no-anim'));
    } else {
      requestAnimationFrame(() => slot.el.classList.add('is-on'));
    }
  }

  setExpression(who, expr) {
    const [, slot] = this.get(who);
    if (!slot) return;
    const resolved = this.expressions.resolve(expr);
    if (slot.expr === resolved) return;
    slot.expr = resolved;
    slot.img.src = this.expressions.url(who, resolved);
  }

  move(who, pos) {
    const [, slot] = this.get(who);
    const target = this.slots.get(pos);
    if (!slot || !target || slot === target) return;
    if (target.who && target.who !== who) this.hide(target.who);
    target.who = slot.who;
    target.expr = slot.expr;
    target.el.dataset.who = slot.who;
    target.el.style.setProperty('--name-color', slot.el.style.getPropertyValue('--name-color'));
    target.el.style.setProperty('--sprite-scale', slot.el.style.getPropertyValue('--sprite-scale'));
    target.img.src = slot.img.src;
    target.el.classList.add('is-on');
    slot.el.classList.remove('is-on');
    slot.who = null;
    slot.expr = null;
  }

  hide(who) {
    const [, slot] = this.get(who);
    if (!slot) return;
    slot.el.classList.remove('is-on', 'is-speaking');
    slot.who = null;
    slot.expr = null;
    setTimeout(() => {
      if (!slot.who) slot.img.removeAttribute('src');
    }, 420);
  }

  clear() {
    for (const [, slot] of this.slots) {
      slot.el.classList.remove('is-on', 'is-speaking');
      slot.who = null;
      slot.expr = null;
    }
    this.speaking = null;
  }

  highlight(who) {
    this.speaking = who;
    for (const [, slot] of this.slots) {
      slot.el.classList.toggle('is-speaking', !!who && slot.who === who);
      slot.el.classList.toggle('is-dim', !!who && slot.who !== who);
    }
  }

  present() {
    return [...this.slots.values()].filter((s) => s.who).map((s) => s.who);
  }
}
