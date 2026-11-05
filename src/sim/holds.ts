/**
 * A Mage's held spell, let go (numbers: shared/spellbook.ts). The element decides what it is and the
 * kit where it goes: the wand at range (a fireball, a cold blast, a lightning bolt from the hand), the
 * staff all round you (a ring of fire, a frost nova, a charged ring), the spellblade in close (a burning
 * lunge, a shatter, a lightning dash). Let go on the white flash, each is its bigger self. Judged here,
 * into the room's own lists (bolts, zones), so a guest sees what was judged.
 */
import { FIREBALL, STAFF_RING, LUNGE, DASH, type MageKit, type Swing, type TraitId } from '../shared/tuning';
import { shoot } from './bolts';
import { castElement } from './channel';
import type { World } from './elements';
import { coldBlast, nova, shatterBlow } from './frostholds';
import { burstMult } from './knacks';
import { startRush } from './rush';
import { flameRing, stormRing } from './staffrings';
import { thunderbolt } from './thunderbolt';
import type { Bolt, Hero, Zone } from './types';

/** Where a hold's things go, and how far the hero aims (to the mouse, else the goblin faced, else `fallback`). */
export interface HoldRoom { zones: Zone[]; bolts: Bolt[]; aim: (range: number, fallback: number) => number }

/** The wand's: a fireball, a cold blast, or a lightning bolt from the hand. */
function wand(h: Hero, s: Swing, mult: number, r: HoldRoom, w: World, traits: TraitId[]): void {
  const el = castElement(h), big = h.perfect;
  // (WIDE BURST widens the fireball as it does any burst: sim/room.ts.)
  if (el === 'frost') return coldBlast(h, s, mult, w, burstMult(h));
  if (el === 'storm') return thunderbolt(h, s, mult, w);
  r.bolts.push(shoot(h, { ...s, burst: big ? FIREBALL.big : FIREBALL.burst }, 'fire', mult, traits));
  w.ev.push({ k: 'shoot', x: h.x, y: h.y, dx: h.fx, dy: h.fy, kind: 'spark', el });
}

/** The staff's: round where you stand, its size by the hold (the biggest on the flash). */
function staff(h: Hero, s: Swing, mult: number, r: HoldRoom, w: World): void {
  const el = castElement(h), rad = (h.perfect ? STAFF_RING.rBig : STAFF_RING.r + (STAFF_RING.rFull - STAFF_RING.r) * Math.min(1, h.power)) * burstMult(h);
  if (el === 'fire') r.zones.push(flameRing(h, rad, mult, w));
  else if (el === 'storm') r.zones.push(stormRing(h, rad, mult, w));
  else nova(h, s, mult, w, rad);
}

/** The spellblade's: a burning lunge, a shatter, or a lightning dash. */
function blade(h: Hero, s: Swing, mult: number, w: World): void {
  const el = castElement(h), big = h.perfect;
  if (el === 'frost') return shatterBlow(h, s, mult, w, burstMult(h));
  if (el === 'fire') return startRush(h, 'fire', big ? LUNGE.bigLen : LUNGE.len, Math.round(s.dmg * mult), w);
  startRush(h, 'storm', big ? DASH.bigLen : DASH.len, Math.max(1, Math.round(s.dmg * DASH.dmg * mult)), w);
}

/** A Mage's hold at its moment of release. `mult`: the hero's damage now (blessed, primed, a perfect's knack). */
export function castHold(h: Hero, s: Swing, mult: number, r: HoldRoom, w: World, traits: TraitId[]): void {
  const kit = h.weapon as MageKit;
  if (kit === 'wand') wand(h, s, mult, r, w, traits);
  else if (kit === 'staff') staff(h, s, mult, r, w);
  else if (kit === 'spellblade') blade(h, s, mult, w);
}
