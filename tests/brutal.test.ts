import { describe, expect, it } from 'vitest';
import { GRAB, TICK } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const run = (room: ArenaRoom, s: number) => {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events);
  return out;
};

/** A hero facing up at a scrapper just ahead; everyone else parked and still. */
function setup(act: 'stunned' | 'chase' = 'stunned') {
  const room = new ArenaRoom(1);
  const h = room.join('me');
  const corners = [[1, 15], [17, 15], [1, 9], [17, 9], [17, 13]];
  room.enemies.forEach((e, i) => Object.assign(e, { x: corners[i][0], y: corners[i][1], cooldown: 99, act: e.kind === 'butcher' || e.kind === 'scrapper' ? 'stunned' : e.act, actDur: 99 }));
  const t = room.enemies[3], o = room.enemies[4];
  Object.assign(t, { x: 9, y: 8, act, fx: 0, fy: 1, hp: 200, maxHp: 200 });
  Object.assign(h, { x: 9, y: 9, fx: 0, fy: -1 });
  return { room, h, t, o };
}

describe('grab, slam, throw', () => {
  it("can't grab a goblin that faces you and is ready (unless you're a Warrior)", () => {
    const { room, h, t } = setup('chase');
    t.cooldown = 99;
    h.weapon = 'mace';
    room.setIntent('me', intent({ grabSeq: 1, ay: -1 }));
    run(room, 0.1);
    expect(h.act).not.toBe('carry');
  });

  it('a Warrior picks up a small goblin that faces him and is ready', () => {
    const { room, h, t } = setup('chase');
    t.cooldown = 99;
    h.weapon = 'sword';
    room.setIntent('me', intent({ grabSeq: 1, ay: -1 }));
    run(room, 0.1);
    expect(h.act).toBe('carry');
  });

  it('grabs a stunned goblin and slams it into the ground', () => {
    const { room, h, t } = setup();
    room.setIntent('me', intent({ grabSeq: 1, ay: -1 }));
    run(room, 0.1);
    expect(h.act).toBe('carry');
    expect(t.act).toBe('carried');
    room.setIntent('me', intent({ grabSeq: 1, attackSeq: 1, ay: -1 }));
    const ev = run(room, GRAB.slamWindup + 0.1);
    expect(ev.some((e) => e.k === 'slam')).toBe(true);
    expect(200 - t.hp).toBeGreaterThanOrEqual(GRAB.slamDmg);
    expect(t.act).toBe('stunned');
  });

  it('a slam that kills pounds the head in', () => {
    const { room, t } = setup();
    t.hp = 10;
    room.setIntent('me', intent({ grabSeq: 1, ay: -1 }));
    run(room, 0.1);
    room.setIntent('me', intent({ grabSeq: 1, attackSeq: 1, ay: -1 }));
    const ev = run(room, GRAB.slamWindup + 0.1);
    expect(ev.find((e) => e.k === 'death')).toMatchObject({ how: 'burst' });
  });

  it('a thrown goblin bowls over another', () => {
    const { room, t, o } = setup();
    Object.assign(o, { x: 9, y: 4, act: 'chase', hp: 200, maxHp: 200 });
    room.setIntent('me', intent({ grabSeq: 1, ay: -1 }));
    run(room, 0.1);
    room.setIntent('me', intent({ grabSeq: 2, ay: -1 }));
    const ev = run(room, 0.5);
    expect(ev.some((e) => e.k === 'hurl')).toBe(true);
    expect(ev.some((e) => e.k === 'bodyhit')).toBe(true);
    expect(o.hp).toBeLessThan(200);
    expect(t.hp).toBeLessThan(200);
  });

  it('it wriggles free if you hold it too long', () => {
    const { room, h, t } = setup();
    room.setIntent('me', intent({ grabSeq: 1, ay: -1 }));
    run(room, GRAB.hold + 0.2);
    expect(h.carrying).toBe(0);
    expect(t.act).not.toBe('carried');
  });
});

describe('deaths', () => {
  it('a blade cuts them down, in two, or takes the head; a mace bursts it', () => {
    const die = (weapon: 'sword' | 'mace') => {
      const { room, h, t } = setup();
      h.weapon = weapon;
      t.hp = 5;
      room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
      return run(room, 0.4).find((e) => e.k === 'death');
    };
    expect(['behead', 'halve', 'opened']).toContain(die('sword')!.how);
    expect(die('mace')).toMatchObject({ how: 'burst' });
  });

  it('a big overkill bursts the body whatever the weapon', () => {
    const { room, h, t } = setup();
    h.weapon = 'greatsword';
    t.hp = 2;
    room.setIntent('me', intent({ attackSeq: 1, attack: true, ay: -1 }));
    run(room, 1);
    room.setIntent('me', intent({ attackSeq: 1, attack: false, ay: -1 }));
    expect(run(room, 0.5).find((e) => e.k === 'death')).toMatchObject({ how: 'burst' });
  });
});
