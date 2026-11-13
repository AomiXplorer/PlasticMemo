/**
 * Walks a chapter's node array. The only module that knows about node order.
 * Awaits the dialogue box for `say`, the choice menu for `choice`, and applies
 * everything else immediately.
 */

export class StoryEngine {
  constructor({
    chapters, state, renderer, dialogue, choices, relations, audio, saves, hooks,
  }) {
    this.chapters = chapters;
    this.state = state;
    this.renderer = renderer;
    this.dialogue = dialogue;
    this.choices = choices;
    this.relations = relations;
    this.audio = audio;
    this.saves = saves;
    this.hooks = hooks ?? {};
    this.labels = new Map();
    this.running = false;
    this.stopped = false;
    this.linesSinceSave = 0;
  }

  get chapter() {
    return this.chapters.find((c) => c.id === this.state.chapterId) ?? this.chapters[0];
  }

  get body() {
    return this.chapter?.body ?? [];
  }

  buildLabels() {
    this.labels.clear();
    this.body.forEach((node, i) => {
      if (node?.t === 'label' && !this.labels.has(node.name)) this.labels.set(node.name, i);
    });
  }

  evaluate(cond) {
    if (!cond) return true;
    if (Array.isArray(cond)) return cond.every((c) => this.evaluate(c));
    if (cond.all) return cond.all.every((c) => this.evaluate(c));
    if (cond.any) return cond.any.some((c) => this.evaluate(c));
    if (cond.flag) return !!this.state.flags[cond.flag];
    if (cond.not) return !this.state.flags[cond.not];
    if (cond.axis) {
      const r = this.relations.ratio(cond.axis);
      if (typeof cond.gte === 'number' && !(r >= cond.gte)) return false;
      if (typeof cond.lte === 'number' && !(r <= cond.lte)) return false;
      if (typeof cond.gt === 'number' && !(r > cond.gt)) return false;
      if (typeof cond.lt === 'number' && !(r < cond.lt)) return false;
      return true;
    }
    return true;
  }

  async start(chapterId, nodeIndex = 0) {
    const ch = this.chapters.find((c) => c.id === chapterId) ?? this.chapters[0];
    this.state.chapterId = ch.id;
    this.state.chapterTitle = ch.title;
    this.state.nodeIndex = Math.max(0, Math.min(nodeIndex, ch.body.length));
    this.buildLabels();
    this.stopped = false;

    // Pre-warm every sprite and background this chapter can show.
    const bgs = new Set();
    const casts = new Map();
    for (const node of ch.body) {
      if (node?.t === 'bg') bgs.add(node.id);
      if (node?.t === 'show') {
        if (!casts.has(node.who)) casts.set(node.who, new Set());
        casts.get(node.who).add(node.expr ?? 'neutral');
      }
    }
    this.hooks.onChapterStart?.(ch, { backgrounds: [...bgs], casts });
    this.renderer.background.preload([...bgs]);
    for (const [who, exprs] of casts) this.hooks.onPreloadSprites?.(who, [...exprs]);

    if (this.state.nodeIndex > 0) {
      await this.replayTo(this.state.nodeIndex);
    }
    await this.loop();
  }

  /** Re-apply visuals for nodes already seen, without stopping on dialogue. */
  async replayTo(index) {
    this.buildLabels();
    for (let i = 0; i < index; i += 1) {
      const node = this.body[i];
      if (!node) break;
      if (node.t === 'say' || node.t === 'choice' || node.t === 'wait') continue;
      if (node.t === 'ending') break;
      this.applySilent(node);
    }
  }

  applySilent(node) {
    if (['bg', 'show', 'expr', 'hide', 'move', 'bgm', 'amb'].includes(node.t)) {
      this.renderer.apply(node, { instant: true });
    } else if (node.t === 'fx' || node.t === 'sfx') {
      /* no sound or flash while restoring */
    } else if (node.t === 'set') {
      Object.assign(this.state.flags, node.flags);
    }
  }

  async loop() {
    if (this.running) return;
    this.running = true;
    while (!this.stopped) {
      if (this.state.nodeIndex >= this.body.length) {
        const advanced = await this.endChapter();
        if (!advanced) break;
        continue;
      }
      const node = this.body[this.state.nodeIndex];
      await this.exec(node);
      if (this.stopped) break;
    }
    this.running = false;
  }

  async exec(node) {
    switch (node.t) {
      case 'label':
        this.state.nodeIndex += 1;
        return;

      case 'goto': {
        const target = this.labels.get(node.name);
        if (target === undefined) { this.state.nodeIndex += 1; return; }
        this.state.nodeIndex = target + 1;
        return;
      }

      case 'branch': {
        const ok = this.evaluate(node.cond);
        const name = ok ? node.then : node.else;
        if (name && this.labels.has(name)) {
          this.state.nodeIndex = this.labels.get(name) + 1;
        } else {
          this.state.nodeIndex += 1;
        }
        return;
      }

      case 'set':
        Object.assign(this.state.flags, node.flags ?? {});
        this.hooks.onStateChange?.();
        this.state.nodeIndex += 1;
        return;

      case 'say': {
        if (node.who && node.expr) this.renderer.sprites.setExpression(node.who, node.expr);
        this.renderer.sprites.highlight(node.who ?? null);
        await this.dialogue.line({
          who: node.who,
          text: node.text,
          expr: node.expr,
          voiceLabel: node.voiceLabel ?? null,
          lineKey: node.lineKey ?? null,
        });
        this.state.nodeIndex += 1;
        this.linesSinceSave += 1;
        if (this.linesSinceSave >= 12) {
          this.linesSinceSave = 0;
          this.hooks.onAutosave?.();
        }
        return;
      }

      case 'sys': {
        this.renderer.sprites.highlight(null);
        await this.dialogue.line({
          who: null, text: node.text, voiceLabel: 'SISTEM', system: true,
        });
        this.state.nodeIndex += 1;
        this.linesSinceSave += 1;
        return;
      }

      case 'choice': {
        this.hooks.onChoiceOpen?.(node);
        this.relations.registerChoice(node.options);
        const picked = await this.choices.ask(node.prompt, node.options);
        const option = node.options[picked];
        this.relations.apply(option);
        if (option.flags) Object.assign(this.state.flags, option.flags);
        this.state.history.push({ who: 'pilihan', text: option.text });
        this.hooks.onChoicePicked?.(option, picked);
        this.state.nodeIndex += 1;
        if (Array.isArray(option.reply) && option.reply.length) {
          await this.playInline(option.reply);
        }
        this.hooks.onAutosave?.();
        this.hooks.onStateChange?.();
        return;
      }

      case 'wait':
        await new Promise((r) => setTimeout(r, node.ms ?? 600));
        this.state.nodeIndex += 1;
        return;

      case 'endingGate': {
        const id = this.hooks.resolveEndingId?.() ?? 'normal';
        this.state.history.push({ who: 'sistem', text: `ending:${id}` });
        const target = node.map?.[id] ?? node.map?.normal;
        if (target && this.labels.has(target)) {
          this.state.nodeIndex = this.labels.get(target) + 1;
        } else {
          this.state.nodeIndex += 1;
        }
        return;
      }

      case 'ending':
        this.state.nodeIndex += 1;
        this.stopped = true;
        this.hooks.onEnding?.(node.id);
        return;

      case 'unlock':
        this.saves?.unlockGallery(node.id);
        this.state.nodeIndex += 1;
        return;

      default:
        this.renderer.apply(node);
        this.state.nodeIndex += 1;
    }
  }

  /** Play extra lines attached to a choice without disturbing the node cursor. */
  async playInline(nodes) {
    for (const node of nodes) {
      if (node.t === 'say' || node.t === 'sys') {
        if (node.who && node.expr) this.renderer.sprites.setExpression(node.who, node.expr);
        this.renderer.sprites.highlight(node.who ?? null);
        // eslint-disable-next-line no-await-in-loop
        await this.dialogue.line({ who: node.who, text: node.text, voiceLabel: node.voiceLabel ?? null });
      } else {
        this.renderer.apply(node);
      }
    }
    this.renderer.sprites.highlight(null);
  }

  async endChapter() {
    const ch = this.chapter;
    const idx = this.chapters.findIndex((c) => c.id === ch.id);
    const next = this.chapters[idx + 1];
    this.hooks.onChapterEnd?.(ch, next ?? null);
    if (!next) {
      this.stopped = true;
      return false;
    }
    await this.hooks.beforeNextChapter?.(next);
    await this.start(next.id, 0);
    return true;
  }

  stop() {
    this.stopped = true;
  }
}
