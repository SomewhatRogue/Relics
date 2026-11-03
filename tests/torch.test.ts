/** Nests: burning one out up close (sim/torch.ts), and the pace of its waves (sim/spiders.ts). */
import { describe, expect, it } from 'vitest';
import { board, type Job } from '../src/shared/jobs';
import { planRoom, type Foe } from '../src/shared/terrain';
import { NEST, TICK, nestGap } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { kill } from '../src/sim/damage';
import { torchable } from '../src/sim/torch';
import { NO_INTENT, type FightEvent, type Hero } from '../src/sim/types';

const job = (): Job => ({ ...board(3)[1], rooms: 3, place: { name: 'Test', kind: 'forest', region: 'Greyhollow', ruin: 2 }, objective: 'hunt', seed: 77 });
function arena(foes: Foe[], x: number, y: number, ids = ['me']): ArenaRoom {
  const map = { ...planRoom(job(), 0).map, blocks: [], rounds: [], ledges: undefined, water: undefined, npcs: undefined };
  const room = new ArenaRoom(5, { map, foes });
  ids.forEach((id, i) => {
    const h = room.join(id);
    Object.assign(h, { x: x + i * 0.3, y, hp: 100, maxHp: 100 });
    room.setIntent(id, NO_INTENT);
  });
  return room;
}
const run = (room: ArenaRoom, s: number, each?: () => void) => {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events), each?.();
  return out;
};
let seq = 0;
const grab = (room: ArenaRoom, id = 'me') => room.setIntent(id, { ...NO_INTENT, grabSeq: ++seq });
const nestOf = (room: ArenaRoom) => room.enemies.find((e) => e.kind === 'nest')!;
const spiders = (room: ArenaRoom) => room.enemies.filter((e) => e.kind === 'spider' && e.act !== 'dead');
/** Held still and unhurt (the spiders are coming for them). */
const keep = (h: Hero) => () => Object.assign(h, { hp: 100 });

describe('burning a nest out', () => {
  it('takes NEST.light seconds of crouching right by it, and a hit puts it out', () => {
    const room = arena([{ kind: 'nest', x: 14, y: 10, wave: NEST.wave }], 14, 11.2), h = room.heroes[0], n = nestOf(room);
    expect(torchable(h, room.enemies)).toBe(n);
    grab(room);
    run(room, NEST.light * 0.6, keep(h));
    expect(n.lighter).toBe('me');
    expect(h.stoop).toBe(1);
    expect(n.ashAt).toBe(0);
    // Hit: it goes out, and starts again from nothing.
    Object.assign(h, { act: 'hurt', actT: 0, actDur: 0.3 });
    run(room, TICK);
    expect(n.lighter).toBe('');
    expect(n.lightT).toBe(0);
    expect(h.stoop).toBe(0);
    run(room, 0.4, keep(h));
    grab(room);
    run(room, NEST.light - 0.15, keep(h));
    expect(n.ashAt).toBe(0);
    const ev = run(room, 0.25, keep(h));
    expect(ev.some((e) => e.k === 'torched')).toBe(true);
    expect(n.ashAt).toBeGreaterThan(0);
  });

  it('stepping away stops it; too far off, GRAB does nothing to the nest', () => {
    const room = arena([{ kind: 'nest', x: 14, y: 10, wave: NEST.wave }], 14, 11.2), h = room.heroes[0], n = nestOf(room);
    grab(room);
    run(room, 0.3, keep(h));
    Object.assign(h, { y: 10 + NEST.reach + 0.5 });
    run(room, TICK);
    expect(n.lighter).toBe('');
    grab(room);
    run(room, NEST.light + 0.2, keep(h));
    expect(n.ashAt).toBe(0);
  });

  it('alight, it burns out to ash in NEST.burn, sets its spiders burning, and hatches nothing', () => {
    const room = arena([{ kind: 'nest', x: 14, y: 10, wave: NEST.wave }, { kind: 'spider', x: 15.1, y: 10 }], 14, 11.2), h = room.heroes[0], n = nestOf(room);
    const sp = room.enemies.find((e) => e.kind === 'spider')!;
    // Hold the spider off the hero so the lighting isn't broken.
    const hold = () => (keep(h)(), sp.act !== 'dead' && Object.assign(sp, { x: 15.1, y: 10, attack: null, cooldown: 9, act: 'chase' }));
    grab(room);
    run(room, NEST.light + 0.1, hold);
    expect(n.ashAt).toBeGreaterThan(0);
    // A wave was due: none comes while it burns.
    n.nextWave = room.time + 0.1;
    const before = room.enemies.length;
    run(room, 0.3, hold);
    expect(sp.burnUntil).toBeGreaterThan(room.time);
    expect(n.hp).toBeLessThan(n.maxHp);
    const ev = run(room, NEST.burn, hold);
    expect(room.enemies.length).toBe(before);
    expect(n.act).toBe('dead');
    expect(n.death).toBe('burn');
    expect(ev.some((e) => e.k === 'death' && e.kind === 'nest')).toBe(true);
  });

  it('any class, and in a party only one lights it at once', () => {
    const room = arena([{ kind: 'nest', x: 14, y: 10, wave: NEST.wave }], 14, 11.2, ['a', 'b']), [a, b] = room.heroes, n = nestOf(room);
    b.weapon = 'daggers';
    grab(room, 'b');
    run(room, 0.2, () => (keep(a)(), keep(b)()));
    grab(room, 'a');
    run(room, NEST.light, () => (keep(a)(), keep(b)()));
    expect(n.ashAt).toBeGreaterThan(0);
    expect(n.lastBy).toBe('b');
  });
});

describe('a nest\'s waves', () => {
  it('come every nestGap(party), quicker in a bigger party but never under NEST.least', () => {
    expect(nestGap(1)).toBe(NEST.every);
    expect(nestGap(2)).toBeLessThan(nestGap(1));
    expect(nestGap(6)).toBe(NEST.least);
  });

  it('a wave all dead gives NEST.rest seconds before the next', () => {
    const room = arena([{ kind: 'nest', x: 14, y: 6, wave: NEST.wave }], 14, 6 + NEST.wake - 1), h = room.heroes[0], n = nestOf(room);
    run(room, NEST.first + 0.1, keep(h));
    expect(spiders(room)).toHaveLength(NEST.wave);
    // Let it run till just before the next wave is due, then kill the whole wave.
    run(room, NEST.every - 1, keep(h));
    for (const s of spiders(room)) kill(s, room.events);
    run(room, 1.5, keep(h));
    expect(spiders(room)).toHaveLength(0);
    run(room, NEST.rest - 1.7, keep(h));
    expect(spiders(room)).toHaveLength(0);
    run(room, 0.4, keep(h));
    expect(spiders(room)).toHaveLength(NEST.wave);
    expect(n.act).not.toBe('dead');
  });
});
