/**
 * The wand's storm tap: a stream of lightning from the hand that runs by itself (numbers: shared/spellbook.ts
 * STREAM; Kyle, 2026-11-05). One tap starts it for STREAM.keep s; each tap while it's on adds a step of
 * build (three at most) and starts the time again. It holds the nearest goblin, in front or behind (so you
 * can run and keep it on), and if that one dies or gets away takes the next, keeping its build. Fully built it
 * also hops to the nearest other goblin as a low pulse. Walking while it's on is the Mage's own pace.
 * Storm's rules hold: it ignores shields, and on a wet goblin it lands harder and jumps on to every wet one
 * near, every tick (sim/elements.ts). Kept on the hero (`stream`), so a guest draws the same line from the
 * same goblin at the same build.
 */
import { wetMult } from './techmage';
import { ROD, STORM, STREAM } from '../shared/tuning';
import { isRod, jolt, rodHit, rodNear } from './rods';
import { castElement } from './channel';
import { damage, isDead, isDummy } from './damage';
import { afflict, newCast, type World } from './elements';
import type { Enemy, Hero, Intent } from './types';
import { wet } from './wet';

/** A wand in storm: its tap is the stream. */
export const streams = (h: Hero) => h.weapon === 'wand' && castElement(h) === 'storm';

/** On now. */
export const streaming = (h: Hero, now: number) => !!h.stream && now < h.stream.until;

/** The most steps of build. */
export const STREAM_TOP = STREAM.steps.length;

/** How far built at `step` (1 to STREAM_TOP): its damage multiplier. */
export const streamBuild = (step: number) => STREAM.steps[Math.max(1, Math.min(STREAM_TOP, step)) - 1];

/** A tap let go: the stream comes on at the first step, or (on already) a step higher and on STREAM.keep
 *  from now. `spark`: the tap's damage now (mult counted). */
export function feedStream(h: Hero, spark: number, now: number): void {
  const tick = spark * STREAM.tick;
  if (!h.stream || now >= h.stream.until) h.stream = { id: 0, step: 1, at: now, until: now + STREAM.keep, next: now, tick, owe: 0, oweJump: 0 };
  else Object.assign(h.stream, { step: Math.min(STREAM_TOP, h.stream.step + 1), at: now, until: now + STREAM.keep, tick });
}

const angle = (h: Hero, e: Enemy) => {
  const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
  return (Math.acos(Math.max(-1, Math.min(1, (dx * h.fx + dy * h.fy) / d))) * 180) / Math.PI;
};
const reachable = (h: Hero, e: Enemy, reach: number, cone: number) =>
  !isDead(e) && e.act !== 'carried' && (e.z ?? 0) === (h.z ?? 0) && Math.hypot(e.x - h.x, e.y - h.y) - e.radius <= reach && angle(h, e) <= cone;

/** The goblin it's on: the one it holds while it can, else the nearest in front (goblins before dummies), or
 *  an ironhide within ROD.reach of that one and in the stream's reach, which draws it (sim/rods.ts). */
function target(h: Hero, enemies: Enemy[]): Enemy | undefined {
  const st = h.stream!, e = nearest(h, enemies);
  if (!e || e.id === st.id) return e;
  return rodNear(enemies, e.x, e.y, ROD.reach, (o) => reachable(h, o, STREAM.reach + STREAM.slack, 180)) ?? e;
}

function nearest(h: Hero, enemies: Enemy[]): Enemy | undefined {
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
    // Its goblin dead or away (or a first one): it takes the next, keeping its build. Drawn into iron, the guard breaks.
    if ((e?.id ?? 0) !== st.id) {
      const was = nearest(h, w.enemies);
      if (e && isRod(e) && was && was !== e) rodHit(e, was.x, was.y, w.now, w.ev);
      else if (e && isRod(e)) jolt(e, w.now, w.ev);
      Object.assign(st, { id: e?.id ?? 0, owe: 0, oweJump: 0 });
    }
    if (!e || w.now < st.next) continue;
    st.next = Math.max(st.next + STREAM.every, w.now);
    const build = streamBuild(st.step), soaked = wet(e) ? wetMult(h, STORM.wet) : 1;
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
    hop(h, e, w);
  }
}

/** Fully built: a low pulse on to the nearest other goblin near the one held (none below the top step). */
function hop(h: Hero, e: Enemy, w: World): void {
  const st = h.stream!;
  if (st.step < STREAM_TOP || isDead(e)) return void (st.hop = 0);
  let best: Enemy | undefined, bd = Infinity;
  for (const o of w.enemies) {
    if (o === e || isDead(o) || isDummy(o) || o.act === 'carried' || (o.z ?? 0) !== (h.z ?? 0)) continue;
    const d = Math.hypot(o.x - e.x, o.y - e.y) - o.radius;
    if (d <= STREAM.hopReach && d < bd) (bd = d), (best = o);
  }
  st.hop = best?.id ?? 0;
  if (!best) return;
  st.oweHop = (st.oweHop ?? 0) + st.tick * streamBuild(st.step) * STREAM.hopShare;
  const n = Math.floor(st.oweHop);
  st.oweHop -= n;
  if (n <= 0) return;
  best.lastBy = h.id;
  const was = best.hitAt;
  if (damage(best, n, w.now, w.ev, { el: 'storm', src: 'spark', tick: true })) return;
  if (w.now - was < STREAM.flicker) best.hitAt = was;
}
