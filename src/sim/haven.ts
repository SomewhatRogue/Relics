/**
 * Where someone freed runs to (Kyle, 2026-11-17: "anyone you rescue has to run SUPER far out ... should just be
 * able to run to the next gate"). On a map in stretches (a territory, an instance on one map: sim/stretches.ts)
 * that is the nearest of the way in, the way out and every gate, open or shut: at a gate they are through the
 * hedge and gone, as they are at the way in. On any other map, the way in, as ever.
 */
import type { GameMap } from '../shared/arena';

type P = { x: number; y: number };

export function haven(m: GameMap, s: P, entrance: P | null): P | null {
  if (!entrance || !m.stretches?.length) return entrance;
  let best = entrance, bd = Math.hypot(entrance.x - s.x, entrance.y - s.y);
  const take = (p: P) => {
    const d = Math.hypot(p.x - s.x, p.y - s.y);
    if (d < bd) (bd = d), (best = p);
  };
  for (const st of m.stretches) {
    if (st.gate === undefined || !st.at || !st.check) continue;
    // Whichever side of the gate they're on: where the party gathers before it, or the checkpoint beyond it.
    const near = { x: st.at.x + st.at.w / 2, y: st.at.y + st.at.h / 2 }, far = st.check;
    take(Math.hypot(near.x - s.x, near.y - s.y) <= Math.hypot(far.x - s.x, far.y - s.y) ? near : far);
  }
  if (m.exit) take({ x: m.exit.x + m.exit.w / 2, y: m.exit.y + m.exit.h / 2 });
  return best;
}
