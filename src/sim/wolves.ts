/**
 * Wolves and their keeper (numbers: shared/prowlers.ts WOLF, KEEPER). Wolves circle whoever they're
 * after, working round to the side or the back, and dart in from there (a short red lane: block it,
 * get out of it). They keep near their keeper; the keeper keeps behind them and cracks its
 * whip. Kill the keeper and they scatter: they run, and any that get far enough from everyone are gone.
 */
import { KEEPER, SCRAPPER, WOLF } from '../shared/tuning';
import { isDead } from './damage';
import { begin, walk } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';

export function shapeWolf(e: Enemy): void {
  Object.assign(e, { radius: WOLF.radius, weight: 0.5 });
}

const keeperOf = (e: Enemy, others: Enemy[]) => others.find((o) => o.variant === 'keeper' && o.pack === e.pack && !isDead(o));
export const scattered = (e: Enemy, now: number) => (e.scatterUntil ?? -9) > now;

/** A wolf's turn. */
export function stepWolf(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, slow: number, heroes: Hero[], others: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  const pace = SCRAPPER.speed * WOLF.speed * slow;
  if (scattered(e, now)) {
    const dx = e.x - t.x, dy = e.y - t.y, l = Math.hypot(dx, dy) || 1;
    (e.fx = dx / l), (e.fy = dy / l);
    return walk(e, dx / l + (e.side ?? 1) * 0.4 * (dy / l), dy / l - (e.side ?? 1) * 0.4 * (dx / l), pace * 1.1, dt);
  }
  const k = keeperOf(e, others), loose = e.scatterUntil !== undefined;
  // Strayed too far from its keeper: back to it.
  if (k && Math.hypot(k.x - e.x, k.y - e.y) > WOLF.leash && d > WOLF.orbit * 1.5) return walk(e, k.x - e.x, k.y - e.y, pace, dt);
  if (e.cooldown <= 0 && d <= WOLF.dart.range! && facing > 0.85) return begin(e, 'pounce', WOLF.dart, t, ev);
  // Its keeper gone (and back from scattering): straight in, one at a time.
  if (loose) return void (d > WOLF.dart.range! * 0.8 && walk(e, ux, uy, pace * 0.8 * Math.max(0.3, facing), dt));
  // Circling: round the ring at WOLF.orbit toward their side or back (its own side), never through them.
  const behind = Math.atan2(-t.fy, -t.fx), cur = Math.atan2(e.y - t.y, e.x - t.x), wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  // Its side: the one it's already on, kept (so two of a pack don't cross each other's path).
  e.side ??= Math.abs(wrap(behind + 0.9 - cur)) <= Math.abs(wrap(behind - 0.9 - cur)) ? 1 : -1;
  const back = behind + e.side * 0.9;
  const diff = Math.atan2(Math.sin(back - cur), Math.cos(back - cur)), s = Math.sign(diff) || 1;
  const round = Math.min(1, Math.abs(diff) * 3), out = (WOLF.orbit - d) * 1.4;
  const mx = -Math.sin(cur) * s * round + Math.cos(cur) * out, my = Math.cos(cur) * s * round + Math.sin(cur) * out;
  if (Math.hypot(mx, my) > 0.15) walk(e, mx, my, pace, dt);
  // On its spot and ready: face them for the dart.
  if (Math.abs(diff) < 0.35 && Math.abs(d - WOLF.orbit) < 0.7 && e.cooldown <= 0) (e.fx = ux), (e.fy = uy);
}

/** The keeper: behind its wolves, the whip for anyone who comes close, running from a blade. */
export function stepKeeper(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, speed: number, others: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  if (Math.floor(now / KEEPER.crack) !== Math.floor((now - dt) / KEEPER.crack) && e.alert) ev.push({ k: 'whip', x: e.x, y: e.y });
  if (e.cooldown <= 0 && d <= KEEPER.lash.range! && facing > 0.8) return begin(e, 'stab', KEEPER.lash, t, ev);
  if (d < KEEPER.keep) {
    const side = Math.sin(now * 0.7 + e.id) > 0 ? 1 : -1;
    return walk(e, -ux - uy * side * 0.6, -uy + ux * side * 0.6, speed * KEEPER.flee, dt);
  }
  const pack = others.filter((o) => o.variant === 'wolf' && o.pack === e.pack && !isDead(o));
  const px = pack.length ? pack.reduce((s, o) => s + o.x, 0) / pack.length : t.x, py = pack.length ? pack.reduce((s, o) => s + o.y, 0) / pack.length : t.y;
  const gx = px - ux * KEEPER.behind, gy = py - uy * KEEPER.behind, gd = Math.hypot(gx - e.x, gy - e.y);
  if (gd > 0.8) walk(e, gx - e.x, gy - e.y, speed * Math.min(1, gd / 2), dt);
}

/** Once a tick: a keeper just killed scatters its wolves; a scattering wolf far from everyone is gone. */
export function stepPacks(enemies: Enemy[], heroes: Hero[], now: number, ev: FightEvent[]): void {
  for (const k of enemies) {
    if (k.variant !== 'keeper' || !isDead(k) || k.spent) continue;
    k.spent = true;
    for (const w of enemies) if (w.variant === 'wolf' && w.pack === k.pack && !isDead(w)) (w.scatterUntil = now + WOLF.scatter), (w.attack = null), (w.act = 'chase'), ev.push({ k: 'scatter', x: w.x, y: w.y });
  }
  for (const w of enemies) {
    if (w.variant !== 'wolf' || isDead(w) || !scattered(w, now)) continue;
    if (heroes.some((h) => h.act !== 'down' && Math.hypot(h.x - w.x, h.y - w.y) < WOLF.gone)) continue;
    Object.assign(w, { act: 'dead', actT: 99, hp: 0, attack: null, escaped: true, respawns: false, death: '' });
  }
}
