/**
 * The Haulier's working (docs/design/deep-bosses.md; numbers shared/haultune.ts): the carts on its tracks and
 * the winding gear over the shaft. Run once a tick by sim/haulbook.ts.
 * - Tracks (Kyle, 2026-11-12): every `track.every` s one is picked (sim/trackshape.ts), warned (`boss.track`:
 *   its lamps, then a striped lane for the last `track.lane` s), and a cart bursts out of one mouth, rolls the
 *   whole track at `track.speed` and goes into the far one (gone). Never two at once.
 * - A cart at rest (on a siding at first, wherever a hurled one stopped after) is the Haulier's to hurl
 *   (sim/haulier.ts: it lifts it, `heldBy: 'haulier'`, and sends it at its hero). GRAB does nothing to one.
 * - A rolling cart (`roll` its speed, `wx`, `wy` its way; `rollBy` 'track' or who hurled it) hits a hero in its
 *   way for cart.dmg and cart.knock, judged as a striped boss blow (sim/combat.ts hitHero), once each a roll,
 *   a goblin for cart.addDmg, flung, and the Haulier, knocked down cart.down s with its plate cracked, but not
 *   again for cart.again s after. Its own hurl never hits it. A hurled one goes straight on till something
 *   stops it (sim/cartpath.ts); a track's runs through.
 * - The gear: lightning within gear.reach of it falls on it (sim/skystrike.ts), and cracks the plate of the
 *   Haulier within gear.r of it.
 */
import { collide, currentMap } from '../shared/arena';
import { HAULIER as H, HERO, TICK } from '../shared/tuning';
import { Rng } from '../shared/rng';
import { hitHero } from './combat';
import { isDead } from './damage';
import { crack } from './ironhide';
import { damage } from './damage';
import { bossStun } from './poise';
import { newProp } from './props';
import { pickTrack, tracksOf, trackWay } from './trackshape';
import type { BossBook } from './bosskit';
import type { World } from './elements';
import type { Enemy, EnemyAttack, Hero, Prop } from './types';

/** What the book keeps between ticks (not saved with the room: a stray roll starts over). */
export interface HaulState {
  props: Prop[];
  hits: Map<number, Set<string>>;
  /** A blow was under way last tick (so its rest is set when it ends); the next of the adits' small ones; the cart the hurl is for. */
  was: boolean;
  nextAdds: number;
  hurl: number;
  /** The next track's warning begins at this room time (Infinity till the fight does); the last one run (-1 none). */
  next: number;
  last: number;
  /** Its own seeded stream (from the room's seeded swaps), so the fire's is never spent on it. */
  rng: Rng;
}

const states = new WeakMap<BossBook, HaulState>();
export function haulState(bk: BossBook): HaulState {
  let s = states.get(bk);
  if (!s) states.set(bk, (s = { props: [], hits: new Map(), was: false, nextAdds: Infinity, hurl: 0, next: Infinity, last: -1, rng: new Rng(((bk.swaps[0] ?? 0) * 977 + (bk.swaps[1] ?? 0) * 31 + 4099) >>> 0) }));
  return s;
}

// (Not THE BRAKESMAN's, on its incline's lanes in the same map over the top: sim/brake.ts has those.)
const onLane = (p: Prop) => !!currentMap().incline?.lanes.some((x) => Math.abs(p.x - x) < 0.05);
const isCart = (p: Prop) => p.kind === 'cart' && !p.broken && !onLane(p);
/** A cart at rest: not rolling and not held, wherever it stands (on a siding or wherever it was hurled to). */
export const standing = (p: Prop) => isCart(p) && !p.roll && !p.heldBy;
const onTrack = (p: Prop) => p.rollBy === 'track';

/** The cart at rest nearest (x, y), within `within` of it. */
export function nearestCart(props: Prop[], x: number, y: number, within = Infinity): Prop | undefined {
  let best: Prop | undefined, bd = within;
  for (const p of props) {
    if (!standing(p)) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= bd) (best = p), (bd = d);
  }
  return best;
}

/** Set a cart rolling along (dx, dy), at `speed` (a hurled one's by default). */
export function sendCart(st: HaulState, p: Prop, by: string, ev: World['ev'], dx: number, dy: number, speed: number = H.cart.speed): void {
  const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  Object.assign(p, { wx: ux, wy: uy, roll: (ux !== 0 ? ux : uy) >= 0 ? speed : -speed, rollBy: by, heldBy: undefined });
  st.hits.set(p.id, new Set());
  ev.push({ k: 'cart', what: 'go', x: p.x, y: p.y, by });
}

const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';

/** A rolling cart's blow on a hero in its way (striped: only a roll or a step out of the way saves them). */
function blow(p: Prop, h: Hero, e: Enemy): EnemyAttack {
  return {
    kind: 'charge', aimed: h.id, t: 0, windup: 0, active: 0.2, recover: 0, dmg: Math.round(H.cart.dmg * (e.harm ?? 1)), knock: H.cart.knock, unblockable: true,
    dx: p.wx ?? Math.sign(p.roll ?? 1), dy: p.wy ?? 0, ox: p.x, oy: p.y, range: 0, arc: 0, cx: h.x, cy: h.y, radius: 0.01, done: true,
  };
}

/** The Haulier flat on its back for cart.down s, its plate cracked; but not again for cart.again s (no stun-locking it). */
function knockDown(e: Enemy, now: number, ev: World['ev']): boolean {
  const b = e.boss!;
  if ((e.holdUntil ?? -9) > now) return void ev.push({ k: 'shrug', x: e.x, y: e.y }), false;
  e.holdUntil = now + H.cart.down + H.cart.again;
  crack(e, now, ev);
  bossStun(e, H.cart.down);
  Object.assign(b, { downUntil: now + H.cart.down, rotAt: now + H.cart.down });
  return true;
}

/** The tracks: warn the next one when it is due, then send its cart as the warning runs out. */
function stepTracks(st: HaulState, e: Enemy, w: World): void {
  const b = e.boss!, now = w.now, tracks = tracksOf(), W = b.track;
  if (!tracks.length) return;
  if (W) {
    if (now < W.go) return;
    b.track = undefined;
    const t = tracks[W.i], m = trackWay(t, W.from), p = newProp('cart', m.ax - m.dx * 0.5, m.ay - m.dy * 0.5, false);
    // (A number of its own, past every prop's: the room's later ones never meet it.)
    p.id = 1 + w.props.reduce((n, q) => Math.max(n, q.id), 0);
    w.props.push(p);
    sendCart(st, p, 'track', w.ev, m.dx, m.dy, H.track.speed);
    // (It bursts out of the mouth: the event is there, not where the cart starts.)
    w.ev[w.ev.length - 1] = { k: 'cart', what: 'go', x: m.ax, y: m.ay, by: 'track' };
    return;
  }
  if (now < st.next || w.props.some((p) => onTrack(p))) return;
  const i = pickTrack(tracks, e, st.last, st.rng.next()), from = (st.rng.next() < 0.5 ? 1 : 0) as 0 | 1;
  st.last = i;
  st.next = now + H.track.every[b.phase];
  b.track = { i, from, at: now, lane: now + H.track.warn - H.track.lane, go: now + H.track.warn };
  const m = trackWay(tracks[i], from);
  w.ev.push({ k: 'cart', what: 'warn', x: m.ax, y: m.ay });
}

/** Whether a cart is out past the room's edge (into a mouth): gone. */
const gone = (p: Prop) => {
  const m = currentMap(), pad = 0.9;
  return p.x < -pad || p.y < -pad || p.x > m.w + pad || p.y > m.h + pad;
};

/** The carts once a tick: the one the Haulier holds, the tracks' warnings and carts, rolls run on, what they hit, where they stop. */
export function stepCarts(st: HaulState, e: Enemy, w: World): void {
  const now = w.now;
  stepTracks(st, e, w);
  // Held overhead by the Haulier for its hurl; let go (where it stands) if the blow is no more.
  for (const p of w.props) {
    if (!isCart(p) || p.heldBy !== 'haulier') continue;
    const a = e.attack;
    if (!a || (a.boss as string | undefined) !== 'hurl' || e.act === 'carried') Object.assign(p, { heldBy: undefined });
    else Object.assign(p, { x: e.x, y: e.y + 0.01, kvx: 0, kvy: 0 });
  }
  for (const p of [...w.props]) {
    if (!isCart(p) || !p.roll) continue;
    const seen = st.hits.get(p.id) ?? st.hits.set(p.id, new Set()).get(p.id)!, track = onTrack(p);
    const ux = p.wx ?? Math.sign(p.roll), uy = p.wy ?? 0, sp = Math.abs(p.roll);
    // On along its way. A hurled one is stopped by what is in the way (a wall, a block, the edge); a track's runs through.
    const q = { x: p.x + ux * sp * TICK, y: p.y + uy * sp * TICK };
    if (!track) collide(q, p.radius);
    const blocked = !track && Math.hypot(q.x - (p.x + ux * sp * TICK), q.y - (p.y + uy * sp * TICK)) > 0.02;
    Object.assign(p, { x: q.x, y: q.y, kvx: 0, kvy: 0 });
    for (const h of w.heroes) {
      if (seen.has(h.id) || !up(h) || (h.z ?? 0) !== 0 || h.id === p.rollBy) continue;
      if (Math.hypot(h.x - p.x, h.y - p.y) > p.radius + HERO.radius) continue;
      seen.add(h.id);
      hitHero(e, blow(p, h, e), h, now, w.ev, w.heroes);
      w.ev.push({ k: 'cart', what: 'hit', x: h.x, y: h.y, by: p.rollBy, on: h.id });
    }
    if (!seen.has('haulier') && p.rollBy !== 'haulier' && !isDead(e) && e.act !== 'carried' && Math.hypot(e.x - p.x, e.y - p.y) <= p.radius + e.radius) {
      seen.add('haulier');
      knockDown(e, now, w.ev);
      w.ev.push({ k: 'cart', what: 'hit', x: e.x, y: e.y, by: p.rollBy, on: 'haulier' });
    }
    // Its goblins too: a heavy blow, flung along its way.
    for (const g of w.enemies) {
      const key = 'e' + g.id;
      if (g === e || g.boss || isDead(g) || seen.has(key) || Math.hypot(g.x - p.x, g.y - p.y) > p.radius + g.radius) continue;
      seen.add(key);
      if (p.rollBy && !track) g.lastBy = p.rollBy;
      Object.assign(g, { kvx: ux * 12, kvy: uy * 12 });
      damage(g, H.cart.addDmg, now, w.ev, { heavy: true, how: 'burst', dx: ux, dy: uy });
      w.ev.push({ k: 'cart', what: 'hit', x: g.x, y: g.y, by: p.rollBy, on: key });
    }
    // Into the far mouth: gone.
    if (track) {
      if (gone(p)) {
        w.props.splice(w.props.indexOf(p), 1);
        st.hits.delete(p.id);
        w.ev.push({ k: 'cart', what: 'gone', x: Math.max(0, Math.min(currentMap().w, p.x)), y: Math.max(0, Math.min(currentMap().h, p.y)) });
      }
      continue;
    }
    // Stopped: by what is in its way, by a cart at rest in front of it (they never overlap), or gone far enough.
    const ahead = w.props.find((o) => o !== p && standing(o) && Math.hypot(o.x - p.x, o.y - p.y) < 2 * p.radius + 0.02 && (o.x - p.x) * ux + (o.y - p.y) * uy > 0);
    const run = (st.hits.get(p.id) as Set<string> & { run?: number }), went = (run.run = (run.run ?? 0) + sp * TICK);
    if (blocked || ahead || went >= H.cart.most) {
      Object.assign(p, { roll: 0, rollBy: undefined, wx: undefined, wy: undefined });
      st.hits.delete(p.id);
      w.ev.push({ k: 'cart', what: 'stop', x: p.x, y: p.y });
    }
  }
}

/** The Haulier is dead: no cart runs on, no warning stands. */
export function clearTracks(e: Enemy | undefined, w: World): void {
  if (e?.boss) e.boss.track = undefined;
  for (let i = w.props.length - 1; i >= 0; i--) if (onTrack(w.props[i])) w.props.splice(i, 1);
}

/** The winding gear, if (x, y) is within gear.reach of it. */
export function gearAt(x: number, y: number): { x: number; y: number } | null {
  const g = currentMap().gear;
  return g && Math.hypot(x - g.x, y - g.y) <= H.gear.reach ? g : null;
}

/** Lightning has fallen on the gear: it crackles out gear.r, and the Haulier's plate within it cracks. */
export function gearStrike(g: { x: number; y: number }, w: World): void {
  let hit = false;
  for (const e of w.enemies) {
    if (e.boss?.who !== 'haulier' || isDead(e) || Math.hypot(e.x - g.x, e.y - g.y) > H.gear.r) continue;
    crack(e, w.now, w.ev);
    e.rodAt = w.now;
    hit = true;
  }
  w.ev.push({ k: 'gear', x: g.x, y: g.y, hit });
}
