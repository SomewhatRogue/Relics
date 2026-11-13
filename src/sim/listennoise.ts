/**
 * What THE LISTENER hears (numbers shared/listentune.ts `noise`): each hero has a noise level in the boss's
 * own notes (never on the Hero). It rises to a level when they attack, roll, run at full stick or use a relic,
 * and falls off a little every second; creeping or standing still adds nothing. It goes for the loudest hero
 * up, ties to the nearest, and never uses sight. Run once a tick by sim/listenbook.ts.
 */
import { LISTENER as L, TICK } from '../shared/tuning';
import { taunts } from './taunt';
import type { BossBook } from './bosskit';
import type { Hero } from './types';

export interface ListenState {
  /** Each hero's noise level now, and the last blow and relic counts seen (a press is a sound even if it ends before the tick). */
  noise: Map<string, number>;
  seen: Map<string, [number, number]>;
  /** Each Warrior's last taunt ring seen (a taunt is a shout: the loudest sound there is). */
  rings: Map<string, number>;
  /** Each hero's health last tick (a hero hurt cries out). */
  hp: Map<string, number>;
  /** The book's own clocks: a blow was under way last tick, the next small ones out of the holes, when it rises from under the floor. */
  was: boolean;
  nextAdds: number;
  riseAt: number;
}

const states = new WeakMap<BossBook, ListenState>();
export function listenState(bk: BossBook): ListenState {
  let s = states.get(bk);
  if (!s) states.set(bk, (s = { noise: new Map(), seen: new Map(), rings: new Map(), hp: new Map(), was: false, nextAdds: Infinity, riseAt: -1 }));
  return s;
}

/** A hero it can go for: up, not the squire. */
export const hearable = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';

/** One tick of every hero's noise: what they did this tick raises it, time brings it down. */
export function hear(st: ListenState, heroes: Hero[]): void {
  const N = L.noise;
  for (const h of heroes) {
    let n = Math.max(0, (st.noise.get(h.id) ?? 0) - N.fall * TICK);
    if (hearable(h)) {
      const was = st.seen.get(h.id), now: [number, number] = [h.seen?.attack ?? 0, h.seen?.relic ?? 0];
      st.seen.set(h.id, now);
      if (h.act === 'attack' || h.act === 'charge' || (was && now[0] !== was[0])) n = Math.max(n, N.attack);
      if (h.act === 'roll') n = Math.max(n, N.roll);
      // (Hurt, a hero cries out: a still one a shield goblin reaches is heard.)
      if (h.hp < (st.hp.get(h.id) ?? h.hp)) n = Math.max(n, N.hurt);
      if (was && now[1] !== was[1]) n = Math.max(n, N.relic);
      // The Warrior's taunt is a shout: the top of the cap, each time its ring goes up.
      const ring = h.tauntRingAt;
      if (ring !== undefined && ring !== st.rings.get(h.id)) n = taunts(h) ? N.max : n;
      if (ring !== undefined) st.rings.set(h.id, ring);
      // (Creeping, `sneaking`, is quiet; so is standing still.)
      if (h.moving && !h.sneaking && h.act !== 'roll') n = Math.max(n, N.run);
    }
    st.hp.set(h.id, h.hp), st.noise.set(h.id, Math.min(N.max, n));
  }
}

/** The loudest hero up, ties (to within a hair) to the one nearest `from`; nobody if none is up. */
export function loudest(heroes: Hero[], noise: ReadonlyMap<string, number>, from: { x: number; y: number }): Hero | null {
  let best: Hero | null = null, bn = -1, bd = Infinity;
  for (const h of heroes) {
    if (!hearable(h)) continue;
    const raw = noise.get(h.id) ?? 0, n = raw < L.noise.quiet ? 0 : raw, d = Math.hypot(h.x - from.x, h.y - from.y);
    if (n > bn + 1e-6 || (Math.abs(n - bn) <= 1e-6 && d < bd)) (best = h), (bn = n), (bd = d);
  }
  return best;
}

/** The hole nearest `at`. */
export function nearestHole(holes: { x: number; y: number }[], at: { x: number; y: number }): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null, bd = Infinity;
  for (const p of holes) {
    const d = Math.hypot(p.x - at.x, p.y - at.y);
    if (d < bd) (bd = d), (best = p);
  }
  return best;
}
