/**
 * Loot by the party's level (Kyle, 2026-11-05; numbers shared/threat.ts LEVEL_SCALE): the stronger the
 * party, the better what drops, gently. Each level past the first leans the odds: plain down, Forged and
 * PRE-WAR up, the rare three up a little, Fine taking up the difference so the odds still add up; capped
 * at LEVEL_SCALE.most levels. Same draws from the stream as before, so a level-1 party's rolls are what
 * they were. A drop's item level is its own (shared/itemlevel.ts, budget.ts `raise`); it no longer
 * comes as a free plus.
 */
import type { Tier } from './loot.js';
import { LEVEL_SCALE } from './threat.js';

const RARE: Tier[] = ['touched', 'turning', 'hungry'];
/**
 * The rare three's lean a level, gentler than LEVEL_SCALE.rare (docs/design/gear-levels.md section 2: a
 * high level doesn't make reds common; the item level is what a high level gives you now).
 */
export const RARE_LEAN = 0.012;

/** `odds` leaned for a party of average level `lv` (unchanged at level 1). */
export function leanOdds(odds: [Tier, number][], lv: number): [Tier, number][] {
  const k = Math.min(LEVEL_SCALE.most, Math.max(0, lv - 1));
  if (k <= 0) return odds;
  const total = odds.reduce((s, [, p]) => s + p, 0), fine = odds.find(([t]) => t === 'fine')?.[1] ?? 0;
  const lean = (t: Tier) => (RARE.includes(t) ? RARE_LEAN : LEVEL_SCALE.lean[t as keyof typeof LEVEL_SCALE.lean] ?? 0);
  const out = odds.map(([t, p]) => [t, t === 'fine' ? 0 : p * Math.max(0, 1 + lean(t) * k)] as [Tier, number]);
  // Fine takes up the difference; if that would leave too little of it, the leaning is scaled back.
  const rest = out.reduce((s, [, p]) => s + p, 0), left = total - rest, keep = fine * LEVEL_SCALE.floor;
  if (left >= keep) return out.map(([t, p]) => [t, t === 'fine' ? left : p]);
  const sq = (total - keep) / rest;
  return out.map(([t, p]) => [t, t === 'fine' ? keep : p * sq]);
}
