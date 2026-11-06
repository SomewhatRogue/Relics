/**
 * Bursts on the floor (numbers: shared/meaty2.ts KEGMAN.keg, shared/elites.ts ELITE.oiled and .ember; the
 * shape both views draw and the room judges: sim/blastshape.ts). Once a tick:
 * - a Kegman killed drops its keg, which bursts where it lies; set alight, or shot (sim/bolts.ts calls
 *   `shotKeg`), it stands there, the keg hissing on its back, and bursts with it;
 * - an Oil-soaked elite set alight stands there, flailing, and bursts (and one that died alight bursts too);
 * - a Smouldering elite's embers go up round its body after it dies.
 * The fuse is lit once (`blast` set once, so sent once) at the spot it was lit; when it's due everything in
 * the circle is hurt: a hero as by a striped blow (sim/combat.ts hitHero: walked or dodged out of, never
 * blocked; a friend's lag is waited on as for any blow), goblins hard and set alight, its own pack first
 * among them (the answer: burn it inside its own pack), props blasted, the freed hurt, slicks lit and the
 * dead burned to ash (the fire `burst` event: sim/oil.ts, sim/worldfire.ts). No dice.
 */
import { hitHero } from './combat';
import { damage, isDead } from './damage';
import { afflict, type World } from './elements';
import { hasAffix } from './elite';
import { blastProps } from './props';
import { blastSurvivors } from './survivorhits';
import { shove } from './bodies';
import { blastAttack, blastSpec, type BlastKind } from './blastshape';
import type { Enemy, FightEvent } from './types';

/** Light its fuse (once): where it is now, going off its spec's `fuse` from now. A living one stands there till then. */
export function lightFuse(e: Enemy, k: BlastKind, now: number, ev: FightEvent[]): void {
  if (e.blast) return;
  const s = blastSpec(k);
  e.blast = { k, x: +e.x.toFixed(2), y: +e.y.toFixed(2), r: s.r, at: +(now + s.fuse).toFixed(3) };
  ev.push({ k: 'fuse', x: e.x, y: e.y });
  // Alive (alight, or its keg shot): it stands where it is, held, till it goes up.
  if (!isDead(e) && e.act !== 'carried' && e.act !== 'pinned') Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: s.fuse + 0.15, kvx: 0, kvy: 0 });
}

/** A shot into a Kegman: its keg is lit. */
export function shotKeg(e: Enemy, now: number, ev: FightEvent[]): void {
  if (e.variant === 'kegman' && !e.under) lightFuse(e, 'keg', now, ev);
}

/** What lights a goblin's fuse this tick, if anything. */
function due(e: Enemy, now: number): BlastKind | null {
  if (e.blast || e.escaped || e.under) return null;
  const dead = isDead(e), alight = !dead && e.burnUntil > now;
  if (e.variant === 'kegman' && (dead || alight)) return 'keg';
  if (hasAffix(e, 'oiled') && (alight || (dead && e.embers))) return 'oiled';
  if (hasAffix(e, 'ember') && dead) return 'ember';
  return null;
}

/** Once a tick, after the goblins move: fuses lit, and bursts that are due go off. */
export function stepBlasts(w: World): void {
  for (const e of w.enemies) {
    if (e.blast && !e.blast.done && w.now >= e.blast.at - 1e-6) blow(e, w);
    const k = due(e, w.now);
    if (k) lightFuse(e, k, w.now, w.ev);
  }
}

function blow(e: Enemy, w: World): void {
  const b = e.blast!, s = blastSpec(b.k), a = blastAttack(b, w.now), { now, ev } = w;
  b.done = true;
  ev.push({ k: 'burst', x: b.x, y: b.y, r: b.r, el: 'fire' });
  for (const h of w.heroes) if ((h.z ?? 0) === 0 && !h.out) hitHero(e, a, h, now, ev, w.heroes);
  for (const o of w.enemies) {
    const d = Math.hypot(o.x - b.x, o.y - b.y);
    if (isDead(o) || o.under || o.act === 'carried' || (o.z ?? 0) !== 0 || d > b.r + o.radius) continue;
    const dx = d > 0.05 ? (o.x - b.x) / d : 0, dy = d > 0.05 ? (o.y - b.y) / d : 1;
    // Whoever lit it or killed it gets the kills it makes.
    if (e.lastBy) o.lastBy = e.lastBy;
    if (damage(o, s.foe, now, ev, { heavy: true, how: 'burst', dx, dy, el: 'fire', src: 'keg' })) continue;
    afflict(w, o, 'fire', s.burn);
    if (o.act !== 'pinned') shove(o, dx, dy, s.knock, o.weight);
  }
  blastProps(b.x, b.y, b.r, s.foe, s.knock, w);
  blastSurvivors(w, b.x, b.y, b.r, s.dmg, e.lastBy, 'fire');
}
