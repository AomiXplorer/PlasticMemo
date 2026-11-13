/**
 * Glue: owns settings, screens, the engine instance and every user gesture.
 * Nothing else in the game touches the DOM outside this file and ui/screens.js.
 */
import { CHAPTERS, ENDING_META, ENDING_ORDER, chapterById } from '../story/index.js';
import { BACKGROUNDS, BGM, AMB, SFX, CHARACTERS } from '../story/characters.js';
import { AudioManager } from './audioManager.js';
import { VoiceManager } from './voiceManager.js';
import { SaveManager } from './saveManager.js';
import { BackgroundRenderer } from './backgroundRenderer.js';
import { CharacterExpressionManager } from './expressionManager.js';
import { CharacterSprite } from './characterSprite.js';
import { DialogueSystem } from './dialogueSystem.js';
import { ChoiceManager } from './choiceManager.js';
import { SceneRenderer } from './sceneRenderer.js';
import { StoryEngine } from './storyEngine.js';
import { RelationshipManager } from './relationshipManager.js';
import { EndingManager } from './endingManager.js';
import { FullscreenManager } from './fullscreenManager.js';
import { OrientationManager } from './orientationManager.js';
import { Screens } from '../ui/screens.js';

const DEFAULT_SETTINGS = {
  textSpeed: 26,
  autoDelay: 1400,
  bgm: 0.55,
  amb: 0.4,
  sfx: 0.7,
  voice: 0.8,
  voiceEnabled: false,
  voiceNarration: false,
  muted: false,
};

export class Game {
  constructor(root) {
    this.root = root;
    this.saves = new SaveManager();
    this.settings = { ...DEFAULT_SETTINGS, ...(this.saves.loadSettings() ?? {}) };

    this.audio = new AudioManager(this.settings);
    this.voice = new VoiceManager(this.audio, {
      enabled: this.settings.voiceEnabled,
      volume: this.settings.voice,
    });
    this.background = new BackgroundRenderer(root.querySelector('#bg-layer'));
    this.expressions = new CharacterExpressionManager();
    this.sprites = new CharacterSprite(root.querySelector('#char-layer'), this.expressions);

    this.dialogue = new DialogueSystem(root, {
      audio: this.audio,
      voice: this.voice,
      settings: this.settings,
      onHistory: (entry) => this.pushHistory(entry),
    });
    this.choices = new ChoiceManager(root, { audio: this.audio });

    this.renderer = new SceneRenderer(root, {
      background: this.background,
      sprites: this.sprites,
      audio: this.audio,
      dialogue: this.dialogue,
      onFx: (id) => this.playFx(id),
    });

    this.fullscreen = new FullscreenManager(root);
    this.orientation = new OrientationManager();

    this.state = this.freshState();
    this.relations = new RelationshipManager(this.state);
    this.endings = new EndingManager(this.state);
    this.engine = this.buildEngine();

    this.screens = new Screens(this);
    this.startedAt = Date.now();
    this.lastActiveAt = Date.now();
  }

  freshState(chapterId = CHAPTERS[0]?.id ?? 1) {
    return {
      chapterId,
      chapterTitle: '',
      nodeIndex: 0,
      rp: { bond: 0, honesty: 0, resolve: 0 },
      possible: { bond: 0, honesty: 0, resolve: 0 },
      flags: {},
      history: [],
      ending: null,
    };
  }

  buildEngine() {
    return new StoryEngine({
      chapters: CHAPTERS,
      state: this.state,
      renderer: this.renderer,
      dialogue: this.dialogue,
      choices: this.choices,
      relations: this.relations,
      audio: this.audio,
      saves: this.saves,
      hooks: {
        onChapterStart: (ch) => this.onChapterStart(ch),
        onPreloadSprites: (who, exprs) => this.expressions.preload(who, exprs),
        onChapterEnd: (ch, next) => this.onChapterEnd(ch, next),
        onChoiceOpen: () => { this.dialogue.setSkip(false); this.syncToolbar(); },
        onChoicePicked: () => this.syncToolbar(),
        onAutosave: () => this.autosave(),
        onStateChange: () => this.syncToolbar(),
        resolveEndingId: () => this.endings.resolve().id,
        onEnding: (id) => this.onEnding(id),
        beforeNextChapter: (next) => this.beforeNextChapter(next),
      },
    });
  }

  /* ------------------------------ lifecycle ------------------------------ */

  init() {
    this.bindMenu();
    this.bindToolbar();
    this.bindStage();
    this.bindKeyboard();
    this.bindOrientation();
    this.bindLifecycle();
    this.screens.refreshMenu();
    this.applySettings();

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  bindMenu() {
    this.root.querySelectorAll('[data-menu]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.menu;
        this.audio.unlock();
        this.audio.playSfx('click');
        if (act === 'new') this.newGame();
        else if (act === 'continue') this.continueGame();
        else if (act === 'load') this.screens.openPanel('load');
        else if (act === 'chapters') this.screens.openPanel('chapters');
        else if (act === 'gallery') this.screens.openPanel('gallery');
        else if (act === 'settings') this.screens.openPanel('settings');
        else if (act === 'credits') this.screens.openPanel('credits');
        else if (act === 'rotate-hint') this.orientationHint();
      });
    });
  }

  bindToolbar() {
    this.root.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        this.audio.playSfx('click');
        if (act === 'auto') this.toggleAuto();
        else if (act === 'skip') this.toggleSkip();
        else if (act === 'log') this.screens.showLog();
        else if (act === 'save') this.screens.openPanel('save');
        else if (act === 'load') this.screens.openPanel('load');
        else if (act === 'settings') this.screens.openPanel('settings');
        else if (act === 'menu') this.screens.openPanel('menu');
        else if (act === 'fullscreen') this.toggleFullscreen();
      });
    });

    this.root.querySelectorAll('[data-ending]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.ending;
        if (act === 'gallery') this.screens.openPanel('gallery');
        if (act === 'menu') this.toMenu();
      });
    });

    this.root.querySelector('[data-rotate-dismiss]')?.addEventListener('click', () => {
      this.root.querySelector('#rotate-overlay')?.classList.add('is-dismissed');
    });
    window.addEventListener('orientationchange', () => {
      if (!this.orientation.isPortrait) {
        this.root.querySelector('#rotate-overlay')?.classList.remove('is-dismissed');
      }
    });
    this.root.querySelector('[data-rotate-fullscreen]')?.addEventListener('click', () => {
      this.requestLandscape();
    });
  }

  bindStage() {
    const stage = this.root.querySelector('#stage');
    stage.addEventListener('click', (e) => {
      if (e.target.closest('#toolbar, #choice-layer, .dialogue-box')) return;
      if (this.dialogue.mode === 'idle') return;
      if (this.screens.anyPanelOpen()) return;
      this.dialogue.advance();
    });
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (this.screens.anyPanelOpen()) {
        if (e.key === 'Escape') this.screens.closeAll();
        return;
      }
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'enter') {
        e.preventDefault();
        if (this.dialogue.mode !== 'idle') this.dialogue.advance();
      } else if (key === 'a') this.toggleAuto();
      else if (key === 's') this.toggleSkip();
      else if (key === 'l') this.screens.showLog();
      else if (key === 'h') this.screens.openPanel('menu');
      else if (key === 'f') this.toggleFullscreen();
      else if (key === 'escape') this.screens.openPanel('menu');
    });
  }

  bindOrientation() {
    const overlay = this.root.querySelector('#rotate-overlay');
    const sync = (s) => {
      overlay.classList.toggle('is-on', s.needsRotation);
      overlay.setAttribute('aria-hidden', s.needsRotation ? 'false' : 'true');
    };
    this.orientation.onChange(sync);
    sync(this.orientation.state());
  }

  bindLifecycle() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saves.addPlaytime(Date.now() - this.lastActiveAt);
        this.saves.flushMeta();
        if (this.dialogue.mode !== 'idle') this.autosave(true);
      } else {
        this.lastActiveAt = Date.now();
      }
    });
    window.addEventListener('pagehide', () => {
      if (this.dialogue.mode !== 'idle') this.autosave(true);
    });
  }

  /* ------------------------------ play flow ------------------------------ */

  async requestLandscape() {
    await this.fullscreen.enter();
    await this.orientation.lockLandscape();
  }

  orientationHint() {
    this.screens.showNotice(
      'Game ini paling enak dimainkan dalam posisi mendatar. Kalau HP kamu masih vertikal, miringkan dulu. Progres kamu aman.',
    );
  }

  async newGame() {
    await this.requestLandscape();
    this.audio.unlock();
    this.state = this.freshState(CHAPTERS[0]?.id ?? 1);
    this.relations = new RelationshipManager(this.state);
    this.endings = new EndingManager(this.state);
    this.sprites.clear();
    this.background.reset();
    this.dialogue.clear();
    this.screens.enterGame();
    this.engine = this.buildEngine();
    this.engine.start(this.state.chapterId, 0);
  }

  async continueGame() {
    const latest = this.saves.latest();
    if (!latest) {
      this.screens.showNotice('Belum ada simpanan. Mulai New Game dulu ya.');
      return;
    }
    await this.loadPayload(latest);
  }

  async loadPayload(payload) {
    await this.requestLandscape();
    this.audio.unlock();
    this.state = this.freshState(payload.chapterId);
    this.state.chapterTitle = payload.chapterTitle;
    this.state.rp = { ...payload.rp };
    this.state.possible = { ...payload.possible };
    this.state.flags = { ...payload.flags };
    this.state.history = [...(payload.history ?? [])];
    this.state.nodeIndex = payload.nodeIndex ?? 0;
    this.relations = new RelationshipManager(this.state);
    this.endings = new EndingManager(this.state);
    this.sprites.clear();
    this.background.reset();
    this.dialogue.clear();
    this.screens.closeAll();
    this.screens.enterGame();
    this.engine = this.buildEngine();
    this.engine.start(this.state.chapterId, this.state.nodeIndex);
  }

  toMenu() {
    this.engine.stop();
    this.dialogue.clear();
    this.audio.reset();
    this.sprites.clear();
    this.background.reset();
    this.screens.closeAll();
    this.screens.showMenu();
  }

  onChapterStart(ch) {
    const hudChapter = this.root.querySelector('#hud-chapter');
    const hudTitle = this.root.querySelector('#hud-title');
    if (hudChapter) hudChapter.textContent = `Ch. ${String(ch.id).padStart(2, '0')}`;
    if (hudTitle) hudTitle.textContent = ch.title;
    this.markReached(ch.id);
    document.title = `${ch.title} · Until Your Last Memory`;
    this.screens.updateChip(ch);
    this.autosave();
  }

  async onChapterEnd(ch, next) {
    this.saves.flushMeta();
    if (!next) return;
    this.screens.showChapterCard(next);
    await new Promise((r) => setTimeout(r, 2100));
  }

  async beforeNextChapter() {
    this.dialogue.clear();
    this.sprites.clear();
  }

  onEnding(id) {
    this.saves.unlockEnding(id);
    this.saves.unlockGallery(ENDING_META[id]?.cg ?? null);
    this.saves.flushMeta();
    this.saves.addPlaytime(Date.now() - this.lastActiveAt);
    this.autosave(true);
    const stats = this.relations.snapshot();
    this.screens.showEnding(id, stats, this.state);
  }

  pushHistory(entry) {
    this.state.history.push(entry);
    if (this.state.history.length > 400) this.state.history.shift();
  }

  /* ------------------------------ saving ------------------------------ */

  saveSlot(slot) {
    const preview = this.state.history
      .filter((h) => h.who && h.who !== 'pilihan')
      .slice(-2)
      .map((h) => h.text)
      .join(' ');
    const ok = this.saves.save(slot, this.state, { preview });
    this.screens.showNotice(ok ? 'Tersimpan.' : 'Gagal menyimpan: penyimpanan browser penuh.');
    this.screens.refreshSlots();
    return ok;
  }

  autosave(silent = false) {
    this.saves.save('auto', this.state, {
      preview: this.state.history.slice(-2).map((h) => h.text).join(' '),
    });
    if (!silent) this.screens.refreshMenu();
  }

  markReached(id) {
    const meta = this.saves.meta;
    meta.reached = Math.max(meta.reached ?? 1, id);
    this.saves.flushMeta();
  }

  /* ------------------------------ settings ------------------------------ */

  applySettings() {
    this.audio.setSettings(this.settings);
    this.voice.setEnabled(this.settings.voiceEnabled);
    this.voice.setVolume(this.settings.voice);
    this.dialogue.settings = this.settings;
    this.saves.saveSettings(this.settings);
    document.documentElement.style.setProperty('--dialogue-h', '30vh');
  }

  patchSettings(patch) {
    Object.assign(this.settings, patch);
    this.applySettings();
  }

  /* ------------------------------ toolbar ------------------------------ */

  toggleAuto() {
    const on = !this.dialogue.auto;
    this.dialogue.setAuto(on);
    if (on) this.dialogue.setSkip(false);
    this.syncToolbar();
  }

  toggleSkip() {
    const on = !this.dialogue.skip;
    this.dialogue.setSkip(on);
    if (on) this.dialogue.setAuto(false);
    this.syncToolbar();
  }

  syncToolbar() {
    this.root.querySelector('[data-act="auto"]')?.classList.toggle('is-on', this.dialogue.auto);
    this.root.querySelector('[data-act="skip"]')?.classList.toggle('is-on', this.dialogue.skip);
  }

  async toggleFullscreen() {
    const ok = await this.fullscreen.toggle();
    if (!ok) this.screens.showNotice('Browser ini nggak mengizinkan layar penuh otomatis. Coba dari menu browser.');
  }

  playFx(id) {
    const layer = this.root.querySelector('#fx-layer');
    const stage = this.root.querySelector('#stage');
    if (id === 'shake') {
      stage.classList.add('is-shaking');
      setTimeout(() => stage.classList.remove('is-shaking'), 340);
      return;
    }
    layer.classList.add(`fx-${id}`);
    setTimeout(() => layer.classList.remove(`fx-${id}`), 720);
  }
}

export { BACKGROUNDS, BGM, AMB, SFX, CHARACTERS, ENDING_META, ENDING_ORDER, chapterById };
