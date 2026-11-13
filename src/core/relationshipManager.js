/** Tracks the three relationship axes and the maximum obtainable per axis. */

export const AXES = ['bond', 'honesty', 'resolve'];

export class RelationshipManager {
  constructor(state) {
    this.state = state;
    if (!this.state.rp) this.state.rp = { bond: 0, honesty: 0, resolve: 0 };
    if (!this.state.possible) this.state.possible = { bond: 0, honesty: 0, resolve: 0 };
  }

  /** Record the ceiling for a choice group so ratios stay meaningful. */
  registerChoice(options) {
    for (const axis of AXES) {
      let best = 0;
      for (const o of options ?? []) {
        const v = o.rp?.[axis];
        if (typeof v === 'number' && v > best) best = v;
      }
      if (best > 0) this.state.possible[axis] += best;
    }
  }

  apply(option) {
    const rp = option?.rp ?? {};
    const delta = {};
    for (const axis of AXES) {
      const v = rp[axis];
      if (typeof v === 'number' && v !== 0) {
        this.state.rp[axis] += v;
        delta[axis] = v;
      }
    }
    return delta;
  }

  ratio(axis) {
    const possible = this.state.possible[axis] || 0;
    if (!possible) return 0;
    return Math.max(0, Math.min(1, this.state.rp[axis] / possible));
  }

  snapshot() {
    return {
      bond: Math.round(this.ratio('bond') * 100),
      honesty: Math.round(this.ratio('honesty') * 100),
      resolve: Math.round(this.ratio('resolve') * 100),
    };
  }
}
