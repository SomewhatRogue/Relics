/**
 * A Mage's held spell, let go (numbers: shared/spellbook.ts). The element decides what it is and the
 * kit where it goes: the wand at range (a fireball, a cold blast, lightning called down where you aim), the
 * staff the wand's, bigger, the spellblade in close (a burning
 * lunge, a shatter, a lightning dash). Let go on the white flash, each is its bigger self. Judged here,
 * into the room's own lists (bolts, zones), so a guest sees what was judged.
 */
import { FIREBALL, FIREBOLT, LUNGE, DASH, type MageKit, type Swing, type TraitId } from '../shared/tuning';
import { shoot } from './bolts';
import { castElement } from './channel';
import type { World } from './elements';
import { coldBlast, shatterBlow } from './frostholds';
import { chainBolt, iceDome } from './staffholds';
import { burstMult } from './knacks';
import { startRush } from './rush';
import { callStrike } from './skystrike';
import type { Bolt, Hero, Zone } from './types';

/** Where a hold's things go, and how far the hero aims (to the mouse, else the goblin faced, else `fallback`). */
export interface HoldRoom { zones: Zone[]; bolts: Bolt[]; aim: (range: number, fallback: number) => number }

/** The wand's (and the staff's, `wide` bigger): a fireball, a cold blast, or lightning called down where you
 *  aim (sim/skystrike.ts). */
function wand(h: Hero, s: Swing, mult: number, r: HoldRoom, w: World, traits: TraitId[], fire = FIREBOLT): void {
  const el = castElement(h), big = h.perfect;
  // (WIDE BURST widens the fireball as it does any burst: sim/room.ts.)
  if (el === 'frost') return coldBlast(h, s, mult, w, burstMult(h));
  if (el === 'storm') return callStrike(h, s, mult, r.aim, r.zones, w);
  // A firebolt off the wand, a fireball off the staff (shared/spellbook.ts).
  r.bolts.push(shoot(h, { ...s, burst: big ? fire.big : fire.burst, speed: (s.speed ?? 17) * fire.speed }, 'fire', mult, traits));
  w.ev.push({ k: 'shoot', x: h.x, y: h.y, dx: h.fx, dy: h.fy, kind: 'spark', el });
}

/** The staff's (Kyle, 2026-11-16): the wand's fireball bigger, a chain bolt, an ice dome (sim/staffholds.ts). */
function staffHold(h: Hero, s: Swing, mult: number, r: HoldRoom, w: World, traits: TraitId[]): void {
  const el = castElement(h);
  if (el === 'storm') return chainBolt(h, s, mult, w);
  if (el === 'frost') return iceDome(h, s, mult, w);
  wand(h, s, mult, r, w, traits, FIREBALL);
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
  else if (kit === 'staff') staffHold(h, s, mult, r, w, traits);
  else if (kit === 'spellblade') blade(h, s, mult, w);
}
