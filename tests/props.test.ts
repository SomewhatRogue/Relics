import { describe, expect, it } from 'vitest';
import { PROPS, TICK } from '../src/shared/tuning';
import { newProp } from '../src/sim/props';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const run = (room: ArenaRoom, s: number) => {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events);
  return out;
};

/** A room with one barrel just in front of the hero (facing up) and the goblins parked still. */
function setup(kind: 'barrel' | 'oil' | 'table' = 'barrel') {
  const room = new ArenaRoom(1, { props: false });
  const h = room.join('me');
  const corners = [[1, 15], [17, 15], [1, 9], [17, 9], [17, 13]];
  room.enemies.forEach((e, i) => Object.assign(e, { x: corners[i][0], y: corners[i][1], cooldown: 99, act: e.kind === 'butcher' || e.kind === 'scrapper' ? 'stunned' : e.act, actDur: 99 }));
  const p = newProp(kind, 9, 8.2);
  room.props.push(p);
  Object.assign(h, { x: 9, y: 9, fx: 0, fy: -1 });
  return { room, h, p, g: room.enemies[3] };
}

describe('props', () => {
  it('the Warrior lifts a barrel; a Ranger cannot', () => {
    const a = setup();
    a.room.setIntent('me', intent({ grabSeq: 1, ay: -1 }));
    run(a.room, 0.1);
    expect(a.h.lifting).toBe(a.p.id);
    const b = setup();
    for (let i = 1; i <= 1; i++) b.room.setIntent('me', intent({ classSeq: i })), b.room.step();
    expect(b.h.weapon).toBe('longbow');
    b.room.setIntent('me', intent({ classSeq: 1, grabSeq: 1, ay: -1 }));
    run(b.room, 0.1);
    expect(b.h.lifting).toBe(0);
  });

  it('a thrown barrel smashes on a goblin, hurting it and breaking into staves', () => {
    const { room, p, g } = setup();
    Object.assign(g, { x: 9, y: 4.5, hp: 200, maxHp: 200 });
    room.setIntent('me', intent({ grabSeq: 1, ay: -1 }));
    run(room, 0.1);
    room.setIntent('me', intent({ grabSeq: 2, ay: -1 }));
    const ev = run(room, 0.6);
    expect(ev.some((e) => e.k === 'propbreak' && e.kind === 'barrel')).toBe(true);
    expect(g.hp).toBeLessThan(200 - 20);
    expect(p.broken).toBe(true);
    expect(room.props.filter((q) => q.kind === 'stave').length).toBe(PROPS.barrel.pieces!.n);
  });

  it('a sword breaks a barrel in a few blows', () => {
    const { room, p } = setup();
    let seq = 0;
    for (let i = 0; i < 60 && !p.broken; i++) {
      if (i % 9 === 0) room.setIntent('me', intent({ attackSeq: ++seq, ay: -1 }));
      room.step();
    }
    expect(p.broken).toBe(true);
  });

  it('a slammed table breaks on the goblin under it', () => {
    const { room, h, p, g } = setup('table');
    Object.assign(p, { x: 9, y: 9.9 });
    h.fy = 1;
    room.setIntent('me', intent({ grabSeq: 1, ay: 1 }));
    run(room, 0.1);
    expect(h.lifting).toBe(p.id);
    Object.assign(g, { x: 9, y: 8.1, hp: 200, maxHp: 200 });
    room.setIntent('me', intent({ grabSeq: 1, attackSeq: 1, ay: -1 }));
    run(room, 0.5);
    expect(p.broken).toBe(true);
    expect(g.hp).toBeLessThan(200);
  });

  it('the oil barrel goes up in flame when it breaks', () => {
    const { room, p, g } = setup('oil');
    Object.assign(g, { x: 9.8, y: 8.2, hp: 200, maxHp: 200 });
    let seq = 0;
    const ev: FightEvent[] = [];
    for (let i = 0; i < 60 && !p.broken; i++) {
      if (i % 9 === 0) room.setIntent('me', intent({ attackSeq: ++seq, ay: -1 }));
      room.step();
      ev.push(...room.events);
    }
    expect(ev.some((e) => e.k === 'oilfire')).toBe(true);
    expect(g.burnUntil).toBeGreaterThan(room.time);
  });

  it('broken furniture comes back; pieces fade', () => {
    const { room, p } = setup();
    p.hp = 1;
    room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
    run(room, 0.4);
    expect(p.broken).toBe(true);
    run(room, 26);
    expect(p.broken).toBe(false);
    expect(room.props.some((q) => q.kind === 'stave')).toBe(false);
  });
});
