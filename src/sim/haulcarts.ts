/**
 * The Haulier's working (docs/design/deep-bosses.md; numbers shared/haultune.ts): the ore carts on the rail
 * and the winding gear over the shaft. Run once a tick by sim/haulbook.ts.
 * - A cart at rest (on the rail at first, wherever it stopped after): a hero's GRAB beside it takes hold of it,
 *   held in front of them the way they face; GRAB again throws it that way (Kyle, 2026-11-12). The Haulier's
 *   shove (sim/haulier.ts) sends one at its hero. A rolling cart (`roll` its speed, signed for the wheels;
 *   `wx`, `wy` its way; `rollBy` who sent it) goes straight on till something stops it (sim/cartpath.ts).
 * - It hits a hero in its way for cart.dmg and cart.knock, judged as a striped boss blow (sim/combat.ts
 *   hitHero), once each a roll, never the one who threw it; a goblin for cart.addDmg; and the Haulier, knocked
 *   down cart.down s with its plate cracked, but not again for cart.again s after. Its own shove never hits it.
 * - The gear: lightning within gear.reach of it falls on it (sim/skystrike.ts), and cracks the plate of the
 *   Haulier within gear.r of it.
 */
import { collide, currentMap } from '../shared/arena';
import { SUMP_SPOTS } from '../shared/sumparena';
import { GRAB, HAULIER as H, HERO, TICK } from '../shared/tuning';
import { hitHero } from './combat';
import { isDead } from './damage';
import { crack } from './ironhide';
import { damage } from './damage';
import { cartPath } from './cartpath';
import { bossStun } from './poise';
import type { BossBook } from './bosskit';
import type { World } from './elements';
import type { Enemy, EnemyAttack, Hero, Prop } from './types';

/** What the book keeps between ticks (not saved with the room: a hold or a stray roll starts over). */
export interface HaulState {
  props: Prop[];
  seen: Map<string, number>;
  hold: Map<string, { cart: number; at: number }>;
  hits: Map<number, Set<string>>;
  /** A blow was under way last tick (so its rest is set when it ends); the next of the adits' small ones; the cart the shove is for. */
  was: boolean;
  nextAdds: number;
  shove: number;
}

const states = new WeakMap<BossBook, HaulState>();
export function haulState(bk: BossBook): HaulState {
  let s = states.get(bk);
  if (!s) states.set(bk, (s = { props: [], seen: new Map(), hold: new Map(), hits: new Map(), was: false, nextAdds: Infinity, shove: 0 }));
  return s;
}

const isCart = (p: Prop) => p.kind === 'cart' && !p.broken;
/** A cart at rest: not rolling and not held, wherever it stands (on the rail or wherever it was thrown to). */
export const standing = (p: Prop) => isCart(p) && !p.roll && !p.heldBy;
/** Where it would go if shoved from where it stands with no aim: along the rail, away from its nearer end. */
const railWay = (p: Prop): [number, number] => {
  const xs = SUMP_SPOTS.stops.map((s) => s.x);
  return [p.x < (Math.min(...xs) + Math.max(...xs)) / 2 ? 1 : -1, 0];
};
/** How far a cart standing here would roll along the rail (the Haulier's shove with nobody to aim at). */
export const farStop = (p: Prop) => p.x + railWay(p)[0] * cartPath(p.x, p.y, railWay(p)[0], 0, p.radius).len;

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

/** Set a cart rolling along (dx, dy) (along the rail, unaimed). */
export function sendCart(st: HaulState, p: Prop, by: string, ev: World['ev'], dx?: number, dy?: number): void {
  const [ux, uy] = dx === undefined || dy === undefined || (!dx && !dy) ? railWay(p) : [dx / Math.hypot(dx, dy), dy / Math.hypot(dx, dy)];
  Object.assign(p, { wx: ux, wy: uy, roll: (ux >= 0 ? 1 : -1) * H.cart.speed, rollBy: by, heldBy: undefined });
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

/** The carts once a tick: grabbed, held and aimed, thrown; rolls run on, what they hit, where they stop. */
export function stepCarts(st: HaulState, e: Enemy, w: World): void {
  const now = w.now;
  // GRAB pressed (the hero's own press counter moved): beside a cart at rest, take hold of it; holding one, throw it.
  for (const h of w.heroes) {
    const prev = st.seen.get(h.id);
    st.seen.set(h.id, h.seen.grab);
    if (prev === undefined || prev === h.seen.grab || !up(h)) continue;
    const held = w.props.find((p) => isCart(p) && p.heldBy === h.id);
    if (held) {
      // (Not the press that took hold of it: a moment's grace, cart.hold s.)
      if (now - (st.hold.get(h.id)?.at ?? -9) < H.cart.hold) continue;
      st.hold.delete(h.id);
      sendCart(st, held, h.id, w.ev, h.fx, h.fy);
      h.grabQueuedAt = -9;
      continue;
    }
    const c = nearestCart(w.props, h.x, h.y, GRAB.reach + 0.6);
    if (!c) continue;
    c.heldBy = h.id;
    st.hold.set(h.id, { cart: c.id, at: now });
    // (The press was for the cart: not "nothing to grab", and no goblin taken with it.)
    h.grabQueuedAt = -9;
    w.ev.push({ k: 'cart', what: 'grab', x: c.x, y: c.y, by: h.id });
  }
  // Held: in front of its hero, the way they face; let go if they fall, leave, or are knocked about.
  for (const p of w.props) {
    if (!isCart(p) || !p.heldBy) continue;
    const h = w.heroes.find((x) => x.id === p.heldBy);
    if (!h || !up(h) || h.act === 'stun' || h.act === 'hurt') {
      Object.assign(p, { heldBy: undefined });
      if (h) st.hold.delete(h.id);
      continue;
    }
    const q = { x: h.x + h.fx * (p.radius + HERO.radius + 0.15), y: h.y + h.fy * (p.radius + HERO.radius + 0.15) };
    collide(q, p.radius);
    Object.assign(p, { x: q.x, y: q.y, kvx: 0, kvy: 0 });
  }
  for (const p of w.props) {
    if (!isCart(p) || !p.roll) continue;
    const seen = st.hits.get(p.id) ?? st.hits.set(p.id, new Set()).get(p.id)!;
    const ux = p.wx ?? Math.sign(p.roll), uy = p.wy ?? 0, sp = Math.abs(p.roll);
    // On along its way; something in the way (a wall, a block, the edge) stops it where it is.
    const q = { x: p.x + ux * sp * TICK, y: p.y + uy * sp * TICK };
    collide(q, p.radius);
    const blocked = Math.hypot(q.x - (p.x + ux * sp * TICK), q.y - (p.y + uy * sp * TICK)) > 0.02;
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
      if (p.rollBy) g.lastBy = p.rollBy;
      Object.assign(g, { kvx: ux * 12, kvy: uy * 12 });
      damage(g, H.cart.addDmg, now, w.ev, { heavy: true, how: 'burst', dx: ux, dy: uy });
      w.ev.push({ k: 'cart', what: 'hit', x: g.x, y: g.y, by: p.rollBy, on: key });
    }
    // Stopped: by what's in its way, by a cart at rest in front of it (they never overlap), or gone far enough.
    const ahead = w.props.find((o) => o !== p && standing(o) && Math.hypot(o.x - p.x, o.y - p.y) < 2 * p.radius + 0.02 && (o.x - p.x) * ux + (o.y - p.y) * uy > 0);
    const run = (st.hits.get(p.id) as Set<string> & { run?: number }), went = (run.run = (run.run ?? 0) + sp * TICK);
    if (blocked || ahead || went >= H.cart.most) {
      Object.assign(p, { roll: 0, rollBy: undefined, wx: undefined, wy: undefined });
      st.hits.delete(p.id);
      w.ev.push({ k: 'cart', what: 'stop', x: p.x, y: p.y });
    }
  }
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
