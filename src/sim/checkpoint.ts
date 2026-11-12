/**
 * An instance's checkpoints (docs/design/instances.md): every area's gate is one, the way in where the
 * party stands when the area begins (`map.hero`), or on one map the last gate passed (`run.check`: sim/stretches.ts).
 *
 * - A wipe isn't the end. Alone, going down is a wipe; in a party it's everyone down with nobody left to get
 *   up on their own. After a beat (INSTANCE.regroup) the party is up again at the area's gate, whole, and the
 *   goblins still standing are back where they were put, whole too; the dead stay dead.
 * - The third wipe since the last gate loses the run (run.downs counts them; passing a gate starts again:
 *   client/game.ts).
 * - Only friends get you up: out of a fight your friends are still in, you're up at the gate a while later
 *   (INSTANCE.walkBack), and walk back to them.
 *
 * Kept on the run and the heroes (plain data), so a handed-on job carries it.
 */
import { HERO, INSTANCE, PARTY } from '../shared/tuning';
import { isDead } from './damage';
import { players } from './party';
import type { ArenaRoom } from './room';
import type { Run } from './run';
import type { Enemy, FightEvent, Hero } from './types';

/** Where hero `i` of `n` stands at the gate: in a short row across the way in. */
export function gateSpot(room: ArenaRoom, i: number, n: number, run?: Run): { x: number; y: number } {
  // (On one map in stretches, the last gate passed: sim/stretches.ts.)
  const g = run?.check ?? room.map.hero, x = g.x + (i - (n - 1) / 2) * 0.9;
  return { x: Math.max(0.6, Math.min(room.map.w - 0.6, x)), y: g.y };
}

/** Up at the gate: whole, rested, a moment nothing hurts. */
function upAtGate(room: ArenaRoom, h: Hero, at: { x: number; y: number }, ev: FightEvent[]): void {
  Object.assign(h, {
    ...at, z: 0, act: 'idle', actT: 0, actDur: 0, hp: h.maxHp, stamina: HERO.stamina, kvx: 0, kvy: 0,
    bleeding: false, out: false, selfUp: false, pickT: 0, raiser: undefined, safeT: INSTANCE.safe,
  });
  room.prev.set('h:' + h.id, [h.x, h.y]);
  ev.push({ k: 'gotup', x: h.x, y: h.y, id: h.id });
}

/** A goblin still standing back where it was put, whole and calm (it hasn't seen you yet). */
function settle(room: ArenaRoom, e: Enemy): void {
  Object.assign(e, { x: e.home.x, y: e.home.y, hp: e.maxHp, alert: false, act: 'idle', actT: 0, attack: null, kvx: 0, kvy: 0 });
  room.prev.set('e:' + e.id, [e.x, e.y]);
}

/** Nobody standing, and nobody about to get up by themselves (alone: just down). */
export function wiped(room: ArenaRoom): boolean {
  const ps = players(room.heroes);
  if (!ps.length) return false;
  const solo = ps.length < 2;
  return ps.every((h) => h.act === 'down' && (solo || h.out || h.selfUp));
}

/** Once a tick, after the room's step (sim/run.ts tally). */
export function stepCheckpoint(run: Run, room: ArenaRoom, ev: FightEvent[]): void {
  if (run.failed) return;
  const ps = players(room.heroes);
  if (run.wipeAt !== undefined) {
    // (A new room since: the beat is over, the party's already at its gate.)
    if (run.wipeAt > room.time) return void (run.wipeAt = undefined);
    if (room.time - run.wipeAt < INSTANCE.regroup) return;
    run.wipeAt = undefined;
    ps.forEach((h, i) => upAtGate(room, h, gateSpot(room, i, ps.length, run), ev));
    for (const e of room.allEnemies) if (!isDead(e) && !e.boss) settle(room, e);
    return;
  }
  if (wiped(room)) {
    run.downs++;
    if (run.downs >= INSTANCE.wipes) return void (run.failed = true);
    run.wipeAt = room.time;
    // Held down for the beat (alone you'd otherwise be up where you fell).
    for (const h of ps) Object.assign(h, { actDur: Infinity, bleeding: ps.length > 1 });
    return;
  }
  // Out while your friends fight on: up at the gate after the walk back.
  ps.filter((h) => h.act === 'down' && h.out && h.actT >= PARTY.bleed + INSTANCE.walkBack).forEach((h) => upAtGate(room, h, gateSpot(room, 0, 1, run), ev));
}
