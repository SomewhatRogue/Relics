/**
 * The Cleric's other skills. CENSER CHAIN: the censer's chain hauls a friend in need to the Cleric's
 * side, blessed; with no friend in reach it drags in the goblin they face. CENSER LIGHT: the censer
 * opened, its coal's light flooding out at the end of the windup (the ring is drawn from the same
 * LIGHT numbers): goblins in it scorched and thrown back, small ones blinded; friends in it mend.
 */
import { collide } from '../shared/arena';
import { CHAIN, HERO, LIGHT, type Augment } from '../shared/tuning';
import { shove } from './bodies';
import { damage, held, isDead, isDummy } from './damage';
import { afflict, type World } from './elements';
import { faced } from './facing';
import { heals } from './hungry';
import { healMult } from './lantern';
import type { Body, Hero, Intent } from './types';
import { stun } from './stuns';

/** The friend a chain means: nearest the pointer (a laptop), else the most hurt; never yourself. */
function friendFor(h: Hero, heroes: Hero[], aim: Intent | undefined): Hero | undefined {
  const near = heroes.filter((o) => o !== h && o.act !== 'down' && Math.hypot(o.x - h.x, o.y - h.y) <= CHAIN.range);
  const px = h.x + (aim?.ax ?? 0), py = h.y + (aim?.ay ?? 0), pointed = !!aim && (aim.ax || aim.ay);
  const score = (o: Hero) => (pointed ? Math.hypot(o.x - px, o.y - py) : o.hp / o.maxHp);
  return near.sort((a, b) => score(a) - score(b))[0];
}

/** Haul a body to just beside the Cleric. */
const towTo = (b: Body, h: Hero, gap: number, now: number) => {
  const dx = b.x - h.x, dy = b.y - h.y, d = Math.hypot(dx, dy) || 1;
  b.tow = { x: h.x + (dx / d) * gap, y: h.y + (dy / d) * gap, until: now + Math.max(0.25, d / CHAIN.speed + 0.1) };
};

export function censerChain(h: Hero, w: World, aim: Intent | undefined): void {
  const f = friendFor(h, w.heroes, aim);
  if (f) {
    towTo(f, h, HERO.radius * 2.2, w.now);
    f.blessedUntil = Math.max(f.blessedUntil, w.now + CHAIN.bless);
    return void w.ev.push({ k: 'chainpull', x: h.x, y: h.y, x2: f.x, y2: f.y }, { k: 'blessed', x: f.x, y: f.y });
  }
  const e = faced(h, w.enemies, CHAIN.range);
  if (!e) return;
  w.ev.push({ k: 'chainpull', x: h.x, y: h.y, x2: e.x, y2: e.y });
  e.lastBy = h.id;
  if (damage(e, CHAIN.dmg, w.now, w.ev, { flinch: 0.3 }) || isDummy(e) || held(e, w.now)) return;
  if (e.weight <= 1) towTo(e, h, HERO.radius + e.radius + 0.3, w.now), stun(e, h.id, w.now, CHAIN.stun, w.ev);
  else if (!e.attack?.unblockable) stun(e, h.id, w.now, 0.4, w.ev, 'flinch');
}

/** Every towed body, a tick: on toward where the chain pulls it. */
export function stepTows(bodies: Body[], now: number, dt: number): void {
  for (const b of bodies) {
    const t = b.tow;
    if (!t) continue;
    const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy), step = CHAIN.speed * dt;
    if (d <= step || now >= t.until) {
      if (d <= step) (b.x = t.x), (b.y = t.y);
      b.tow = undefined;
    } else (b.x += (dx / d) * step), (b.y += (dy / d) * step);
    b.kvx = b.kvy = 0;
    collide(b, 'radius' in b ? (b as unknown as { radius: number }).radius : HERO.radius);
  }
}

export function lanternLight(h: Hero, w: World, el: Augment): void {
  const k = healMult(h);
  w.ev.push({ k: 'lanternlight', x: h.x, y: h.y });
  for (const o of w.heroes) {
    if (o.act === 'down' || Math.hypot(o.x - h.x, o.y - h.y) > LIGHT.radius + HERO.radius) continue;
    const n = Math.min(o.maxHp - o.hp, Math.round(heals(o, h, LIGHT.heal * k)));
    if (n > 0) (o.hp += n), w.ev.push({ k: 'heal', x: o.x, y: o.y, n });
  }
  for (const e of w.enemies) {
    if (isDead(e) || e.act === 'carried') continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy);
    if (d > LIGHT.radius + e.radius) continue;
    const ux = d > 0.05 ? dx / d : h.fx, uy = d > 0.05 ? dy / d : h.fy;
    e.lastBy = h.id;
    if (damage(e, Math.round(LIGHT.dmg * k), w.now, w.ev, { heavy: true, dx: ux, dy: uy, how: 'burn', src: 'smite' })) continue;
    shove(e, ux, uy, LIGHT.knock, e.weight);
    afflict(w, e, el, LIGHT.dmg);
    if (e.weight <= 1 && !held(e, w.now) && !isDummy(e) && stun(e, h.id, w.now, LIGHT.blind, w.ev)) w.ev.push({ k: 'stunned', x: e.x, y: e.y });
  }
}
