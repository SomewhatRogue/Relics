/**
 * THE BRAKESMAN (docs/design/instances.md, the workings; docs/decisions/instances.md): it works the brake at the
 * top of the rail across the last chamber (map.rail, its top end `x0`, by the brake) and lets the carts go.
 * - On its brake it stands at its post (`home`). It swings at whoever comes close, but never leaves the brake.
 * - Every BRAKE.every s (BRAKE.fast once it's low) a cart comes up to the top: its lane is striped for BRAKE.warn s
 *   (`goAt`), then it runs down the rail and knocks flat whoever's in its lane, once each a run (striped: only out
 *   of the lane saves you). It stops at the bottom, or a cart's length short of one already there.
 * - GRAB held BRAKE.grab s beside a cart standing on the rail sends it back up. If it reaches the Brakesman at the
 *   top, it's knocked off the brake: hurt, stunned BRAKE.down s and OPEN (INSTANCE.open), and no carts for BRAKE.off s;
 *   off the brake it comes for you. Then it walks back to the brake (BRAKE.walk).
 * It never dozes (sim/sleep.ts): the rail is longer than an area's wake distance, and the carts are its.
 * Plain data on the goblin and the carts (`brakes`, `goAt`, `roll`), so a friend's screen and a handed-on room
 * have it; who's holding GRAB is kept here only (a hold starts over after a handover).
 */
import { currentMap } from '../shared/arena';
import { BRAKE, GRAB, HERO, INSTANCE, TICK } from '../shared/tuning';
import { hitHero } from './combat';
import { damage, isDead } from './damage';
import type { World } from './elements';
import { newProp } from './props';
import { stun } from './stuns';
import { goTo } from './tasks';
import type { Enemy, EnemyAttack, Hero, Prop } from './types';

type Rail = { y: number; x0: number; x1: number };
const holds = new WeakMap<object, { seen: Map<string, number>; hold: Map<string, { cart: number; at: number }>; hits: Map<number, Set<string>> }>();
/** Where it stood last tick walking back to its brake (not saved). */
const back = new WeakMap<Enemy, { x: number; y: number }>();
/** A cart on the rail (the chamber's others, off it, are only carts). */
const isCart = (p: Prop) => p.kind === 'cart' && !p.broken && Math.abs(p.y - (currentMap().rail?.y ?? -99)) < 0.05;
const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';
const free = (e: Enemy, now: number) => !isDead(e) && now >= e.brakes!.off && e.act !== 'stunned';
/** At its post and working the brake (not knocked off, not walking back to it). */
const onBrake = (e: Enemy, now: number) => free(e, now) && Math.hypot(e.x - e.home.x, e.y - e.home.y) < 0.4;
/** A cart standing on the rail (not rolling, not waiting to go at the top). */
export const resting = (p: Prop) => isCart(p) && !p.roll && p.goAt === undefined;

/** The cart standing just up the rail from `p`, touching it (a queue). */
const ahead = (props: Prop[], p: Prop) => props.find((o) => o !== p && resting(o) && o.x < p.x && p.x - o.x < 2 * p.radius + 0.12);

/** A cart's run down the rail at a hero in its lane: striped, a knock flat. */
function blow(p: Prop, h: Hero, e: Enemy): EnemyAttack {
  return {
    kind: 'charge', aimed: h.id, t: 0, windup: 0, active: 0.2, recover: 0, dmg: Math.round(BRAKE.dmg * (e.harm ?? 1)), knock: BRAKE.knock, unblockable: true,
    dx: Math.sign(p.roll ?? 1), dy: 0, ox: p.x, oy: p.y, range: 0, arc: 0, cx: h.x, cy: h.y, radius: 0.01, done: true,
  };
}

/** A new cart up at the top for the Brakesman to let go (the oldest at the bottom tipped off if the rail's full). */
function bringUp(w: World, rail: Rail, e: Enemy): void {
  const carts = w.props.filter(isCart);
  if (carts.some((p) => p.goAt !== undefined || (p.roll ?? 0) > 0)) return;
  if (carts.length >= BRAKE.most) {
    const last = carts.filter(resting).sort((a, b) => b.x - a.x)[0];
    if (last) w.props.splice(w.props.indexOf(last), 1);
  }
  const p = newProp('cart', rail.x0, rail.y, false);
  p.id = 1 + w.props.reduce((m, q) => Math.max(m, q.id), 0);
  p.goAt = w.now + BRAKE.warn;
  w.props.push(p);
  w.ev.push({ k: 'cart', what: 'go', x: p.x, y: p.y, by: 'brake' });
  e.brakes!.next = w.now + BRAKE.warn + (e.hp < e.maxHp * BRAKE.below ? BRAKE.fast : BRAKE.every);
}

export function stepBrake(w: World): void {
  const e = w.enemies.find((x) => x.brakes), rail = currentMap().rail;
  if (!e || !rail) return;
  const now = w.now, map = currentMap();
  let st = holds.get(map);
  if (!st) holds.set(map, (st = { seen: new Map(), hold: new Map(), hits: new Map() }));
  // At its post, braced, letting the carts go.
  // Its brake back in use: it walks back to it (its back to you), then works it.
  // (Its own chase this tick undone while it walks back, or it rocks between you and the brake.)
  if (free(e, now) && !onBrake(e, now)) {
    const was = back.get(e);
    if (was) Object.assign(e, { x: was.x, y: was.y, attack: null });
    goTo(e, e.home.x, e.home.y, BRAKE.walk, TICK);
    back.set(e, { x: e.x, y: e.y });
  } else back.delete(e);
  if (onBrake(e, now)) {
    Object.assign(e, { x: e.home.x, y: e.home.y, kvx: 0, kvy: 0 });
    // (Only once someone's come near enough to hear it: an area's wake distance from its brake.)
    const near = w.heroes.some((h) => up(h) && Math.hypot(h.x - e.home.x, h.y - e.home.y) < INSTANCE.wake);
    if (near && now >= e.brakes!.next) bringUp(w, rail, e);
  }
  // GRAB pressed by a cart standing on the rail, and kept by it: it goes back up.
  for (const h of w.heroes) {
    const prev = st.seen.get(h.id);
    st.seen.set(h.id, h.seen.grab);
    if (prev === undefined || prev === h.seen.grab || !up(h)) continue;
    const c = w.props.filter(resting).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
    if (c && Math.hypot(c.x - h.x, c.y - h.y) <= GRAB.reach + 0.6) st.hold.set(h.id, { cart: c.id, at: now });
  }
  for (const [id, hd] of [...st.hold]) {
    const h = w.heroes.find((x) => x.id === id), p = w.props.find((x) => x.id === hd.cart);
    if (!h || !p || !up(h) || !resting(p) || Math.hypot(p.x - h.x, p.y - h.y) > GRAB.reach + p.radius + 0.4) {
      st.hold.delete(id);
      continue;
    }
    if (now - hd.at < BRAKE.grab - 1e-6) continue;
    for (const [o, x] of [...st.hold]) if (x.cart === p.id) st.hold.delete(o);
    // (In a queue of carts it's the one at the head that goes: you push the lot.)
    let go = p;
    for (let next = ahead(w.props, go); next; next = ahead(w.props, go)) go = next;
    Object.assign(go, { roll: -BRAKE.speed, rollBy: h.id });
    st.hits.set(go.id, new Set());
    w.ev.push({ k: 'cart', what: 'go', x: go.x, y: go.y, by: h.id });
  }
  for (const p of w.props) {
    if (!isCart(p)) continue;
    // Its lane striped at the top; then down the rail.
    if (p.goAt !== undefined) {
      if (now < p.goAt) continue;
      Object.assign(p, { goAt: undefined, roll: BRAKE.speed, rollBy: 'brake' });
      st.hits.set(p.id, new Set());
    }
    if (!p.roll) continue;
    const seen = st.hits.get(p.id) ?? st.hits.set(p.id, new Set()).get(p.id)!;
    Object.assign(p, { y: rail.y, x: p.x + p.roll * TICK, kvx: 0, kvy: 0 });
    if (p.roll > 0) for (const h of w.heroes) {
      if (seen.has(h.id) || !up(h) || (h.z ?? 0) !== 0) continue;
      if (Math.abs(h.y - rail.y) > BRAKE.width / 2 + HERO.radius || Math.abs(h.x - p.x) > p.radius + HERO.radius) continue;
      seen.add(h.id);
      hitHero(e, blow(p, h, e), h, now, w.ev, w.heroes);
      w.ev.push({ k: 'cart', what: 'hit', x: h.x, y: h.y, by: 'brake', on: h.id });
    }
    // Sent back up: into the Brakesman at its brake, it's knocked off.
    if (p.roll < 0 && !seen.has('brake') && onBrake(e, now) && Math.abs(e.x - p.x) <= p.radius + e.radius + 0.3 && Math.abs(e.y - rail.y) <= BRAKE.width / 2 + e.radius + 1.2) {
      seen.add('brake');
      // Knocked off: OPEN while it's down (INSTANCE.open).
      Object.assign(e, { takes: INSTANCE.open.mult, openUntil: now + INSTANCE.open.time });
      w.ev.push({ k: 'opened', x: e.x, y: e.y });
      e.lastBy = p.rollBy ?? e.lastBy;
      damage(e, BRAKE.hit, now, w.ev, { heavy: true, dx: -1, dy: 0 });
      stun(e, p.rollBy, now, BRAKE.down, w.ev, 'stunned', true, true);
      Object.assign(e.brakes!, { off: now + BRAKE.off, next: now + BRAKE.off });
      w.ev.push({ k: 'cart', what: 'hit', x: e.x, y: e.y, by: p.rollBy, on: 'brake' });
    }
    // It stops at the end it's running to, or a cart's length short of one standing there.
    const dir = Math.sign(p.roll), gap = 2 * p.radius + 0.02, end = dir > 0 ? rail.x1 : rail.x0;
    const block = w.props.find((o) => o !== p && resting(o) && (o.x - p.x) * dir > 0 && (o.x - p.x) * dir < gap + 0.05);
    if (block || (p.x - end) * dir >= 0) {
      Object.assign(p, { x: block ? block.x - dir * gap : end, roll: 0, rollBy: undefined });
      st.hits.delete(p.id);
      w.ev.push({ k: 'cart', what: 'stop', x: p.x, y: p.y });
    }
  }
}
