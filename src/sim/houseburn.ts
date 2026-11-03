/**
 * A house on a job set alight from outside (Kyle, 2026-11-03: "it goes up over time, smokes, and flushes
 * out or kills things inside"). However it caught (lit at its kindling spot, a Lamp Oil flask, a stray
 * spell: sim/catching.ts), it catches over HOUSEBURN.catch seconds, then burns, and the roof comes in at
 * its time: a burnt shell nobody can go into. Nobody goes in once it's alight (the doors check `burning`).
 *
 * Whoever's inside choke on the smoke: the goblins awake inside come out of the door first, one after
 * another; the sleeping ones later, worse hurt, and the later the worse (in a bigger house, later still).
 * Each comes out on fire, hurt by the smoke it breathed, into the street (and its loot falls there); one
 * the smoke has all but killed drops on the doorstep. When the roof comes in, anyone still caged in
 * there is lost (counted, not a failed job), and a chest in there is ash, leaving a charred handful at
 * the door. What's inside comes from the leader's game (`Indoors`), which knows the houses' plans and
 * rooms; the rules are all here, on the room's own fire stream.
 */
import { doorAt, type Block } from '../shared/arena';
import { burnable, fireTimes } from '../shared/kindling';
import type { Rng } from '../shared/rng';
import { BURN, DROPS, HOUSEBURN, COINS, WEAPONS, rollAny } from '../shared/tuning';
import type { Pickup } from './pickups';
import type { Drop, Enemy, FightEvent, Hero } from './types';

/** What's in a house, as the leader's game knows it (sim never builds a house's room itself). */
export interface Indoors {
  /** Who and what's in house `i` (its block's place in the street's map) as it catches: copies, or its room's own. */
  contents(i: number): { foes: Enemy[]; chests: number };
  /** Goblin `id` of house `i` coming out now: the one from its room (taken out of it), null if it's gone from there, undefined if the house has no room (the copy comes). */
  take(i: number, id: number): Enemy | null | undefined;
  /** How many are still caged in house `i` as its roof comes in (none its own room will count). */
  caged(i: number): number;
  /** House `i` caught at street time `from`; its roof comes in at `fall` (so a room with someone in it burns too). */
  caught?(i: number, from: number, fall: number): void;
}

export interface HouseFire { i: number; from: number; fall: number; out: { e: Enemy; at: number }[]; chests: number; done?: boolean }

export interface Street {
  map: { blocks: Block[] };
  enemies: Enemy[];
  heroes: Hero[];
  drops: Drop[];
  pickups: Pickup[];
  houseFires: HouseFire[];
  houseIn?: Indoors;
  time: number;
  events: FightEvent[];
}

let nextId = 70000;
const big = (e: Enemy) => e.kind === 'butcher' || e.variant === 'heavy';

/** When each one comes out: the awake first, in turn; the sleeping somewhere in their window; never after the roof. */
function schedule(foes: Enemy[], from: number, fall: number, roomy: boolean, rng: Rng): HouseFire['out'] {
  let awake = 0;
  const [a, z] = roomy ? HOUSEBURN.sleepOutBig : HOUSEBURN.sleepOut;
  return foes.map((e) => {
    const late = e.feeding ? rng.range(a, z) : HOUSEBURN.wakeOut + awake++ * HOUSEBURN.wakeGap + rng.range(0, 0.5);
    return { e, at: Math.min(fall - 1, from + late + (big(e) ? 1.5 : 0)) };
  });
}

/** Every house alight: started, its goblins driven out on their time, the roof in at the end. */
export function stepHouseFires(r: Street, rng: Rng): void {
  const now = r.time, ev = r.events;
  r.map.blocks.forEach((b, i) => {
    if (!burnable(b) || (b.burning ?? -1) < 0 || r.houseFires.some((f) => f.i === i)) return;
    const t = fireTimes(b), from = b.burning!, fall = from + t.catch + t.burn, got = r.houseIn?.contents(i) ?? { foes: [], chests: 0 };
    r.houseFires.push({ i, from, fall, out: schedule(got.foes, from, fall, !!b.big, rng), chests: got.chests });
    r.houseIn?.caught?.(i, from, fall);
  });
  for (const f of r.houseFires) {
    const b = r.map.blocks[f.i];
    if (f.done || !b) continue;
    // How far gone it looks (the flames grow as its health falls): a little while it catches, then the rest.
    const k = Math.min(1, Math.max(0, (now - f.from) / (f.fall - f.from)));
    b.hp = Math.max(1, Math.round(b.maxHp! * (1 - k)));
    for (const o of f.out.filter((o) => o.at <= now)) {
      f.out.splice(f.out.indexOf(o), 1);
      comeOut(r, b, o.e, r.houseIn?.take(f.i, o.e.id), o.at - f.from, rng);
    }
    if (now >= f.fall) roofIn(r, b, f, rng);
  }
}

/** A goblin out of the smoke and into the street, on fire; one the smoke has all but done for drops at the door. */
function comeOut(r: Street, b: Block, copy: Enemy, live: Enemy | null | undefined, inSmoke: number, rng: Rng): void {
  if (live === null) return;
  const e = live ?? copy, d = doorAt(b), now = r.time;
  if (e.act === 'dead' || e.hp <= 0) return;
  e.hp = Math.max(1, Math.round(e.hp - HOUSEBURN.smoke * inSmoke));
  Object.assign(e, {
    id: Math.max(0, ...r.enemies.map((o) => o.id)) + 1, x: d.x + rng.range(-0.35, 0.35), y: d.y + 0.1, kvx: rng.range(-1.5, 1.5), kvy: 4,
    act: 'flinch', actT: 0, actDur: 0.5, attack: null, alert: true, feeding: false, cooldown: 0.8, home: { x: d.x, y: d.y + 1 },
    burnUntil: now + HOUSEBURN.outBurn, burnNext: e.hp <= 1 ? now : now + BURN.every, lastBy: e.lastBy ?? '',
  });
  r.enemies.push(e);
  ev(r, { k: 'flushed', x: e.x, y: e.y }, { k: 'ignite', x: e.x, y: e.y });
}

const ev = (r: Street, ...e: FightEvent[]) => r.events.push(...e);

/** The roof comes in: a burnt shell; the caged lost with it; a chest in there leaves a charred handful at the door. */
function roofIn(r: Street, b: Block, f: HouseFire, rng: Rng): void {
  f.done = true;
  Object.assign(b, { hp: 0, ruined: true, lighter: '', lightT: 0, cry: false });
  ev(r, { k: 'collapse', x: b.x, y: b.y, w: b.w, h: b.h });
  const d = doorAt(b);
  for (let n = r.houseIn?.caged(f.i) ?? 0; n > 0; n--) ev(r, { k: 'cagelost', x: d.x, y: d.y - 0.6 });
  for (let n = 0; n < f.chests; n++) {
    const x = d.x + (n % 2 ? 0.7 : -0.7), y = d.y + 0.5, [lo, hi] = HOUSEBURN.charGold;
    r.pickups.push({ id: nextId++, x, y, life: COINS.life, gold: lo + Math.floor(rng.next() * (hi - lo + 1)) });
    const near = r.heroes.filter((h) => h.id !== 'squire').sort((a, c) => Math.hypot(a.x - x, a.y - y) - Math.hypot(c.x - x, c.y - y))[0];
    if (near && rng.next() < HOUSEBURN.charItem) {
      const item = rollAny(rng, WEAPONS[near.weapon].cls, 'plain', rng.next() < 0.6 ? 'weapon' : 'armor');
      r.drops.push({ id: nextId++, x, y: y + 0.4, item, life: DROPS.life });
      ev(r, { k: 'drop', x, y: y + 0.4, q: item.quality });
    }
    ev(r, { k: 'charred', x, y });
  }
}
