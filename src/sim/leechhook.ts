/**
 * What THE LEECHMAN's blows do when they land (numbers shared/leechtune.ts), and the book's notes on them.
 * - THE LINE (sim/ownfoes.ts landed hands it here): a hero it catches is hauled to its feet (LEECHMAN.pull) and
 *   stunned a moment, and the PUNISH is next (`punish` in the notes: sim/leechman.ts takes it straight away).
 *   A hero who blocked or rolled out never reaches here. The lane ends at the first friend standing in it.
 * - THE LEECHES: a hero they land on has them latched (`leeched`: when the next drain is due), draining a
 *   little a second (sim/leechbook.ts) until they roll: each roll shakes them off.
 * The notes are the boss's own (a WeakMap on the room's BossBook, as the Listener's hearing): never on the
 * Hero, never sent. The events carry what the screen shows.
 */
import { LEECHMAN as L, HERO } from '../shared/tuning';
import { travelTo } from '../shared/sweep';
import { theBook, type BossBook } from './bosskit';
import { ropeReach } from './hempenboss';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';

export interface LeechState {
  /** Heroes with leeches on them: when the next drain is due. */
  leeched: Map<string, number>;
  /** The hero just hauled in, and until when the punish is theirs. */
  punish: { id: string; until: number } | null;
  /** A blow was under way last tick (the rest between blows starts when it ends), the next small ones, a peat bank's mud already laid. */
  was: boolean;
  nextAdds: number;
  mudDone: boolean;
}

const states = new WeakMap<BossBook, LeechState>();
export function leechState(bk: BossBook): LeechState {
  let s = states.get(bk);
  if (!s) states.set(bk, (s = { leeched: new Map(), punish: null, was: false, nextAdds: Infinity, mudDone: false }));
  return s;
}

/** In the line's wind-up: where its lane ends now (a friend who steps in front takes it). */
export function leechAim(e: Enemy, heroes: Hero[]): void {
  const a = e.attack;
  if (!a || (a.boss as string | undefined) !== 'line' || a.t >= a.windup) return;
  a.range = ropeReach(a, heroes, L.line.range!);
}

/** A blow of its landed on `h` (sim/ownfoes.ts landed). */
export function leechLanded(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[]): void {
  const bk = theBook();
  if (!bk) return;
  const st = leechState(bk);
  const move = a.boss as string | undefined;
  if (move === 'line') {
    const l = Math.hypot(e.x - h.x, e.y - h.y) || 1, x0 = h.x, y0 = h.y;
    travelTo(h, e.x - ((e.x - h.x) / l) * L.pull.to, e.y - ((e.y - h.y) / l) * L.pull.to, HERO.radius);
    Object.assign(h, { kvx: 0, kvy: 0, act: 'stun', actT: 0, actDur: L.pull.stun });
    st.punish = { id: h.id, until: now + 2.5 };
    ev.push({ k: 'hooked', x: x0, y: y0, x2: h.x, y2: h.y });
  } else if (move === 'leeches' && !st.leeched.has(h.id)) {
    st.leeched.set(h.id, now + L.leech.every);
    ev.push({ k: 'leech', what: 'latch', x: h.x, y: h.y, id: h.id });
  }
}
