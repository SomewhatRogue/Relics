/**
 * Practice in the training yard (shared/practice.ts): straw men in hungry kit set going by
 * Corporal Brisk's watch, to be fought: one sort,
 * a pack, or a drill with its own count. It runs in the yard's room, in this browser only, after each
 * step (client/game.ts): nothing here goes to the relay, and nothing here pays. Spawns come off the room's
 * own seeded Rng and are made as a job makes them (newEnemy, VARIANTS), so the fight is the real one.
 *
 * A hero put down here doesn't count (the yard keeps no tally): once they're up, the same fight starts
 * over. A drill says how it's going in one small line ("BLOCKED 8 OF 10", "DODGED 8 OF 10", "HELD 60 S").
 */
import { ARENA } from '../shared/arena';
import { DRILLS, PACKS, RACK, PRACTICE, SINGLES, sortOf, type DrillId, type Sort } from '../shared/practice';
import { CLASS_GUARD, VARIANTS, type HeroClass } from '../shared/tuning';
import type { Rng } from '../shared/rng';
import { isDead } from './damage';
import { newEnemy } from './enemies';
import { shapeFoe } from './ownfoes';
import type { ArenaRoom } from './room';
import type { Enemy, FightEvent } from './types';

export type Pick = { k: 'single' | 'pack'; key: string } | { k: 'drill'; key: DrillId };
export interface Practice {
  pick: Pick;
  /** The straw men set going for it (ids), every one this go (the hold's waves too). */
  ids: number[];
  began: number;
  /** Over: its line is the result. */
  done: boolean;
  /** The heavy drills: the heavy's swings so far (the last one, to tell a new one), and those blocked or dodged. */
  swings: number;
  met: number;
  swing: unknown;
  /** The burn drill: each goblin seen alight. */
  burned: number[];
  /** The hold: the next wave due (room time). */
  waveAt: number;
  /** Put down: the fight starts over once the hero's up. */
  downed: boolean;
  line: string;
  /** A word that stays a moment over the count (how the last go ended), till `noteUntil`. */
  note: string;
  noteUntil: number;
}

const states = new WeakMap<ArenaRoom, Practice>();
/** The practice going on in this room (the yard), if any. */
export const practiceOf = (room: ArenaRoom): Practice | null => states.get(room) ?? null;

const rngOf = (room: ArenaRoom): Rng => room['rng'];
const standing = (e: Enemy) => e.kind === 'dummy' || e.kind === 'swingDummy';
const secs = (p: Practice, room: ArenaRoom) => Math.round(room.time - p.began);

/** A goblin of sort `s` at (x, y), awake, for good (dead stays dead), made as a job's room makes one. */
function letOne(room: ArenaRoom, s: Sort, x: number, y: number): Enemy {
  const id = Math.max(0, ...room.allEnemies.map((o) => o.id)) + 1, e = newEnemy(id, s.kind, x, y);
  if (s.variant) (e.variant = s.variant), (e.hp = e.maxHp = VARIANTS[s.variant].hp);
  shapeFoe(e);
  Object.assign(e, { respawns: false, bow: s.bow, alert: true, z: 0, fx: 0, fy: 1 });
  room.enemies.push(e);
  return e;
}

/** Out from the rack, a few abreast, a little apart (the room's Rng says how far). */
function atGate(room: ArenaRoom, i: number): [number, number] {
  const r = rngOf(room), g = RACK.out;
  return [g.x + (i % 3) * 1.3 + r.range(-0.25, 0.25), g.y + Math.floor(i / 3) * 1.0 + r.range(-0.2, 0.2)];
}

/** Everything but the plain dummies off the floor: the yard's own sacking butcher and straw men, and any practice. */
function emptyYard(room: ArenaRoom): void {
  room.enemies.splice(0, room.enemies.length, ...room.enemies.filter(standing));
}

/** Set going what `pick` names. The yard's standing butcher and straw men go back on the rack while it runs. */
export function letOut(room: ArenaRoom, pick: Pick): Practice | null {
  const sorts = pick.k === 'single' ? [sortOf(pick.key)] : pick.k === 'pack' ? (PACKS.find((q) => q.key === pick.key)?.of ?? []).map(sortOf) : [];
  if (pick.k !== 'drill' && (!sorts.length || sorts.some((s) => !s))) return null;
  if (pick.k === 'drill' && !DRILLS.some((d) => d.key === pick.key)) return null;
  emptyYard(room);
  room.drops.length = 0;
  room.pickups.length = 0;
  const p: Practice = { pick, ids: [], began: room.time, done: false, swings: 0, met: 0, swing: null, burned: [], waveAt: room.time + PRACTICE.waveEvery, downed: false, line: '', note: '', noteUntil: -1 };
  const add = (s: Sort, x: number, y: number) => p.ids.push(letOne(room, s, x, y).id);
  const r = rngOf(room);
  if (pick.k !== 'drill') sorts.forEach((s, i) => add(s!, ...atGate(room, i)));
  else if (pick.key === 'block' || pick.key === 'dodge') add(sortOf('heavy')!, 9, 6.5);
  else if (pick.key === 'shields') {
    // Side by side across the yard, boards to the hero.
    for (const dx of [-1.2, 0, 1.2]) add(sortOf('shield')!, 9 + dx, 6);
  } else if (pick.key === 'burn') for (let i = 0; i < 5; i++) add(sortOf('scrapper')!, 9 + r.range(-0.9, 0.9), 5.5 + r.range(-0.7, 0.7));
  else for (let i = 0; i < PRACTICE.firstWave; i++) add(sortOf('scrapper')!, ...atGate(room, i));
  states.set(room, p);
  p.line = lineOf(room, p);
  return p;
}

/** Back on the rack, all of it; the yard as it stands every day. */
export function clearPractice(room: ArenaRoom): void {
  states.delete(room);
  emptyYard(room);
  const s = ARENA.spawn, id = () => Math.max(0, ...room.allEnemies.map((o) => o.id)) + 1;
  room.enemies.push(newEnemy(id(), 'butcher', s.butcher.x, s.butcher.y));
  for (const at of s.scrappers) room.enemies.push(newEnemy(id(), 'scrapper', at.x, at.y));
}

/** The same again, from the start. */
export function again(room: ArenaRoom): Practice | null {
  const p = practiceOf(room);
  return p ? letOut(room, p.pick) : null;
}

/** After each step of the yard's room: the counts, the hold's waves, a reset after a fall, and nothing to pick up. */
export function stepPractice(room: ArenaRoom, ev: FightEvent[], me: string): void {
  // Nothing is won in the yard: what a goblin drops there is gone before anyone can take it.
  if (room.drops.length) room.drops.length = 0;
  if (room.pickups.length) room.pickups.length = 0;
  const p = practiceOf(room);
  if (!p) return;
  const h = room.heroes.find((x) => x.id === me);
  if (!p.done && ev.some((e) => e.k === 'down' && (e as { id?: string }).id === me)) {
    p.downed = true;
    p.line = p.pick.key === 'hold' && p.pick.k === 'drill' ? `HELD ${secs(p, room)} S` : "YOU'RE DOWN. STARTING OVER";
    return;
  }
  // Up again: the same fight from the start (the line about the fall stays a moment).
  if (p.downed) {
    if (h && h.act !== 'down') {
      const q = letOut(room, p.pick);
      if (q) Object.assign(q, { note: p.line, noteUntil: room.time + 3, line: p.line });
    }
    return;
  }
  if (p.done) return;
  const out = p.ids.map((id) => room.enemies.find((e) => e.id === id)).filter((e): e is Enemy => !!e);
  const alive = out.filter((e) => !isDead(e));
  if (p.pick.k === 'drill') drill(room, p, p.pick.key, out, alive, ev);
  else if (!alive.length) p.done = true;
  p.line = lineOf(room, p);
}

function drill(room: ArenaRoom, p: Practice, key: DrillId, out: Enemy[], alive: Enemy[], ev: FightEvent[]): void {
  if (key === 'block' || key === 'dodge') {
    const heavy = alive[0];
    if (heavy?.attack && heavy.attack !== p.swing) p.swings++;
    // A block that held (a guard break isn't one), or a dodge (rolled through or out from under it).
    for (const e of ev) if (e.k === key && !(e as { more?: boolean }).more) p.met = Math.min(p.swings, p.met + 1);
    p.swing = heavy?.attack ?? null;
    // Ten swings done (the last one played out), or the heavy put down first.
    if (!heavy || (p.swings >= PRACTICE.swings && !heavy.attack)) p.done = true;
  } else if (key === 'shields') {
    if (!alive.length) p.done = true;
  } else if (key === 'burn') {
    for (const e of out) if (e.burnUntil > room.time && !p.burned.includes(e.id)) p.burned.push(e.id);
    if (!alive.length || room.time - p.began >= PRACTICE.burnFor) p.done = true;
  } else {
    if (room.time - p.began >= PRACTICE.hold) return void ((p.done = true), clearOut(room, p));
    if (room.time >= p.waveAt) {
      // Two more each wave, an archer with every other one, never more than PRACTICE.most up at once.
      const wave = Math.round((room.time - p.began) / PRACTICE.waveEvery), n = Math.min(PRACTICE.wave + (wave % 2 ? 0 : 1), PRACTICE.most - alive.length);
      for (let i = 0; i < n; i++) p.ids.push(letOne(room, sortOf(i === PRACTICE.wave ? 'archer' : 'scrapper')!, ...atGate(room, i)).id);
      p.waveAt = room.time + PRACTICE.waveEvery;
    }
  }
}

/** The hold's minute is up: whatever's still standing goes back on the rack. */
function clearOut(room: ArenaRoom, p: Practice): void {
  room.enemies.splice(0, room.enemies.length, ...room.enemies.filter((e) => !p.ids.includes(e.id) || isDead(e)));
}

/** The small line: how it's going, or how it went. */
function lineOf(room: ArenaRoom, p: Practice): string {
  if (room.time < p.noteUntil) return p.note;
  const s = secs(p, room), out = p.ids.map((id) => room.enemies.find((e) => e.id === id)), left = out.filter((e) => e && !isDead(e)).length;
  if (p.pick.k !== 'drill') return p.done ? `ALL DOWN IN ${s} S` : `${left} LEFT`;
  switch (p.pick.key) {
    case 'block': return `BLOCKED ${p.met} OF ${p.done ? p.swings : PRACTICE.swings}`;
    case 'dodge': return `DODGED ${p.met} OF ${p.done ? p.swings : PRACTICE.swings}`;
    case 'shields': return p.done ? `BROKE THE LINE IN ${s} S` : `SHIELDS DOWN ${3 - left} OF 3`;
    case 'burn': return `BURNED ${p.burned.length} OF 5` + (p.done ? ` IN ${s} S` : '');
    default: return p.done ? `HELD ${PRACTICE.hold} S` : `HOLDING ${s} S`;
  }
}

/** How many straw men still wait on the rack (drawn: client/rackdraw.ts, three/rack3d.ts): fewer while some are out. */
export function waiting(room: ArenaRoom): number {
  const p = practiceOf(room);
  if (!p) return RACK.holds;
  const out = room.enemies.filter((e) => p.ids.includes(e.id) && !isDead(e)).length;
  return Math.max(1, RACK.holds - out);
}

/** What the board offers this hero: each single and pack they've met every sort of, and the drills for their class
 *  (the heavy's to block for a class that holds a block, to dodge for one that can't). */
export function offers(met: Set<string>, cls: string): { singles: typeof SINGLES; packs: typeof PACKS; drills: typeof DRILLS } {
  const guard = CLASS_GUARD[cls as HeroClass];
  return {
    singles: SINGLES.filter((s) => met.has(s.key)),
    packs: PACKS.filter((q) => q.of.every((k) => met.has(k))),
    drills: DRILLS.filter((d) => (!d.cls || d.cls === cls) && (!d.guard || d.guard === guard)),
  };
}
