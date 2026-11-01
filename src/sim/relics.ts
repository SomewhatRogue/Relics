/**
 * The relics that act at once rather than flying: the Rogue's shadowstep, the Healer's blessed
 * ground and ward, the war horn.
 * (Javelin, hook, net and lodestone fly; see their own files.)
 */
import { healMult } from './lantern';
import { collide } from '../shared/arena';
import { BLESSING, HERO, HORN, PERK, SHADOWSTEP, WARD } from '../shared/tuning';
import { damage, held, isDead, isDummy } from './damage';
import { afflict, type World } from './elements';
import type { Enemy, FightEvent, Hero, Intent, Zone } from './types';

/** Step behind the goblin you face (or the nearest one in reach), facing its back. */
export function shadowstep(h: Hero, enemies: Enemy[], ev: FightEvent[]): void {
  let best: Enemy | null = null, bd = Infinity;
  for (const e of enemies) {
    if (isDead(e) || e.act === 'carried') continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy);
    if (d > SHADOWSTEP.range) continue;
    // Goblins you face first; dummies last (they have no back).
    const score = d - ((dx * h.fx + dy * h.fy) / (d || 1)) * 2 + (isDummy(e) ? 6 : 0);
    if (score < bd) (bd = score), (best = e);
  }
  ev.push({ k: 'blink', x: h.x, y: h.y });
  if (best) {
    const back = best.radius + HERO.radius + 0.25;
    h.x = best.x - best.fx * back;
    h.y = best.y - best.fy * back;
    collide(h, HERO.radius);
    const dx = best.x - h.x, dy = best.y - h.y, d = Math.hypot(dx, dy) || 1;
    h.fx = dx / d;
    h.fy = dy / d;
  } else {
    h.x += h.fx * 3;
    h.y += h.fy * 3;
    collide(h, HERO.radius);
  }
  h.kvx = h.kvy = 0;
  ev.push({ k: 'shadow', x: h.x, y: h.y });
}

/** The ally a Healer means: nearest where they point (a laptop), else the most hurt in reach (others before yourself on a tie). */
function allyFor(h: Hero, heroes: Hero[], aim: Intent | undefined, range: number): Hero {
  const near = heroes.filter((o) => o.act !== 'down' && Math.hypot(o.x - h.x, o.y - h.y) <= range);
  let target = h;
  if (aim && (aim.ax || aim.ay)) {
    const px = h.x + aim.ax, py = h.y + aim.ay;
    let bd = Infinity;
    for (const o of near) {
      const d = Math.hypot(o.x - px, o.y - py);
      if (d < bd) (bd = d), (target = o);
    }
    return target;
  }
  let low = Infinity;
  for (const o of near) {
    const share = o.hp / o.maxHp - (o === h ? 0 : 0.001);
    if (share < low) (low = share), (target = o);
  }
  return target;
}

/** Bless the ground: at the Healer's feet, or where they point (within reach). */
export function hallow(h: Hero, aim: Intent | undefined, now: number, el: Zone['el'], ev: FightEvent[]): Zone {
  let x = h.x, y = h.y;
  if (aim && (aim.ax || aim.ay)) {
    const d = Math.hypot(aim.ax, aim.ay), k = Math.min(1, BLESSING.range / (d || 1));
    (x = h.x + aim.ax * k), (y = h.y + aim.ay * k);
  }
  ev.push({ k: 'hallow', x, y });
  return { x, y, r: BLESSING.radius * (h.perks.includes('devotion') ? PERK.devotion : 1), until: now + BLESSING.time, next: now, owner: h.id, el };
}

/** Each blessed circle, every half second: allies in it mend and are blessed; goblins in it burn. Returns the ones still lit. */
export function stepZones(zones: Zone[], w: World): Zone[] {
  for (const z of zones) {
    if (w.now < z.next) continue;
    z.next = w.now + BLESSING.every;
    for (const o of w.heroes) {
      if (o.act === 'down' || Math.hypot(o.x - z.x, o.y - z.y) > z.r) continue;
      o.blessedUntil = Math.max(o.blessedUntil, w.now + BLESSING.linger);
      const n = Math.min(o.maxHp - o.hp, Math.round(BLESSING.heal * healMult(w.heroes.find((x) => x.id === z.owner))));
      if (n > 0) (o.hp += n), w.ev.push({ k: 'heal', x: o.x, y: o.y, n });
    }
    for (const e of w.enemies) {
      if (isDead(e) || isDummy(e) || Math.hypot(e.x - z.x, e.y - z.y) > z.r + e.radius) continue;
      if (!damage(e, BLESSING.hurt, w.now, w.ev, { tick: true, how: 'burn', src: 'smite' })) afflict(w, e, z.el, BLESSING.hurt);
    }
  }
  return zones.filter((z) => w.now < z.until);
}

/** Ward an ally (or yourself): a shell that takes the blows and throws arrows back. */
export function ward(h: Hero, heroes: Hero[], aim: Intent | undefined, now: number, ev: FightEvent[]): void {
  const t = allyFor(h, heroes, aim, WARD.range);
  t.wardUntil = now + WARD.time;
  t.wardHp = WARD.hp * (h.perks.includes('devotion') ? PERK.devotion : 1);
  if (t !== h) ev.push({ k: 'beam', x: h.x, y: h.y, x2: t.x, y2: t.y });
  ev.push({ k: 'ward', x: t.x, y: t.y });
}

/** Sound the war horn: every ally in earshot is rallied; small goblins close by flinch. */
export function rally(h: Hero, heroes: Hero[], enemies: Enemy[], now: number, ev: FightEvent[]): void {
  ev.push({ k: 'rally', x: h.x, y: h.y });
  for (const o of heroes) {
    if (o.act === 'down' || Math.hypot(o.x - h.x, o.y - h.y) > HORN.radius) continue;
    o.stamina = HERO.stamina;
    o.rallyUntil = now + HORN.time;
    ev.push({ k: 'rallied', x: o.x, y: o.y });
  }
  for (const e of enemies) {
    if (isDead(e) || e.weight > 1 || held(e, now) || Math.hypot(e.x - h.x, e.y - h.y) > HORN.scare) continue;
    Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: 0.5 });
  }
}
