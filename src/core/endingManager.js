/**
 * Picks one of four endings from the relationship axes and flags.
 * Pure function of state, so tools/simulate-endings.mjs can test every path.
 *
 * Thresholds were tuned by walking all 531,441 choice combinations
 * (tools/simulate-endings.mjs) so that the four outcomes land at roughly
 * true 2%, good 31%, normal 36%, bad 31% for a player picking at random, and
 * so that a deliberate player reliably lands where they aimed:
 *   bad    bond under 30%, or the transfer pushed while the bond was thin, or
 *          she was pushed away and never repaired
 *   true   bond 48%+, honesty 30%+, resolve 38%+, honoured her wish and never
 *          pushed the transfer. A verified route: honest in ch01-03, ask Kaito
 *          about the transfer in ch04, admit fear instead of anger in ch05,
 *          tell Hina about the glitch in ch06, honour Mizuki in ch07, say the
 *          real thing on air. Lands at bond 78 / honesty 73 / resolve 50.
 *   good   bond 44%+ without the resolve to chase a solution
 *   normal everything else: he was there, but not enough of him was
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
  badBond: 0.30,
  pushGuard: 0.34,
  abandonGuard: 0.34,
  trueBond: 0.48,
  trueHonesty: 0.30,
  trueResolve: 0.38,
  goodBond: 0.44,
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
