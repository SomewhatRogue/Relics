/**
 * The found relics beyond the javelin, hook and lodestone (shared/relickit.ts), fired and stepped for
 * the room: the gall bomb (lobbed, bursts), the wind-up bow (set down, shoots what comes near), the bone
 * bell (goblins flinch, friends quicken) and the butcher's knuckle (a line of force that marks what it
 * hits). Every one acts on goblins and the room's barrels and crates, and never on a friend: friends in
 * reach are spared (and told so) or helped. What they leave is in lists a friend's screen gets already.
 */
import { BELL, BOMB, HOBBLE, KNUCKLE, MARK, SENTRY, type Augment, type Swing } from '../shared/tuning';
import { shove } from './bodies';
import { lobLodestone, shoot } from './bolts';
import { damage, held, isDead, isDummy } from './damage';
import { afflict, type World } from './elements';
import { spotFor } from './facing';
import { damageProp } from './props';
import type { SkillRoom } from './skills';
import type { Bolt, Enemy, Hero, Zone } from './types';
import { stun } from './stuns';

const live = (e: Enemy, h: { z?: number }) => !isDead(e) && e.act !== 'carried' && (e.z ?? 0) === (h.z ?? 0);
const friends = (w: World) => w.heroes.filter((o) => o.id !== 'squire' && o.act !== 'down');

/** Fire one of these relics; false if `h.relic` isn't one of them. */
export function fireFound(h: Hero, r: SkillRoom, w: World): boolean {
  const el = h.augments[h.relic], aim = r.intents.get(h.id);
  switch (h.relic) {
    case 'bomb': return r.bolts.push(lobBomb(h, spotFor(h, w.enemies, aim, BOMB.range, BOMB.fallback), el)), true;
    case 'sentry': return r.zones.push(setSentry(h, w, el)), true;
    case 'bell': return ringBell(h, w, el), true;
    case 'knuckle': return knuckle(h, w, el), true;
    default: return false;
  }
}

/** The gall bomb, lobbed: it lands on its spot and bursts (bolts.ts), sparing friends. */
export function lobBomb(h: Hero, at: { x: number; y: number }, el: Augment): Bolt {
  const b = lobLodestone(h, 1, el);
  return { ...b, kind: 'bomb', tx: at.x, ty: at.y, flight: BOMB.flight, dmg: BOMB.dmg, knock: BOMB.knock, burst: BOMB.radius, stun: BOMB.stun, relic: true };
}

/** The wind-up bow, set down where the hero stands, turned the way they face. */
export function setSentry(h: Hero, w: World, el: Augment): Zone {
  w.ev.push({ k: 'sentry', x: h.x, y: h.y });
  return { kind: 'sentry', x: h.x + h.fx * 0.6, y: h.y + h.fy * 0.6, r: SENTRY.radius, at: w.now, next: w.now + 0.25, until: w.now + SENTRY.time, owner: h.id, el, ax: h.fx, ay: h.fy };
}

const BOLT: Swing = { windup: 0, active: 0, recover: 0, dmg: SENTRY.dmg, range: SENTRY.radius + 1, arc: 0, lunge: 0, knock: SENTRY.knock, shot: 'bolt', speed: SENTRY.speed };

/** Each wind-up bow, each tick: the nearest goblin in reach gets a bolt that spares friends and hobbles. */
export function stepSentries(zones: Zone[], bolts: Bolt[], w: World): void {
  for (const z of zones) {
    if (z.kind !== 'sentry') continue;
    if (w.now >= z.until) {
      if (z.at !== -1) (z.at = -1), w.ev.push({ k: 'sentryend', x: z.x, y: z.y });
      continue;
    }
    if (w.now < z.next) continue;
    z.next += SENTRY.every;
    let best: Enemy | null = null, bd = z.r;
    for (const e of w.enemies) {
      const d = Math.hypot(e.x - z.x, e.y - z.y) - e.radius;
      if (live(e, {}) && d <= bd) (bd = d), (best = e);
    }
    if (!best) continue;
    const dx = best.x - z.x, dy = best.y - z.y, l = Math.hypot(dx, dy) || 1;
    (z.ax = dx / l), (z.ay = dy / l);
    const by = { id: z.owner, x: z.x - z.ax * 0.5, y: z.y - z.ay * 0.5, fx: z.ax, fy: z.ay } as Hero;
    bolts.push({ ...shoot(by, BOLT, z.el), relic: true, hobble: true });
  }
}

/** Hobbled by a relic's bolt. */
export function hobble(e: Enemy, w: World): void {
  if (isDummy(e)) return;
  if ((e.hobbleUntil ?? -9) <= w.now) w.ev.push({ k: 'hobbled', x: e.x, y: e.y });
  e.hobbleUntil = w.now + HOBBLE.time;
}

/** The bone bell: goblins near flinch and drop their blows, small ones pushed back; friends near quicken. */
export function ringBell(h: Hero, w: World, el: Augment): void {
  w.ev.push({ k: 'bell', x: h.x, y: h.y });
  for (const e of w.enemies) {
    if (!live(e, h)) continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy);
    if (d > BELL.radius + e.radius) continue;
    e.lastBy = h.id;
    if (damage(e, BELL.dmg, w.now, w.ev, { tick: true, el: el || undefined })) continue;
    afflict(w, e, el, BELL.dmg);
    if (held(e, w.now) || isDummy(e)) continue;
    if (e.weight <= 1) shove(e, d > 0.05 ? dx / d : h.fx, d > 0.05 ? dy / d : h.fy, BELL.push, e.weight);
    if (e.weight <= 1) stun(e, h.id, w.now, BELL.small, w.ev, 'flinch');
    else if (!e.attack?.unblockable) stun(e, h.id, w.now, BELL.big, w.ev, 'flinch');
  }
  for (const o of friends(w)) {
    if (Math.hypot(o.x - h.x, o.y - h.y) > BELL.radius) continue;
    o.quickUntil = w.now + BELL.quickTime;
    w.ev.push({ k: 'quick', x: o.x, y: o.y });
  }
}

/** Where (px, py) is along the knuckle's line from the hero: how far down it, how far off it. */
const along = (h: Hero, px: number, py: number) => {
  const dx = px - h.x, dy = py - h.y;
  return { t: dx * h.fx + dy * h.fy, off: Math.abs(dx * -h.fy + dy * h.fx) };
};

/** The butcher's knuckle: a line of force from your front. Goblins and barrels in it fly; goblins are marked. */
export function knuckle(h: Hero, w: World, el: Augment): void {
  const L = KNUCKLE.length;
  w.ev.push({ k: 'knuckle', x: h.x, y: h.y, x2: h.x + h.fx * L, y2: h.y + h.fy * L });
  for (const e of w.enemies) {
    if (!live(e, h)) continue;
    const a = along(h, e.x, e.y);
    if (a.t < 0 || a.t > L + e.radius || a.off > KNUCKLE.width + e.radius) continue;
    e.lastBy = h.id;
    if (damage(e, KNUCKLE.dmg, w.now, w.ev, { heavy: true, dx: h.fx, dy: h.fy, el: el || undefined })) continue;
    if (e.act !== 'pinned') shove(e, h.fx, h.fy, KNUCKLE.knock, e.weight);
    afflict(w, e, el, KNUCKLE.dmg);
    if (!isDummy(e)) (e.markUntil = w.now + MARK.time), w.ev.push({ k: 'marked', x: e.x, y: e.y });
    if (!held(e, w.now) && !isDummy(e) && e.weight <= 1) stun(e, h.id, w.now, KNUCKLE.stun, w.ev);
  }
  for (const p of w.props) {
    if (p.broken || p.lifted) continue;
    const a = along(h, p.x, p.y);
    if (a.t < 0 || a.t > L + p.radius || a.off > KNUCKLE.width + p.radius) continue;
    p.lastBy = h.id;
    shove(p, h.fx, h.fy, KNUCKLE.knock, p.weight);
    damageProp(p, KNUCKLE.propDmg, w, h.fx, h.fy);
  }
  spare(w, h, (o) => {
    const a = along(h, o.x, o.y);
    return a.t >= 0 && a.t <= L && a.off <= KNUCKLE.width + 0.3;
  });
}

/** Friends inside a relic's reach (not the one who used it) are told it spared them. */
export function spare(w: World, by: { id: string } | null, inside: (o: Hero) => boolean): void {
  for (const o of friends(w)) if (o.id !== by?.id && inside(o)) w.ev.push({ k: 'spared', x: o.x, y: o.y });
}
