/**
 * Story DSL — Until Your Last Memory
 * Every chapter file exports a `chapter` object built with these helpers.
 * Story data never touches rendering. The StoryEngine only walks a flat array.
 *
 * POSITIONS: 'left' | 'center' | 'right' | 'farleft' | 'farright'
 * EXPRESSIONS: neutral | happy | smile | shy | blush | sad | cry | surprise |
 *              embarrass | angry
 * AXES (relationship): bond | honesty | resolve
 *   bond    — seberapa dekat Akira dengan Mizuki
 *   honesty — seberapa jujur Akira soal perasaannya sendiri
 *   resolve — seberapa keras Akira mengejar solusi teknis
 *
 * CHOICE speaks for itself: [N] is the number of the option key on screen.
 * An option's `rp` adds points, `flags` sets flags, `reply` is shown right after
 * the choice and before the story continues.
 */

export const bg = (id, opts = {}) => ({ t: 'bg', id, ...opts });
export const show = (who, expr = 'neutral', pos = 'center', opts = {}) =>
  ({ t: 'show', who, expr, pos, ...opts });
export const hide = (who) => ({ t: 'hide', who });
export const move = (who, pos) => ({ t: 'move', who, pos });
export const expr = (who, e) => ({ t: 'expr', who, expr: e });
export const n = (text) => ({ t: 'say', who: null, text });
export const say = (who, e, text) => ({ t: 'say', who, expr: e, text });

export const a = (text, e = 'neutral') => say('akira', e, text);
export const m = (text, e = 'neutral') => say('mizuki', e, text);
export const h = (text, e = 'neutral') => say('hina', e, text);
export const k = (text, e = 'neutral') => say('kaito', e, text);

/** EVA system text — rendered as a machine read-out, not a character voice. */
export const sys = (text) => ({ t: 'sys', text });
/** Radio / broadcast voice from off-screen (a caller, a recording). */
export const voice = (label, text) => ({ t: 'say', who: null, text, voiceLabel: label });

export const choice = (prompt, options) => ({ t: 'choice', prompt, options });
export const set = (flags) => ({ t: 'set', flags });
export const bgm = (id) => ({ t: 'bgm', id });
export const sfx = (id) => ({ t: 'sfx', id });
export const amb = (id) => ({ t: 'amb', id });
export const fx = (id) => ({ t: 'fx', id });            // flash | shake | fadeblack
export const wait = (ms = 700) => ({ t: 'wait', ms });
export const label = (name) => ({ t: 'label', name });
export const go = (name) => ({ t: 'goto', name });
export const unlock = (id) => ({ t: 'unlock', id });     // gallery / CG unlock
export const ending = (id) => ({ t: 'ending', id });

/** Hand control to EndingManager: it picks a label from the map. */
export const endingGate = (map) => ({ t: 'endingGate', map });

/** Read a saved flag. Declarative so story files stay data, not code. */
export const when = (cond, thenLabel, elseLabel = null) =>
  ({ t: 'branch', cond, then: thenLabel, else: elseLabel });

/* cond shapes:
 *   { flag: 'name' }                     flag is truthy
 *   { not: 'name' }                      flag is falsy
 *   { axis: 'bond', gte: 12 }            axis comparison (also lte, gt, lt)
 *   { all: [c1, c2] } / { any: [c1, c2] }
 */

export const chapterMeta = (meta, body) => ({ ...meta, body });
