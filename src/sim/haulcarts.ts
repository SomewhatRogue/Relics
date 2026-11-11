/**
 * The Haulier's working (docs/design/deep-bosses.md; numbers shared/haultune.ts): the ore carts on the rail
 * and the winding gear over the shaft. Run once a tick by sim/haulbook.ts.
 * - A cart stands at a stop. A hero's GRAB pressed next to it and kept near for HAULIER.cart.grab s, or the
 *   Haulier's shove (sim/haulier.ts), sets it rolling (`roll`, signed tiles a second along the rail, `rollBy`
 *   who sent it) to the other stop, where it stops. (The Intent carries a grab press, not a held flag, so
 *   "held" is: pressed, and stood by it for the time.)
 * - A rolling cart hits a hero in its lane for cart.dmg and cart.knock, judged as a striped boss blow
 *   (sim/combat.ts hitHero), once each a roll; and the Haulier: knocked down cart.down s, its plate cracked.
 *   The Haulier's own shove never hits the Haulier.
 * - The gear: lightning within gear.reach of it falls on it (sim/skystrike.ts), and cracks the plate of the
 *   Haulier within gear.r of it.
 */
import { currentMap } from '../shared/arena';
import { SUMP_SPOTS } from '../shared/sumparena';
import { GRAB, HAULIER as H, HERO, TICK } from '../shared/tuning';
import { hitHero } from './combat';
import { isDead } from './damage';
import { crack } from './ironhide';
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

const stopXs = () => SUMP_SPOTS.stops.map((s) => s.x).sort((a, b) => a - b);
const isCart = (p: Prop) => p.kind === 'cart' && !p.broken;
/** A cart standing at a stop (not rolling), or queued up to a cart's length and a half behind one that is. */
export const standing = (p: Prop) => isCart(p) && !p.roll && stopXs().some((x) => Math.abs(p.x - x) <= 1.6);
/** Which way it would roll from where it stands: toward the other stop. */
const laneDir = (p: Prop) => { const [lo, hi] = stopXs(); return p.x < (lo + hi) / 2 ? 1 : -1; };
/** How far a cart standing here rolls, and the far stop's x. */
export const farStop = (p: Prop) => { const [lo, hi] = stopXs(); return laneDir(p) > 0 ? hi : lo; };

/** The cart standing at a stop nearest (x, y), within `within` of it. */
export function nearestCart(props: Prop[], x: number, y: number, within = Infinity): Prop | undefined {
  let best: Prop | undefined, bd = within;
  for (const p of props) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (standing(p) && d <= bd) (bd = d), (best = p);
  }
  return best;
}

/** Set a cart rolling toward the other stop. */
export function sendCart(st: HaulState, p: Prop, by: string, ev: World['ev']): void {
  p.roll = laneDir(p) * H.cart.speed;
  p.rollBy = by;
  st.hits.set(p.id, new Set());
  ev.push({ k: 'cart', what: 'go', x: p.x, y: p.y, by });
}

const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';

/** A rolling cart's blow on a hero in its lane (striped: only a roll or a step out of the lane saves them). */
function blow(p: Prop, h: Hero, e: Enemy): EnemyAttack {
  return {
    kind: 'charge', aimed: h.id, t: 0, windup: 0, active: 0.2, recover: 0, dmg: Math.round(H.cart.dmg * (e.harm ?? 1)), knock: H.cart.knock, unblockable: true,
    dx: Math.sign(p.roll ?? 1), dy: 0, ox: p.x, oy: p.y, range: 0, arc: 0, cx: h.x, cy: h.y, radius: 0.01, done: true,
  };
}

/** The Haulier flat on its back for cart.down s, its plate cracked. */
function knockDown(e: Enemy, now: number, ev: World['ev']): void {
  const b = e.boss!;
  crack(e, now, ev);
  bossStun(e, H.cart.down);
  Object.assign(b, { downUntil: now + H.cart.down, rotAt: now + H.cart.down });
}

/** The carts once a tick: holds begun and finished, rolls run on, what they hit. */
export function stepCarts(st: HaulState, e: Enemy, w: World): void {
  const now = w.now, rail = currentMap().rail;
  if (!rail) return;
  // GRAB pressed beside a cart at a stop (the hero's own press counter moved): begin the hold.
  for (const h of w.heroes) {
    const prev = st.seen.get(h.id);
    st.seen.set(h.id, h.seen.grab);
    if (prev === undefined || prev === h.seen.grab || !up(h)) continue;
    const c = nearestCart(w.props, h.x, h.y, GRAB.reach + 0.6);
    if (c) st.hold.set(h.id, { cart: c.id, at: now });
  }
  for (const [id, hd] of [...st.hold]) {
    const h = w.heroes.find((x) => x.id === id), p = w.props.find((x) => x.id === hd.cart);
    if (!h || !p || !up(h) || !standing(p) || Math.hypot(p.x - h.x, p.y - h.y) > GRAB.reach + p.radius + 0.4) {
      st.hold.delete(id);
      continue;
    }
    if (now - hd.at < H.cart.grab - 1e-6) continue;
    for (const [o, x] of [...st.hold]) if (x.cart === p.id) st.hold.delete(o);
    sendCart(st, p, h.id, w.ev);
  }
  const [lo, hi] = stopXs();
  for (const p of w.props) {
    if (!isCart(p) || !p.roll) continue;
    const seen = st.hits.get(p.id) ?? st.hits.set(p.id, new Set()).get(p.id)!;
    p.y = rail.y;
    p.x += p.roll * TICK;
    p.kvx = p.kvy = 0;
    for (const h of w.heroes) {
      if (seen.has(h.id) || !up(h) || (h.z ?? 0) !== 0) continue;
      if (Math.abs(h.y - rail.y) > H.cart.width / 2 + HERO.radius || Math.abs(h.x - p.x) > p.radius + HERO.radius) continue;
      seen.add(h.id);
      hitHero(e, blow(p, h, e), h, now, w.ev, w.heroes);
      w.ev.push({ k: 'cart', what: 'hit', x: h.x, y: h.y, by: p.rollBy, on: h.id });
    }
    if (!seen.has('haulier') && p.rollBy !== 'haulier' && !isDead(e) && e.act !== 'carried' && Math.abs(e.x - p.x) <= p.radius + e.radius && Math.abs(e.y - rail.y) <= H.cart.width / 2 + e.radius) {
      seen.add('haulier');
      knockDown(e, now, w.ev);
      w.ev.push({ k: 'cart', what: 'hit', x: e.x, y: e.y, by: p.rollBy, on: 'haulier' });
    }
    // It stops at the far stop, or a cart's length short of a cart already standing there (they never overlap).
    const dir = Math.sign(p.roll), gap = 2 * p.radius + 0.02;
    const block = w.props.find((o) => o !== p && isCart(o) && !o.roll && (o.x - p.x) * dir > 0 && (o.x - p.x) * dir < gap + 0.05);
    if (block || (dir > 0 && p.x >= hi) || (dir < 0 && p.x <= lo)) {
      Object.assign(p, { x: block ? block.x - dir * gap : dir > 0 ? hi : lo, roll: 0, rollBy: undefined });
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
