/**
 * Story validator. Fails loudly on anything the engine cannot render.
 *   node tools/validate-story.mjs            all chapters present
 *   node tools/validate-story.mjs src/story/ch02.js
 */
import { pathToFileURL } from 'node:url';
import { resolve, basename } from 'node:path';
import { readdirSync } from 'node:fs';
import {
  CHARACTERS, EXPRESSIONS, BACKGROUNDS, BGM, AMB, SFX,
} from '../src/story/characters.js';

const POSITIONS = new Set(['left', 'center', 'right', 'farleft', 'farright']);
const AXES = new Set(['bond', 'honesty', 'resolve']);
const ENDINGS = new Set(['true', 'good', 'normal', 'bad']);
const ALIAS = { gentle: 'smile', soft: 'smile', worried: 'sad', thinking: 'neutral', calm: 'neutral' };

const dir = resolve('src/story');
const targets = process.argv.slice(2).length
  ? process.argv.slice(2).map((p) => resolve(p))
  : readdirSync(dir).filter((f) => /^ch\d+\.js$/.test(f)).sort().map((f) => resolve(dir, f));

let hardErrors = 0;
let warnings = 0;

function err(where, msg) {
  hardErrors++;
  console.error(`  ERROR ${where}: ${msg}`);
}
function warn(where, msg) {
  warnings++;
  console.warn(`  warn  ${where}: ${msg}`);
}

function exprOk(e) {
  return EXPRESSIONS.includes(e) || Object.hasOwn(ALIAS, e);
}

for (const file of targets) {
  const name = basename(file);
  let mod;
  try {
    mod = await import(pathToFileURL(file).href);
  } catch (e) {
    err(name, `import failed -> ${e.message}`);
    continue;
  }
  const ch = mod.chapter;
  if (!ch) { err(name, 'no `chapter` export'); continue; }

  const lines = [];
  const labels = new Set();
  const gotos = [];
  const choices = [];
  let sayCount = 0;

  for (const [i, node] of ch.body.entries()) {
    const at = `${name}[${i}] ${node?.t ?? '?'}`;
    if (!node || typeof node !== 'object' || !node.t) { err(at, 'not a node'); continue; }

    switch (node.t) {
      case 'say':
        sayCount++;
        lines.push(node);
        if (node.who !== null && node.who !== undefined) {
          if (!CHARACTERS[node.who]) err(at, `unknown character "${node.who}"`);
          if (node.expr !== undefined && !exprOk(node.expr)) err(at, `unknown expression "${node.expr}"`);
        }
        if (typeof node.text !== 'string' || !node.text.trim()) err(at, 'empty text');
        break;
      case 'sys':
        if (typeof node.text !== 'string' || !node.text.trim()) err(at, 'empty sys text');
        break;
      case 'bg':
        if (!BACKGROUNDS[node.id]) err(at, `unknown background "${node.id}"`);
        break;
      case 'show':
        if (!CHARACTERS[node.who]) err(at, `unknown character "${node.who}"`);
        if (!exprOk(node.expr)) err(at, `unknown expression "${node.expr}"`);
        if (node.pos && !POSITIONS.has(node.pos)) err(at, `bad position "${node.pos}"`);
        break;
      case 'expr':
        if (!CHARACTERS[node.who]) err(at, `unknown character "${node.who}"`);
        if (!exprOk(node.expr)) err(at, `unknown expression "${node.expr}"`);
        break;
      case 'move':
        if (!POSITIONS.has(node.pos)) err(at, `bad position "${node.pos}"`);
        break;
      case 'hide':
        if (!CHARACTERS[node.who]) err(at, `unknown character "${node.who}"`);
        break;
      case 'bgm':
        if (!BGM[node.id]) err(at, `unknown bgm "${node.id}"`);
        break;
      case 'amb':
        if (!AMB[node.id]) err(at, `unknown amb "${node.id}"`);
        break;
      case 'sfx':
        if (!SFX[node.id]) err(at, `unknown sfx "${node.id}"`);
        break;
      case 'choice': {
        if (!node.options || node.options.length < 2) err(at, 'choice needs >= 2 options');
        choices.push({ at, count: node.options?.length ?? 0 });
        const maxed = { bond: 0, honesty: 0, resolve: 0 };
        for (const o of node.options ?? []) {
          if (!o.text) err(at, 'option without text');
          if (o.rp) {
            for (const [key, val] of Object.entries(o.rp)) {
              if (!AXES.has(key)) err(at, `option rp has unknown axis "${key}"`);
              if (typeof val !== 'number') err(at, `option rp.${key} not a number`);
              if (val > maxed[key]) maxed[key] = val;
            }
          }
          if (o.reply && !Array.isArray(o.reply)) err(at, 'option reply must be an array');
        }
        node._max = maxed;
        break;
      }
      case 'label':
        if (labels.has(node.name)) err(at, `duplicate label "${node.name}"`);
        labels.add(node.name);
        break;
      case 'goto':
        gotos.push({ at, name: node.name });
        break;
      case 'branch':
        gotos.push({ at, name: node.then });
        if (node.else) gotos.push({ at, name: node.else });
        break;
      case 'endingGate':
        for (const [, target] of Object.entries(node.map ?? {})) {
          gotos.push({ at, name: target });
        }
        break;
      case 'ending':
        if (!ENDINGS.has(node.id)) err(at, `unknown ending "${node.id}"`);
        break;
      case 'set':
      case 'fx':
      case 'wait':
      case 'unlock':
        break;
      default:
        err(at, `unknown node type "${node.t}"`);
    }
  }

  for (const g of gotos) {
    if (!labels.has(g.name)) err(g.at, `goto/branch target "${g.name}" is not a label in this file`);
  }
  if (sayCount < 90) warn(name, `only ${sayCount} dialogue lines (bible asks for 120-160)`);

  const meta = ch;
  console.log(
    `  ok    ${name}  ch${String(meta.id).padStart(2, '0')} "${meta.title}"  `
    + `lines=${sayCount} nodes=${ch.body.length} choices=${choices.length} labels=${labels.size}`,
  );
}

console.log(`\n${targets.length} file(s) checked, ${hardErrors} error(s), ${warnings} warning(s)`);
if (hardErrors) process.exit(1);
