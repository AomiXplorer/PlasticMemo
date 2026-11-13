/**
 * Walks every possible choice combination through all eight chapters and counts
 * which ending each one produces. Proves the four endings are reachable and that
 * none of them is accidentally impossible.
 *
 *   node tools/simulate-endings.mjs
 */
import { CHAPTERS } from '../src/story/index.js';
import { resolveEnding, ENDING_ORDER } from '../src/core/endingManager.js';

const choices = [];
for (const ch of CHAPTERS) {
  for (const node of ch.body) {
    if (node?.t === 'choice') choices.push({ chapter: ch.id, node });
  }
}
console.log(`choices: ${choices.length} across ${CHAPTERS.length} chapters -> ${choices.reduce((a, c) => a * (c.node.options?.length ?? 1), 1)} paths`);

function run(picks) {
  const state = {
    rp: { bond: 0, honesty: 0, resolve: 0 },
    possible: { bond: 0, honesty: 0, resolve: 0 },
    flags: {},
  };
  let pickIdx = 0;

  for (const ch of CHAPTERS) {
    const labels = new Map();
    ch.body.forEach((n, i) => { if (n?.t === 'label' && !labels.has(n.name)) labels.set(n.name, i); });

    let i = 0;
    let guard = 0;
    while (i < ch.body.length) {
      if (guard++ > 20000) throw new Error('runaway loop in ' + ch.title);
      const node = ch.body[i];
      switch (node.t) {
        case 'choice': {
          for (const axis of ['bond', 'honesty', 'resolve']) {
            let best = 0;
            for (const o of node.options) {
              const v = o.rp?.[axis];
              if (typeof v === 'number' && v > best) best = v;
            }
            if (best > 0) state.possible[axis] += best;
          }
          const pick = picks[pickIdx++] ?? 0;
          const opt = node.options[Math.min(pick, node.options.length - 1)];
          for (const axis of ['bond', 'honesty', 'resolve']) {
            const v = opt.rp?.[axis];
            if (typeof v === 'number') state.rp[axis] += v;
          }
          if (opt.flags) Object.assign(state.flags, opt.flags);
          i += 1;
          break;
        }
        case 'label': i += 1; break;
        case 'goto': i = labels.has(node.name) ? labels.get(node.name) + 1 : i + 1; break;
        case 'branch': {
          const ok = evaluate(node.cond, state);
          const name = ok ? node.then : node.else;
          i = name && labels.has(name) ? labels.get(name) + 1 : i + 1;
          break;
        }
        case 'set': Object.assign(state.flags, node.flags ?? {}); i += 1; break;
        case 'endingGate': {
          return { state, ending: resolveEnding(state).id, chapter: ch.id };
        }
        case 'ending':
          return { state, ending: node.id, chapter: ch.id };
        default: i += 1;
      }
    }
  }
  return { state, ending: resolveEnding(state).id, chapter: null };
}

function evaluate(cond, state) {
  if (!cond) return true;
  if (cond.all) return cond.all.every((c) => evaluate(c, state));
  if (cond.any) return cond.any.some((c) => evaluate(c, state));
  if (cond.flag) return !!state.flags[cond.flag];
  if (cond.not) return !state.flags[cond.not];
  if (cond.axis) {
    const possible = state.possible[cond.axis] || 0;
    const r = possible ? Math.max(0, Math.min(1, state.rp[cond.axis] / possible)) : 0;
    if (typeof cond.gte === 'number' && !(r >= cond.gte)) return false;
    if (typeof cond.lte === 'number' && !(r <= cond.lte)) return false;
    if (typeof cond.gt === 'number' && !(r > cond.gt)) return false;
    if (typeof cond.lt === 'number' && !(r < cond.lt)) return false;
    return true;
  }
  return true;
}

const totals = { true: 0, good: 0, normal: 0, bad: 0 };
const samples = {};
const total = choices.reduce((a, c) => a * (c.node.options?.length ?? 1), 1);

for (let n = 0; n < total; n += 1) {
  const picks = [];
  let v = n;
  for (const c of choices) {
    const k = c.node.options.length;
    picks.push(v % k);
    v = Math.floor(v / k);
  }
  const res = run(picks);
  totals[res.ending] = (totals[res.ending] ?? 0) + 1;
  if (!samples[res.ending]) samples[res.ending] = { picks, state: res.state };
}

console.log('\nending distribution over every path:');
for (const id of ENDING_ORDER) {
  const pct = ((totals[id] / total) * 100).toFixed(1);
  const bar = '#'.repeat(Math.round((totals[id] / total) * 40));
  console.log(`  ${id.padEnd(7)} ${String(totals[id]).padStart(5)}  ${pct.padStart(5)}%  ${bar}`);
}

console.log('\none path per ending:');
for (const id of ENDING_ORDER) {
  const s = samples[id];
  if (!s) { console.log(`  ${id}: UNREACHABLE`); continue; }
  const r = resolveEnding(s.state);
  console.log(`  ${id.padEnd(7)} picks=[${s.picks.join(',')}] bond=${(r.bond * 100).toFixed(0)}% honesty=${(r.honesty * 100).toFixed(0)}% resolve=${(r.resolve * 100).toFixed(0)}%`);
}

const missing = ENDING_ORDER.filter((id) => !totals[id]);
if (missing.length) {
  console.error(`\nFAIL: unreachable ending(s): ${missing.join(', ')}`);
  process.exit(1);
}
console.log('\nAll four endings are reachable.');
