import { describe, expect, it } from 'vitest';
import { TICK, WEAPONS, rollGear } from '../src/shared/tuning';
import { Rng } from '../src/shared/rng';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { GEAR } from '../src/sim/pack';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

/**
 * Kyle (2026-11-02): "I got the hand crossbow as the Rogue ... and didn't seem to change anything."
 * A hand crossbow taken from the pack, through the room, the way a tap on PACK does it.
 */
function rogueWithCrossbowInPack() {
  const room = new ArenaRoom(1, { scrappers: false });
  const h = room.join('me');
  Object.assign(h, { weapon: 'daggers', x: 9, y: 9, fx: 0, fy: -1 });
  h.bag.push(rollGear(new Rng(3), 'ROGUE', 'fine', 'weapon', 'handbow'));
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

describe('the hand crossbow from the pack', () => {
  it('replaces the daggers in the room: the hand, the kit and the held blow all change', () => {
    const { h, run } = rogueWithCrossbowInPack();
    run(0.1, { gearSeq: 1, gearOp: GEAR.equip, gearArg: 0 });
    expect(h.weapon).toBe('handbow');
    expect(Object.keys(h.arms)).toEqual(['handbow']);
    expect(h.bag.some((it) => it.kit === 'handbow')).toBe(false);
    // Held: a crossbow bolt, never a thrown dagger.
    const ev = [...run(WEAPONS.handbow.draw!, { attackSeq: 1, attack: true }), ...run(0.4, { attack: false })];
    expect(ev.some((e) => e.k === 'shoot' && e.kind === 'bolt')).toBe(true);
    expect(ev.some((e) => e.k === 'shoot' && e.kind === 'knife')).toBe(false);
  });

  it('the plain daggers back from the pack throw a dagger again', () => {
    const { h, run } = rogueWithCrossbowInPack();
    run(0.1, { gearSeq: 1, gearOp: GEAR.equip, gearArg: 0 });
    run(0.1, { gearSeq: 2, gearOp: GEAR.equip, gearArg: -1 });
    expect(h.weapon).toBe('daggers');
    const ev = [...run(1, { attackSeq: 1, attack: true }), ...run(0.4, { attack: false })];
    expect(ev.some((e) => e.k === 'shoot' && e.kind === 'knife')).toBe(true);
  });
});
