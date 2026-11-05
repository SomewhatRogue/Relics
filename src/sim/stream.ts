/**
 * The wand's storm tap: a stream of lightning from the hand (numbers: shared/spellbook.ts STREAM; Kyle,
 * 2026-11-04). Each tap keeps it on a little longer; it holds the nearest goblin in front, ticking damage
 * that builds the longer it stays on that goblin, and starts building again when it breaks off or the
 * goblin dies. While it's on, the Mage walks slowly. Storm's rules hold: it ignores shields, and on a wet
 * goblin it lands harder and jumps on to every wet one near, every tick (sim/elements.ts). Kept on the
 * hero (`stream`), so a guest draws the same line from the same goblin at the same build.
 */
import { STORM, STREAM } from '../shared/tuning';
import { castElement } from './channel';
import { damage, isDead, isDummy } from './damage';
import { afflict, newCast, type World } from './elements';
import type { Enemy, Hero, Intent } from './types';
import { wet } from './wet';

/** A wand in storm: its tap is the stream. */
export const streams = (h: Hero) => h.weapon === 'wand' && castElement(h) === 'storm';

/** On now. */
export const streaming = (h: Hero, now: number) => !!h.stream && now < h.stream.until;

/** How far built (1 to STREAM.top), held on its goblin since `at`. */
export const streamBuild = (at: number, now: number) => 1 + (STREAM.top - 1) * Math.min(1, Math.max(0, now - at) / STREAM.build);

/** Your pace while it's on. */
export const streamPace = (h: Hero, now: number) => (streaming(h, now) ? STREAM.pace : 1);

/** A tap let go: the stream comes on, or stays on STREAM.keep longer. `tick`: the spark's damage now (mult counted). */
export function feedStream(h: Hero, spark: number, now: number): void {
  const tick = spark * STREAM.tick;
  if (!h.stream || now >= h.stream.until) h.stream = { id: 0, at: now, until: now + STREAM.keep, next: now, tick, owe: 0, oweJump: 0 };
  else Object.assign(h.stream, { until: now + STREAM.keep, tick });
}

const angle = (h: Hero, e: Enemy) => {
  const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
  return (Math.acos(Math.max(-1, Math.min(1, (dx * h.fx + dy * h.fy) / d))) * 180) / Math.PI;
};
const reachable = (h: Hero, e: Enemy, reach: number, cone: number) =>
  !isDead(e) && e.act !== 'carried' && (e.z ?? 0) === (h.z ?? 0) && Math.hypot(e.x - h.x, e.y - h.y) - e.radius <= reach && angle(h, e) <= cone;

/** The goblin it's on: the one it holds while it can, else the nearest in front (goblins before dummies). */
function target(h: Hero, enemies: Enemy[]): Enemy | undefined {
  const st = h.stream!, held = st.id ? enemies.find((e) => e.id === st.id) : undefined;
  if (held && reachable(h, held, STREAM.reach + STREAM.slack, STREAM.keepCone)) return held;
  let best: Enemy | undefined, bd = Infinity;
  for (const e of enemies) {
    if (!reachable(h, e, STREAM.reach, STREAM.cone)) continue;
    const d = Math.hypot(e.x - h.x, e.y - h.y) + (isDummy(e) ? 2.5 : 0);
    if (d < bd) (bd = d), (best = e);
  }
  return best;
}

/** On a phone (no aim) the Mage stays turned to the goblin the stream holds. True if it did. */
export function streamFace(h: Hero, inp: Intent, enemies: Enemy[], now: number): boolean {
  if (!streaming(h, now) || !h.stream!.id || inp.ax || inp.ay) return false;
  const e = enemies.find((o) => o.id === h.stream!.id && !isDead(o));
  const l = e ? Math.hypot(e.x - h.x, e.y - h.y) : 0;
  if (!e || l < 0.01) return false;
  (h.fx = (e.x - h.x) / l), (h.fy = (e.y - h.y) / l);
  return true;
}

/** Every stream in the room, a tick. */
export function stepStreams(w: World): void {
  for (const h of w.heroes) {
    const st = h.stream;
    if (!st) continue;
    if (w.now >= st.until || h.act === 'down' || !streams(h)) {
      h.stream = undefined;
      continue;
    }
    const e = target(h, w.enemies);
    // Broken off (or a new one): it starts building again.
    if ((e?.id ?? 0) !== st.id) Object.assign(st, { id: e?.id ?? 0, at: w.now, owe: 0, oweJump: 0 });
    if (!e || w.now < st.next) continue;
    st.next = Math.max(st.next + STREAM.every, w.now);
    const build = streamBuild(st.at, w.now), soaked = wet(e) ? STORM.wet : 1;
    st.owe += st.tick * build * soaked;
    if (soaked > 1) st.oweJump += st.tick * build * STORM.share * soaked;
    const n = Math.floor(st.owe), j = Math.floor(st.oweJump);
    st.owe -= n;
    st.oweJump -= j;
    e.lastBy = h.id;
    // (A tick: wet already counted, so damage() doesn't count it again. It marks the goblin hit only now
    // and then, so it flickers white rather than staying white: client/foes.ts flashes on `hitAt`.)
    const was = e.hitAt;
    if (n > 0 && damage(e, n, w.now, w.ev, { el: 'storm', src: 'spark', tick: true })) continue;
    if (w.now - was < STREAM.flicker) e.hitAt = was;
    afflict(w, e, 'storm', n, { cast: newCast(), jump: j });
  }
}
