import { describe, expect, it } from 'vitest';
import { TICK, WEAPONS, rollGear } from '../src/shared/tuning';
import { Rng } from '../src/shared/rng';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { GEAR } from '../src/sim/pack';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

/**
 * Kyle (2026-11-02): "I got the hand crossbow as the Rogue ... and didn't seem to change anything."
 * The hand crossbow is the poisoner's kit now (2026-11-03): taken from the pack, through the room, the
 * way a tap on PACK does it.
 */
function rogueWithKitInPack() {
  const room = new ArenaRoom(1, { scrappers: false });
  const h = room.join('me');
  Object.assign(h, { weapon: 'daggers', x: 9, y: 9, fx: 0, fy: -1 });
  h.bag.push(rollGear(new Rng(3), 'ROGUE', 'fine', 'weapon', 'poisoner'));
  room.enemies = [Object.assign(newEnemy(10, 'scrapper', 9, 4), { cooldown: 99, hp: 400, maxHp: 400, alert: true, respawns: false })];
  let seq: Partial<Intent> = {};
  const run = (s: number, i: Partial<Intent> = {}): FightEvent[] => {
    const out: FightEvent[] = [];
    seq = { ...seq, ...i };
    room.setIntent('me', { ...NO_INTENT, ay: -1, ...seq });
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      Object.assign(room.enemies[0], { x: 9, y: 4, kvx: 0, kvy: 0, cooldown: 99 });
    }
    return out;
  };
  return { room, h, run };
}

describe("the poisoner's kit from the pack", () => {
  it('replaces the daggers in the room: the hand, the kit and the held blow all change', () => {
    const { h, run } = rogueWithKitInPack();
    run(0.1, { gearSeq: 1, gearOp: GEAR.equip, gearArg: 0 });
    expect(h.weapon).toBe('poisoner');
    expect(Object.keys(h.arms)).toEqual(['poisoner']);
    expect(h.bag.some((it) => it.kit === 'poisoner')).toBe(false);
    // Held: a blowgun's dart, never a thrown dagger.
    const ev = [...run(WEAPONS.poisoner.draw!, { attackSeq: 1, attack: true }), ...run(0.4, { attack: false })];
    expect(ev.some((e) => e.k === 'shoot' && e.kind === 'dart')).toBe(true);
    expect(ev.some((e) => e.k === 'shoot' && e.kind === 'knife')).toBe(false);
  });

  it('the plain daggers back from the pack throw a dagger again', () => {
    const { h, run } = rogueWithKitInPack();
    run(0.1, { gearSeq: 1, gearOp: GEAR.equip, gearArg: 0 });
    run(0.1, { gearSeq: 2, gearOp: GEAR.equip, gearArg: -1 });
    expect(h.weapon).toBe('daggers');
    const ev = [...run(1, { attackSeq: 1, attack: true }), ...run(0.4, { attack: false })];
    expect(ev.some((e) => e.k === 'shoot' && e.kind === 'knife')).toBe(true);
  });
});
