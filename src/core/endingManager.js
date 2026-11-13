/**
 * Picks one of four endings from the relationship axes and flags.
 * Pure function of state, so tools/simulate-endings.mjs can test every path.
 *
 * Thresholds were re-tuned after the story rewrite by walking all 531,441
 * combinations (tools/simulate-endings.mjs). A player choosing at random lands
 * true 4.7% / good 26% / normal 39% / bad 30%, and a deliberate player lands
 * where they aimed:
 *   bad    he pushed the transfer while the bond was thin, he pushed her away
 *          and never repaired it, or he never bonded at all
 *   true   deep bond + honesty + some technical pursuit + honoured her wish.
 *          Verified route: honest throughout, ask Kaito about the transfer in
 *          ch04, stay with her in ch05, tell Hina in ch06, respect Mizuki in
 *          ch07. Lands at bond 81 / honesty 87 / resolve 27.
 *   good   he cared and showed up, but never chased a way to keep her
 *   normal he was around without ever saying the real thing
 *
 * "Technical only" play (resolve maxed, no bond) ends in bad on purpose: solving
 * the problem without caring about the person is the failure the story is about.
 */
export const ENDING_ORDER = ['true', 'good', 'normal', 'bad'];

export const ENDING_META = {
  true: {
    title: 'A Memory That Stays',
    subtitle: 'Kenangan yang tinggal',
    line: 'Kamu memilih untuk memperjuangkan waktu, dan kamu tidak melakukannya sendirian.',
    cg: 'cg_true',
  },
  good: {
    title: 'Our Last Broadcast',
    subtitle: 'Siaran terakhir kita',
    line: 'Kamu tidak menyelamatkan semuanya. Kamu hanya tidak pergi.',
    cg: 'cg_good',
  },
  normal: {
    title: 'The Voice in My Memory',
    subtitle: 'Suara di dalam ingatanku',
    line: 'Kamu menerima jawabannya, lalu belajar hidup dengan suara itu.',
    cg: 'cg_normal',
  },
  bad: {
    title: 'An Unanswered Frequency',
    subtitle: 'Frekuensi yang tidak dijawab',
    line: 'Kamu mengejar sesuatu. Kamu meninggalkan seseorang.',
    cg: 'cg_bad',
  },
};

export function ratioOf(state, axis) {
  const possible = state.possible?.[axis] || 0;
  if (!possible) return 0;
  return Math.max(0, Math.min(1, (state.rp?.[axis] || 0) / possible));
}

export const THRESHOLDS = {
  badBond: 0.08,
  pushGuard: 0.20,
  abandonGuard: 0.14,
  trueBond: 0.42,
  trueHonesty: 0.34,
  trueResolve: 0.22,
  goodBond: 0.36,
};

export function resolveEnding(state) {
  const flags = state.flags ?? {};
  const bond = ratioOf(state, 'bond');
  const honesty = ratioOf(state, 'honesty');
  const resolve = ratioOf(state, 'resolve');
  const T = THRESHOLDS;

  const pushedBlind = !!flags.pushedTransfer && bond < T.pushGuard;
  const abandoned = !!flags.pushedHerAway && bond < T.abandonGuard;
  if (bond < T.badBond || pushedBlind || abandoned) {
    return { id: 'bad', bond, honesty, resolve };
  }

  if (
    bond >= T.trueBond
    && honesty >= T.trueHonesty
    && resolve >= T.trueResolve
    && !!flags.honoredHerWish
    && !flags.pushedTransfer
  ) {
    return { id: 'true', bond, honesty, resolve };
  }

  if (bond >= T.goodBond) {
    return { id: 'good', bond, honesty, resolve };
  }

  return { id: 'normal', bond, honesty, resolve };
}

export class EndingManager {
  constructor(state) {
    this.state = state;
  }

  resolve() {
    const result = resolveEnding(this.state);
    this.state.ending = result.id;
    return result;
  }

  meta(id) {
    return ENDING_META[id] ?? ENDING_META.normal;
  }
}
