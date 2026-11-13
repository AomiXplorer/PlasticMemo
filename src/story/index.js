/**
 * Chapter registry. Order here is the play order; the engine follows ids.
 * Missing files are tolerated at runtime so the game stays playable during
 * development, but tools/validate-story.mjs fails the build if any is absent.
 */
import { ENDING_META, ENDING_ORDER } from '../core/endingManager.js';

const FILES = ['ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08'];

export const CHAPTERS = [];

for (const file of FILES) {
  try {
    // eslint-disable-next-line no-await-in-loop
    const mod = await import(`./${file}.js`);
    if (mod.chapter) CHAPTERS.push(mod.chapter);
  } catch (err) {
    console.error(`[story] chapter file ${file}.js could not load:`, err);
  }
}

export const TOTAL_CHAPTERS = FILES.length;
export { ENDING_META, ENDING_ORDER };

export function chapterById(id) {
  return CHAPTERS.find((c) => c.id === Number(id)) ?? null;
}

export function firstPlayableChapter() {
  return CHAPTERS[0]?.id ?? 1;
}
