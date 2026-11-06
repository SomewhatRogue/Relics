/**
 * The Doorkeepers' barn for a test (not a test on its own: tests/boss.test.ts and doorkeepers.test.ts):
 * the room as a run makes it, the pair, heroes where you want them, and a blow begun on one of them.
 */
import { barnHunt } from '../src/shared/bossjobs';
import type { DoorMove, WeaponId } from '../src/shared/tuning';
import { bossBegin } from '../src/sim/bosskit';
import { newRun, runRoom } from '../src/sim/run';
import type { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type Enemy, type FightEvent, type Hero, type Intent } from '../src/sim/types';

export interface Barn { room: ArenaRoom; latch: Enemy; hasp: Enemy; heroes: Hero[] }

/** The barn on `day` for `kits.length` players, each at a spot (by default in a row at the way in). */
export function barn(kits: WeaponId[] = ['sword'], at: [number, number][] = [], day = 3): Barn {
  const room = runRoom({ ...newRun(barnHunt(day, true)), party: kits.length });
  room.dread = null;
  const heroes = kits.map((k, i) => {
    const h = room.join('p' + i), [x, y] = at[i] ?? [room.map.hero.x + i * 1.2, room.map.hero.y];
    return Object.assign(h, { weapon: k, safeT: 0, x, y, fx: 0, fy: -1 });
  });
  const [latch, hasp] = ['LATCH', 'HASP'].map((n) => room.enemies.find((e) => e.name === n)!);
  return { room, latch, hasp, heroes };
}

/** Awake and fighting from now (as if they'd seen you), the room's clocks started. */
export function wake(b: Barn): void {
  for (const e of [b.latch, b.hasp]) e.alert = true;
  b.room.step();
}

/** Stood still where it is and out of it (open, so it neither acts nor locks): for a test of the other one alone. */
export function still(e: Enemy): void {
  e.boss!.openUntil = 1e9;
}

/** Put a boss at (x, y) facing (fx, fy). */
export function place(e: Enemy, x: number, y: number, fx = 0, fy = 1): void {
  Object.assign(e, { x, y, fx, fy, kvx: 0, kvy: 0, attack: null, act: 'chase', actT: 0 });
}

/** `e` begins `move` at `h` now (its rotation held off after, so nothing else comes). */
export function blow(e: Enemy, move: DoorMove, h: Hero): FightEvent[] {
  const ev: FightEvent[] = [];
  bossBegin(e, move, h, ev);
  e.cooldown = 99;
  return ev;
}

/** Step `secs` with each hero's Intent from `say` (none: standing). Returns every event. */
export function run(b: Barn, secs: number, say: (h: Hero, t: number) => Partial<Intent> = () => ({})): FightEvent[] {
  const out: FightEvent[] = [];
  const t0 = b.room.time;
  while (b.room.time < t0 + secs - 1e-9) {
    for (const h of b.heroes) b.room.setIntent(h.id, { ...NO_INTENT, ...say(h, b.room.time - t0) });
    b.room.step();
    out.push(...b.room.events);
  }
  return out;
}
