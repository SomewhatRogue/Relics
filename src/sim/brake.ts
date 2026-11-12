/**
 * THE BRAKESMAN (docs/design/open-cut-arc.md, over the top: the incline; docs/decisions/instances.md). It works the
 * brake at the top of the incline (`map.incline`: lanes of rail running down it, from `y0` by the brake to `y1` at
 * the foot) and lets the carts go at whoever's climbing.
 * - At its post (`home`) it swings at whoever comes close, but never leaves the brake.
 * - Every BRAKE.every s (BRAKE.fast once it's low) a cart comes up to the top of the lane the nearest climber is in
 *   (or nearest to): its lane is striped for BRAKE.warn s (`goAt`), then it runs down and knocks flat whoever's in
 *   that lane, once each a run (striped: only out of the lane saves you). It stops at the foot, or a cart's length
 *   short of one standing there.
 * - A power hit (a held attack let go) landing on a cart coming down at you flips it back up the lane (BRAKE.flip):
 *   the skill way. Late, and the cart has you first. One going up smashes one coming down off the rails.
 * - GRAB held BRAKE.grab s by a cart standing on a lane sends the head of that lane's queue back up. Reaching the top
 *   it jolts the brake and the Brakesman's knocked off: hurt, stunned BRAKE.down s and OPEN (INSTANCE.open), and no
 *   carts for BRAKE.off s; off the brake it comes for you, then walks back to it (BRAKE.walk).
 * It never dozes (sim/sleep.ts): its lanes run further than an area's wake distance. Plain data on the goblin and the
 * carts (`brakes`, `goAt`, `roll`), so a friend's screen and a handed-on room have it; who's holding GRAB is kept here
 * only (a hold starts over after a handover).
 */
import { currentMap, type GameMap } from '../shared/arena';
import { BRAKE, GRAB, HERO, INSTANCE, TICK } from '../shared/tuning';
import { hitHero } from './combat';
import { currentSwing } from './hero';
import { damage, isDead } from './damage';
import type { World } from './elements';
import { newProp } from './props';
import { stun } from './stuns';
import { goTo } from './tasks';
import type { Enemy, EnemyAttack, Hero, Prop } from './types';

type Incline = NonNullable<GameMap['incline']>;
const holds = new WeakMap<object, { seen: Map<string, number>; hold: Map<string, { cart: number; at: number }>; hits: Map<number, Set<string>> }>();
/** Where it stood last tick walking back to its brake (not saved). */
const back = new WeakMap<Enemy, { x: number; y: number }>();
/** The lane a cart is on, if any (a cart off the lanes is only a cart). */
const laneOf = (p: { x: number }, m = currentMap()) => m.incline?.lanes.find((x) => Math.abs(p.x - x) < 0.05);
/** A cart on a lane, or on the Haulier's rail (sim/haulcarts.ts, whose GRAB this button shows too). */
const isCart = (p: Prop, m = currentMap()) => p.kind === 'cart' && !p.broken && (laneOf(p, m) !== undefined || Math.abs(p.y - (m.rail?.y ?? -99)) < 0.05);
const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';
const free = (e: Enemy, now: number) => !isDead(e) && now >= e.brakes!.off && e.act !== 'stunned';
/** At its post and working the brake (not knocked off, not walking back to it). */
const onBrake = (e: Enemy, now: number) => free(e, now) && Math.hypot(e.x - e.home.x, e.y - e.home.y) < 0.4;
/** A cart standing on a lane or the rail (not rolling, not waiting to go at the top): GRAB sends it. */
export const resting = (p: Prop) => isCart(p) && !p.roll && p.goAt === undefined;

/** `h`'s power hit is striking now (its blow's active frames, or just after), and reaches `p` coming down its lane. */
function flips(h: Hero, p: Prop, lane: number): boolean {
  if (h.act !== 'attack' || !h.heavy || !up(h) || (h.z ?? 0) !== 0) return false;
  const s = currentSwing(h), ahead = h.y - p.y;
  if (h.actT < s.windup || h.actT > s.windup + s.active + BRAKE.flipLate) return false;
  return Math.abs(h.x - lane) <= BRAKE.width / 2 + HERO.radius && ahead > -HERO.radius && ahead <= Math.min(s.range, BRAKE.flip) + p.radius;
}

/** The cart standing just up the lane from `p`, touching it (a queue). */
const ahead = (props: Prop[], p: Prop) => props.find((o) => o !== p && resting(o) && o.x === p.x && o.y < p.y && p.y - o.y < 2 * p.radius + 0.12);

/** A cart's run down a lane at a hero in it: striped, a knock flat. */
function blow(p: Prop, h: Hero, e: Enemy): EnemyAttack {
  return {
    kind: 'charge', aimed: h.id, t: 0, windup: 0, active: 0.2, recover: 0, dmg: Math.round(BRAKE.dmg * (e.harm ?? 1)), knock: BRAKE.knock, unblockable: true,
    dx: 0, dy: Math.sign(p.roll ?? 1), ox: p.x, oy: p.y, range: 0, arc: 0, cx: h.x, cy: h.y, radius: 0.01, done: true,
  };
}

/** The nearest climber, and the lane nearest them. */
function aimLane(w: World, inc: Incline, e: Enemy): [number, Hero | undefined] {
  const ps = w.heroes.filter(up), h = ps.sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
  return [h ? inc.lanes.reduce((a, x) => (Math.abs(x - h.x) < Math.abs(a - h.x) ? x : a)) : inc.lanes[0], h];
}

/** A new cart up at the top of the aimed lane (the oldest at the foot tipped off if the incline's full). */
function bringUp(w: World, inc: Incline, e: Enemy): void {
  // (Its own lanes' carts only: the Haulier's at the loading stage above are none of its.)
  const carts = w.props.filter((p) => isCart(p) && laneOf(p) !== undefined);
  if (carts.some((p) => p.goAt !== undefined || (p.roll ?? 0) > 0)) return;
  // One sent back up and standing at the top goes next.
  const top = carts.find((p) => resting(p) && p.y <= inc.y0 + 0.3);
  if (top) {
    top.goAt = w.now + BRAKE.warn;
    w.ev.push({ k: 'cart', what: 'go', x: top.x, y: top.y, by: 'brake' });
    e.brakes!.next = w.now + BRAKE.warn + (e.hp < e.maxHp * BRAKE.below ? BRAKE.fast : BRAKE.every);
    return;
  }
  if (carts.length >= BRAKE.most) {
    const last = carts.filter(resting).sort((a, b) => b.y - a.y)[0];
    if (last) w.props.splice(w.props.indexOf(last), 1);
  }
  const [lane, h] = aimLane(w, inc, e), p = newProp('cart', lane, inc.y0, false);
  // The first few: how to send it back, said over whoever it's for.
  if (h && (e.brakes!.told ?? 0) < BRAKE.told) (e.brakes!.told = (e.brakes!.told ?? 0) + 1), w.ev.push({ k: 'cart', what: 'aim', x: h.x, y: h.y, on: h.id });
  p.id = 1 + w.props.reduce((m, q) => Math.max(m, q.id), 0);
  p.goAt = w.now + BRAKE.warn;
  w.props.push(p);
  w.ev.push({ k: 'cart', what: 'go', x: p.x, y: p.y, by: 'brake' });
  e.brakes!.next = w.now + BRAKE.warn + (e.hp < e.maxHp * BRAKE.below ? BRAKE.fast : BRAKE.every);
}

export function stepBrake(w: World): void {
  const e = w.enemies.find((x) => x.brakes), map = currentMap(), inc = map.incline;
  if (!e || !inc) return;
  const now = w.now;
  let st = holds.get(map);
  if (!st) holds.set(map, (st = { seen: new Map(), hold: new Map(), hits: new Map() }));
  // Its brake back in use: it walks back to it (its own chase this tick undone, or it rocks between you and it).
  if (free(e, now) && !onBrake(e, now)) {
    const was = back.get(e);
    if (was) Object.assign(e, { x: was.x, y: was.y, attack: null });
    goTo(e, e.home.x, e.home.y, BRAKE.walk, TICK);
    back.set(e, { x: e.x, y: e.y });
  } else back.delete(e);
  if (onBrake(e, now)) {
    Object.assign(e, { x: e.home.x, y: e.home.y, kvx: 0, kvy: 0 });
    // (Only once someone's come near enough to hear it: an area's wake distance from its brake.)
    const near = w.heroes.some((h) => up(h) && Math.hypot(h.x - e.home.x, h.y - e.home.y) < Math.max(INSTANCE.wake, inc.y1 - inc.y0 + 2));
    if (near && now >= e.brakes!.next) bringUp(w, inc, e);
  }
  // GRAB pressed by a cart standing on a lane, and kept by it: the head of its queue goes back up.
  for (const h of w.heroes) {
    const prev = st.seen.get(h.id);
    st.seen.set(h.id, h.seen.grab);
    if (prev === undefined || prev === h.seen.grab || !up(h)) continue;
    const c = w.props.filter((p) => resting(p) && laneOf(p, map) !== undefined).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
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
    let go = p;
    for (let next = ahead(w.props, go); next; next = ahead(w.props, go)) go = next;
    Object.assign(go, { roll: -BRAKE.speed, rollBy: h.id });
    st.hits.set(go.id, new Set());
    w.ev.push({ k: 'cart', what: 'go', x: go.x, y: go.y, by: h.id });
  }
  for (const p of w.props) {
    const lane = laneOf(p, map);
    if (lane === undefined || !isCart(p, map)) continue;
    // Its lane striped at the top; then down it.
    if (p.goAt !== undefined) {
      if (now < p.goAt) continue;
      Object.assign(p, { goAt: undefined, roll: BRAKE.speed, rollBy: 'brake' });
      st.hits.set(p.id, new Set());
    }
    if (!p.roll) continue;
    const seen = st.hits.get(p.id) ?? st.hits.set(p.id, new Set()).get(p.id)!;
    Object.assign(p, { x: lane, y: p.y + p.roll * TICK, kvx: 0, kvy: 0 });
    // A power hit on it as it comes: back up it goes, sent by whoever hit it.
    const by = p.roll > 0 ? w.heroes.find((h) => !seen.has(h.id) && flips(h, p, lane)) : undefined;
    if (by) {
      Object.assign(p, { roll: -BRAKE.speed, rollBy: by.id });
      st.hits.set(p.id, new Set());
      by.hitstop = Math.max(by.hitstop, 0.08);
      w.ev.push({ k: 'cart', what: 'flip', x: p.x, y: p.y, by: by.id });
      continue;
    }
    if (p.roll > 0) for (const h of w.heroes) {
      if (seen.has(h.id) || !up(h) || (h.z ?? 0) !== 0) continue;
      if (Math.abs(h.x - lane) > BRAKE.width / 2 + HERO.radius || Math.abs(h.y - p.y) > p.radius + HERO.radius) continue;
      seen.add(h.id);
      hitHero(e, blow(p, h, e), h, now, w.ev, w.heroes);
      w.ev.push({ k: 'cart', what: 'hit', x: h.x, y: h.y, by: 'brake', on: h.id });
    }
    // Going up, it meets one coming down: that one's smashed off the rails, and on it goes.
    if (p.roll < 0) for (const o of w.props) {
      if (o === p || o.x !== lane || !isCart(o, map) || (o.roll ?? 0) <= 0 || Math.abs(o.y - p.y) > 2 * p.radius + 0.1) continue;
      Object.assign(o, { broken: true, roll: 0, rollBy: undefined });
      st.hits.delete(o.id);
      w.ev.push({ k: 'cart', what: 'hit', x: o.x, y: o.y, by: p.rollBy, on: 'cart' });
    }
    // Sent back up to the top: it jolts the brake, and the Brakesman's knocked off.
    if (p.roll < 0 && p.y <= inc.y0 + 0.2) {
      if (!seen.has('brake') && onBrake(e, now)) {
        seen.add('brake');
        Object.assign(e, { takes: INSTANCE.open.mult, openUntil: now + INSTANCE.open.time, lastBy: p.rollBy ?? e.lastBy });
        damage(e, BRAKE.hit, now, w.ev, { heavy: true, dx: 0, dy: -1 });
        stun(e, p.rollBy, now, BRAKE.down, w.ev, 'stunned', true, true);
        Object.assign(e.brakes!, { off: now + BRAKE.off, next: now + BRAKE.off });
        w.ev.push({ k: 'opened', x: e.x, y: e.y }, { k: 'cart', what: 'hit', x: e.x, y: e.y, by: p.rollBy, on: 'brake' });
      }
    }
    // It stops at the end it's running to, or a cart's length short of one standing there.
    const dir = Math.sign(p.roll), gap = 2 * p.radius + 0.02, end = dir > 0 ? inc.y1 : inc.y0;
    const block = w.props.find((o) => o !== p && resting(o) && o.x === lane && (o.y - p.y) * dir > 0 && (o.y - p.y) * dir < gap + 0.05);
    if (block || (p.y - end) * dir >= 0) {
      Object.assign(p, { y: block ? block.y - dir * gap : end, roll: 0, rollBy: undefined });
      st.hits.delete(p.id);
      w.ev.push({ k: 'cart', what: 'stop', x: p.x, y: p.y });
    }
  }
}
