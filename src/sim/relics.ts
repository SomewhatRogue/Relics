/**
 * The relics that act at once rather than flying: the Rogue's shadowstep, the Healer's blessed
 * ground and ward, the war horn.
 * (Javelin, hook, net and lodestone fly; see their own files.)
 */
import { healMult } from './lantern';
import { heals } from './hungry';
import { travel, travelTo } from '../shared/sweep';
import { BLESSING, HERO, HORN, SHADOWSTEP, WARD } from '../shared/tuning';
import { blessRadius, blessTime, hornReach, hornTime, wardHp, wardTime } from './knacks';
import { damage, held, isDead, isDummy } from './damage';
import { afflict, type World } from './elements';
import { daze } from './venom';
import type { Enemy, FightEvent, Hero, Intent, Zone } from './types';
import { stun } from './stuns';
import { gave } from './score';
import { wipeChalk } from './chalker';

/** Step behind the goblin you face (or the nearest one in reach), facing its back. */
export function shadowstep(h: Hero, enemies: Enemy[], ev: FightEvent[], now: number): void {
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
    // Through the dark, not through walls: a goblin with its back to a fence is stepped up to, not past.
    travelTo(h, best.x - best.fx * back, best.y - best.fy * back, HERO.radius);
    const dx = best.x - h.x, dy = best.y - h.y, d = Math.hypot(dx, dy) || 1;
    h.fx = dx / d;
    h.fy = dy / d;
    // Out of the dark at its back: it reels a moment, for free stabs (not mid striped blow or charge).
    if (!isDummy(best)) daze(best, SHADOWSTEP.stun, h.id, now, ev);
  } else {
    travel(h, h.fx * 3, h.fy * 3, HERO.radius);
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
  return { x, y, r: blessRadius(h), until: now + blessTime(h), next: now, owner: h.id, el };
}

/** Each blessed circle, every half second: allies in it mend and are blessed; goblins in it burn. Returns the ones still lit. */
export function stepZones(zones: Zone[], w: World): Zone[] {
  for (const z of zones) {
    // A skill's area (a volley, a fire ring) is stepped in areas.ts.
    if (z.kind || w.now < z.next) continue;
    z.next = w.now + BLESSING.every;
    for (const o of w.heroes) {
      if (o.act === 'down' || Math.hypot(o.x - z.x, o.y - z.y) > z.r) continue;
      o.blessedUntil = Math.max(o.blessedUntil, w.now + BLESSING.linger);
      // Blessed ground wipes a chalker's strokes (sim/chalker.ts).
      wipeChalk(o, w.enemies, w.now, w.ev);
      const by = w.heroes.find((x) => x.id === z.owner), n = Math.min(o.maxHp - o.hp, Math.round(heals(o, by, BLESSING.heal * healMult(by))));
      if (n > 0) (o.hp += n), gave(z.owner, o.id, n), w.ev.push({ k: 'heal', x: o.x, y: o.y, n });
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
  t.wardUntil = now + wardTime(h);
  t.wardHp = wardHp(h);
  if (t !== h) ev.push({ k: 'beam', x: h.x, y: h.y, x2: t.x, y2: t.y });
  ev.push({ k: 'ward', x: t.x, y: t.y });
}

/** The war cry: every goblin in earshot wakes and comes for this hero, and nobody else, for a while;
 *  small ones right beside them flinch. */
export function rally(h: Hero, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  ev.push({ k: 'rally', x: h.x, y: h.y });
  h.rallyUntil = now + hornTime(h);
  for (const e of enemies) {
    const d = Math.hypot(e.x - h.x, e.y - h.y);
    if (isDead(e) || d > hornReach(h)) continue;
    Object.assign(e, { alert: true, feeding: false });
    if (e.weight <= 1 && !held(e, now) && d <= HORN.scare) stun(e, h.id, now, 0.5, ev, 'flinch');
  }
}
