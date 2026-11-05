/**
 * The Rogue's techniques in the room, all on a backstab (numbers: shared/techniques.ts), by blade or by
 * a thrown knife or dart in the back. KNIFEWORK: the goblin bleeds. SLIP AWAY: a kill hides you, as
 * the VANISH skill does (no goblin sees you till you strike again). CUTPURSE: now and then a little
 * gold knocked loose, once a goblin, on the room's own purse stream so no other dice shift.
 */
import { SKEWER, WEAPONS } from '../shared/tuning';
import { CUTPURSE, KNIFEWORK, SLIP, knowsTech } from '../shared/techniques';
import { isDead, isDummy } from './damage';
import type { World } from './elements';
import { rearCos } from './knacks';
import { dropLoot } from './pickups';
import { bleeding } from './venom';
import type { Enemy, Hero } from './types';

/** A Rogue's blade landed (room.ts struck): a backstab if it came from behind. */
export function rogueStruck(h: Hero, e: Enemy, w: World): void {
  if (WEAPONS[h.weapon].cls !== 'ROGUE' || isDummy(e) || e.kind === 'nest') return;
  const tx = h.x - e.x, ty = h.y - e.y;
  // (THROUGH THE LEGS made this hit a backstab wherever it came from: combat.ts hitEnemy.)
  const legs = h.legsStab === e.id;
  if (legs) h.legsStab = undefined;
  if (legs || (e.fx * tx + e.fy * ty) / (Math.hypot(tx, ty) || 1) < rearCos(h)) backstabbed(h, e, w);
}

/** A backstab landed on `e` (killed or not): whatever techniques this Rogue knows. */
export function backstabbed(h: Hero, e: Enemy, w: World): void {
  if (knowsTech(h, 'knifework') && !isDead(e) && e.kind !== 'nest') {
    if (!bleeding(e, w.now)) e.bleedNext = w.now + SKEWER.every;
    e.bleedUntil = Math.max(e.bleedUntil ?? 0, w.now + KNIFEWORK.time);
    w.ev.push({ k: 'cutbleed', x: e.x, y: e.y });
  }
  if (knowsTech(h, 'slip') && isDead(e)) slip(h, w);
  if (knowsTech(h, 'cutpurse')) cutpurse(e, w);
}

/** SLIP AWAY: hidden a moment; anything winding up at you lets its blow go. */
function slip(h: Hero, w: World): void {
  h.vanishUntil = Math.max(h.vanishUntil ?? 0, w.now + SLIP.time);
  for (const o of w.enemies) if (!isDead(o) && o.attack?.aimed === h.id && o.attack.t < o.attack.windup) Object.assign(o, { attack: null, act: 'chase', actT: 0 });
  w.ev.push({ k: 'slipaway', x: h.x, y: h.y });
}

/** CUTPURSE: a goblin with a purse (not a dummy, a spider or a training one), once, by the dice. */
function cutpurse(e: Enemy, w: World): void {
  if (e.cut || !w.floor || e.respawns || (e.kind !== 'scrapper' && e.kind !== 'butcher')) return;
  e.cut = true;
  const r = w.floor.rng;
  if (r.next() >= CUTPURSE.chance) return;
  const gold = CUTPURSE.min + Math.floor(r.next() * (CUTPURSE.max - CUTPURSE.min + 1));
  dropLoot(w.floor.pickups, e.x + 0.3, e.y + 0.2, { gold });
  w.ev.push({ k: 'cutpurse', x: e.x, y: e.y });
}
