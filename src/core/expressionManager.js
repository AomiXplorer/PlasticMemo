/**
 * Resolves expression names to sprite files and keeps them warm in memory so a
 * face change never shows a broken frame mid-line.
 */
import { EXPRESSIONS } from '../story/characters.js';

export const ALIASES = {
  gentle: 'smile', soft: 'smile', worried: 'sad', thinking: 'neutral',
  calm: 'neutral', serious: 'neutral', shock: 'surprise', flustered: 'embarrass',
};

export class CharacterExpressionManager {
  constructor() {
    this.cache = new Map();
    this.known = new Set(EXPRESSIONS);
  }

  resolve(expr) {
    const e = String(expr ?? 'neutral');
    if (this.known.has(e)) return e;
    const alias = ALIASES[e];
    if (alias) return alias;
    return 'neutral';
  }

  url(who, expr) {
    return `assets/sprites/${who}/${this.resolve(expr)}.webp`;
  }

  preload(who, expressions) {
    for (const raw of expressions) {
      const url = this.url(who, raw);
      if (this.cache.has(url)) continue;
      const img = new Image();
      img.src = url;
      this.cache.set(url, img);
    }
  }

  preloadAll(who) {
    this.preload(who, EXPRESSIONS);
  }
}
