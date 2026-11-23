import { describe, expect, it } from 'vitest';
import { DARTS, TICK, WEAPONS } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

/**
 * Kyle (2026-11-23): "the blow dart shouldnt stagger anyone out of an attack specifically not a big guy", and
 * "you get five max and they return at a rate of one every five seconds".
 */
function poisoner(kind: 'scrapper' | 'butcher' = 'scrapper') {
  const room = new ArenaRoom(1, { scrappers: false });
  const h = room.join('me');
  Object.assign(h, { weapon: 'poisoner', x: 9, y: 9, fx: 0, fy: -1 });
  room.enemies = [Object.assign(newEnemy(10, kind, 9, 4), { cooldown: 99, hp: 400, maxHp: 400, alert: true, respawns: false })];
  let seq = 0;
  const step = (s: number, i: Partial<Intent> = {}): FightEvent[] => {
    const out: FightEvent[] = [];
    room.setIntent('me', { ...NO_INTENT, ay: -1, attackSeq: seq, ...i });
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      Object.assign(room.enemies[0], { x: 9, y: 4, kvx: 0, kvy: 0 });
    }
    return out;
  };
  /** One full draw, let go: the events. */
  const dart = () => {
    seq++;
    return [...step(WEAPONS.poisoner.draw! + 0.05, { attack: true }), ...step(0.5, { attack: false })];
  };
  return { room, h, step, dart };
}

const darted = (ev: FightEvent[]) => ev.some((e) => e.k === 'shoot' && e.kind === 'dart');

describe("the poisoner's darts", () => {
  it('five in the pouch: the sixth hold looses nothing and says so', () => {
    const { room, h, dart } = poisoner();
    for (let i = 0; i < DARTS.most; i++) expect(darted(dart())).toBe(true);
    // (Five full draws take longer than five seconds: one has come back by the last.)
    expect(h.darts).toBeLessThanOrEqual(1);
    Object.assign(h, { darts: 0, dartAt: room.time + DARTS.back });
    const ev = dart();
    expect(darted(ev)).toBe(false);
    expect(ev.some((e) => e.k === 'nodart')).toBe(true);
  });

  it('one comes back every five seconds, up to five', () => {
    const { h, step, dart } = poisoner();
    for (let i = 0; i < DARTS.most; i++) dart();
    step(DARTS.back + 0.1);
    expect(h.darts).toBeGreaterThanOrEqual(1);
    step(DARTS.back * DARTS.most + 1);
    expect(h.darts ?? DARTS.most).toBe(DARTS.most);
  });

  it("doesn't break a goblin out of its blow, small or big", () => {
    for (const kind of ['scrapper', 'butcher'] as const) {
      const { room, step, dart } = poisoner(kind);
      step(0.2);
      const e = room.enemies[0];
      // Mid wind-up: a blow begun, held there while the dart flies.
      const blow = { kind: 'swing', t: 0, windup: 9, active: 0.2, recover: 0.3, dmg: 1, range: 1.2, arc: 90 } as unknown as NonNullable<typeof e.attack>;
      Object.assign(e, { attack: blow, act: 'windup', actT: 0, actDur: 9, cooldown: 99 });
      dart();
      expect(e.act === 'flinch' || e.act === 'stunned').toBe(false);
      expect(e.attack).not.toBeNull();
    }
  });
});
