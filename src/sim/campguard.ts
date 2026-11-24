/**
 * The camp's watch (shared/tuning.ts CAMP_GUARD; posts are `map.guards`): crossbowmen stand at their posts and the room shoots for them.
 * Each post, by the room's clock, looses a bolt every CAMP_GUARD.every seconds at the nearest living goblin in its range (never a boss
 * or a nest); the bolt lands after its flight, CAMP_GUARD.harm or CAMP_GUARD.share of the goblin's health, whichever is more. Posts are
 * staggered. Only a roaming land steps this (sim/landrules.ts).
 * Pays nothing: a goblin the watch fells is `unpaid` (no xp, no kill, no drop, no coin). Simplest rule: a goblin a hero had
 * already hurt and the watch finishes pays nothing either.
 */
import { CAMP_GUARD } from '../shared/tuning';
import { damage, isDead, isDummy } from './damage';
import type { ArenaRoom } from './room';
import type { Enemy, FightEvent } from './types';

type Flying = { at: number; e: Enemy; dx: number; dy: number };
type Watch = { next: number[]; air: Flying[] };
const watches = new WeakMap<ArenaRoom, Watch>();

const fair = (e: Enemy) => !isDead(e) && !e.boss && e.kind !== 'nest' && !isDummy(e) && !e.escaped;

/** A bolt arrives: it takes its share (by nobody's hand), and a kill is marked unpaid. */
function land(f: Flying, now: number, ev: FightEvent[]): void {
  const e = f.e;
  if (isDead(e)) return;
  const by = e.lastBy;
  e.unpaid = true;
  e.lastBy = '';
  damage(e, Math.max(CAMP_GUARD.harm, Math.round(CAMP_GUARD.share * e.maxHp)), now, ev, { src: 'bolt', flinch: 0.3, dx: f.dx, dy: f.dy });
  if (!isDead(e)) (e.unpaid = false), (e.lastBy = by);
}

/** Once a tick on a roaming land. */
export function stepGuards(room: ArenaRoom, ev: FightEvent[]): void {
  const posts = room.map.guards;
  if (!posts?.length) return;
  const now = room.time;
  let w = watches.get(room);
  if (!w) watches.set(room, (w = { next: posts.map((_, i) => now + (i * CAMP_GUARD.every) / posts.length), air: [] }));
  w.air = w.air.filter((f) => (f.at > now ? true : (land(f, now, ev), false)));
  posts.forEach((p, i) => {
    if (now < w!.next[i]) return;
    let t: Enemy | undefined, best = p.r;
    for (const e of room.allEnemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d <= best && fair(e)) (best = d), (t = e);
    }
    if (!t) return void (w!.next[i] = now);
    const l = best || 1, dx = (t.x - p.x) / l, dy = (t.y - p.y) / l;
    w!.next[i] = Math.max(w!.next[i] + CAMP_GUARD.every, now);
    ev.push({ k: 'shoot', x: p.x, y: p.y, dx, dy, kind: 'bolt', el: '', far: best });
    w!.air.push({ at: now + best / CAMP_GUARD.speed, e: t, dx, dy });
  });
}
