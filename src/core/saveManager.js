/** localStorage persistence: six manual slots, one autosave, plus meta unlocks. */

const SAVE_KEY = 'uylm.saves.v1';
const META_KEY = 'uylm.meta.v1';
const SETTINGS_KEY = 'uylm.settings.v1';
export const SLOT_COUNT = 6;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export class SaveManager {
  constructor() {
    this.slots = read(SAVE_KEY, {});
    this.meta = read(META_KEY, { seen: {}, endings: {}, gallery: {}, playtimeMs: 0 });
  }

  slotKey(slot) {
    return String(slot);
  }

  save(slot, state, extra = {}) {
    const payload = {
      version: 1,
      savedAt: Date.now(),
      chapterId: state.chapterId,
      chapterTitle: state.chapterTitle,
      nodeIndex: state.nodeIndex,
      rp: { ...state.rp },
      possible: { ...state.possible },
      flags: { ...state.flags },
      history: (state.history ?? []).slice(-80),
      preview: extra.preview ?? '',
      label: extra.label ?? '',
    };
    this.slots[this.slotKey(slot)] = payload;
    return write(SAVE_KEY, this.slots);
  }

  load(slot) {
    const payload = this.slots[this.slotKey(slot)];
    if (!payload) return null;
    return payload;
  }

  delete(slot) {
    delete this.slots[this.slotKey(slot)];
    write(SAVE_KEY, this.slots);
  }

  list() {
    const out = [];
    for (let i = 1; i <= SLOT_COUNT; i += 1) out.push([i, this.slots[this.slotKey(i)] ?? null]);
    out.push(['auto', this.slots.auto ?? null]);
    return out;
  }

  latest() {
    let best = null;
    for (const [, payload] of this.list()) {
      if (!payload) continue;
      if (!best || payload.savedAt > best.savedAt) best = payload;
    }
    return best;
  }

  hasAnySave() {
    return !!this.latest();
  }

  /* ---- meta: seen text, endings, gallery ---- */
  markSeen(id) {
    if (!id) return;
    this.meta.seen[id] = (this.meta.seen[id] ?? 0) + 1;
    write(META_KEY, this.meta);
  }

  seenCount(id) {
    return this.meta.seen[id] ?? 0;
  }

  unlockGallery(id) {
    if (!id || this.meta.gallery[id]) return;
    this.meta.gallery[id] = Date.now();
    write(META_KEY, this.meta);
  }

  unlockEnding(id) {
    if (!id) return;
    this.meta.endings[id] = Date.now();
    write(META_KEY, this.meta);
  }

  gallery() {
    return { ...this.meta.gallery };
  }

  endings() {
    return { ...this.meta.endings };
  }

  addPlaytime(ms) {
    this.meta.playtimeMs = (this.meta.playtimeMs ?? 0) + ms;
  }

  flushMeta() {
    write(META_KEY, this.meta);
  }

  /* ---- settings ---- */
  loadSettings() {
    return read(SETTINGS_KEY, null);
  }

  saveSettings(settings) {
    return write(SETTINGS_KEY, settings);
  }
}
