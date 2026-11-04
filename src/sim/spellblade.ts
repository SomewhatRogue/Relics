/**
 * The spellblade and the staff's slash, in the room (numbers: shared/mage.ts). Every blade blow that
 * lands builds the charge. Wreathed (paid for in sim/spells.ts), the swings carry the element: fire
 * burns, frost slows, storm jumps on to one more goblin; the last throws a short wave of it forward.
 * Block pressed as a blow lands catches it on the blade: nothing taken, the blade full. The staff's
 * slash carries the element on every cut. Judged here, kept on the hero, so a guest's blade glows too.
 */
import { STORM, WEAPONS, WREATHE, type Augment, type Swing } from '../shared/tuning';
import { shove } from './bodies';
import { castElement } from './channel';
import { inArc } from './combat';
import { damage, isDead } from './damage';
import { afflict, type World } from './elements';
import { chill } from './staffwall';
import { buildCharge } from './spells';
import type { Enemy, FightEvent, Hero } from './types';

/** The element on a blow of the blade (or staff): fire burns, frost slows, storm jumps to one more. */
function bladeElement(w: World, h: Hero, e: Enemy, el: Augment, n: number): void {
  if (el === 'fire') return afflict(w, e, 'fire', n);
  if (el === 'frost') return chill(w, e);
  if (el !== 'storm') return;
  let o: Enemy | undefined, bd = WREATHE.jump;
  for (const x of w.enemies) {
    const d = Math.hypot(x.x - e.x, x.y - e.y);
    if (x !== e && !isDead(x) && x.act !== 'carried' && d <= bd) (bd = d), (o = x);
  }
  if (!o) return;
  w.ev.push({ k: 'shock', x: e.x, y: e.y, x2: o.x, y2: o.y });
  o.lastBy = h.id;
  damage(o, Math.max(STORM.min, Math.round(n * WREATHE.share)), w.now, w.ev, { flinch: STORM.flinch, el: 'storm' });
}

/** The wave off the last wreathed swing: everything in a short cone ahead takes it and the element. */
function wave(h: Hero, el: Augment, w: World): void {
  w.ev.push({ k: 'bladewave', x: h.x, y: h.y, dx: h.fx, dy: h.fy, el });
  for (const e of w.enemies) {
    if (isDead(e) || e.act === 'carried' || (e.z ?? 0) !== (h.z ?? 0) || !inArc(h.x, h.y, h.fx, h.fy, e.x, e.y, WREATHE.reach, WREATHE.arc, e.radius)) continue;
    e.lastBy = h.id;
    if (damage(e, WREATHE.waveDmg, w.now, w.ev, { heavy: true, flinch: 0.4, el: el || '', dx: h.fx, dy: h.fy })) continue;
    if (e.act !== 'pinned') shove(e, h.fx, h.fy, WREATHE.waveKnock, e.weight);
    bladeElement(w, h, e, el, WREATHE.waveDmg);
  }
}

/** A Mage's melee swing at its moment of release: the staff's slash shows; a blade swing takes a wreathe
 *  if there's one left (the last throws the wave). True if it was one of these. */
export function looseBlade(h: Hero, s: Swing, w: World): boolean {
  if (s.slash) return w.ev.push({ k: 'slash', x: h.x, y: h.y, dx: h.fx, dy: h.fy, el: castElement(h) }), true;
  if (!WEAPONS[h.weapon].catches) return false;
  h.wreathed = (h.wreathe ?? 0) > 0 && w.now < (h.wreatheUntil ?? -9);
  if (!h.wreathed) return (h.wreathe = 0), true;
  h.wreathe! -= 1;
  if (h.wreathe === 0) wave(h, h.wreatheEl ?? '', w);
  return true;
}

/** A Mage's blow landed for `n`: the blade builds its charge; a wreathed blade or a staff's slash brings its element. */
export function bladeStruck(h: Hero, s: Swing, e: Enemy, n: number, w: World): void {
  if (s.slash) return void (!isDead(e) && bladeElement(w, h, e, castElement(h), n));
  if (!WEAPONS[h.weapon].catches) return;
  buildCharge(h, w.ev);
  if (h.wreathed && !isDead(e)) bladeElement(w, h, e, h.wreatheEl ?? '', n);
}

/** The spellblade's bonus (its perfect is the wreathe on the flash): a blow caught on the blade as it lands. Nothing taken, the blade full. */
export function catchBlow(h: Hero, e: Enemy, now: number, ev: FightEvent[]): void {
  h.parryOpenAt = -9;
  h.hitstop = Math.max(h.hitstop, 0.12);
  e.hitstop = 0.12;
  const was = h.bladeCharge ?? 0;
  h.bladeCharge = 1;
  ev.push({ k: 'caught', x: (h.x + e.x) / 2, y: (h.y + e.y) / 2 });
  if (was < 1) ev.push({ k: 'bladefull', x: h.x, y: h.y });
}
