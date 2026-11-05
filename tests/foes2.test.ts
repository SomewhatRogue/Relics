/** Wolves and their keeper, the oil thrower and its torch, the sapper, carrion crows and the blind hunters. */
import { describe, expect, it } from 'vitest';
import { CAVE, CROWS, HERO, OIL, SAPPER, TORCH, WOLF } from '../src/shared/tuning';
import { NO_INTENT } from '../src/sim/types';
import { kill } from '../src/sim/damage';
import { FIELD, field, run } from './foeyard';
import { ArenaRoom } from '../src/sim/room';
import { stepSappers } from '../src/sim/sapper';

describe('wolves and their keeper', () => {
  const pack = () => field([
    { kind: 'scrapper', variant: 'keeper', x: 15, y: 3, pack: 1 },
    { kind: 'scrapper', variant: 'wolf', x: 13, y: 7, pack: 1 }, { kind: 'scrapper', variant: 'wolf', x: 17, y: 7, pack: 1 }, { kind: 'scrapper', variant: 'wolf', x: 15, y: 6, pack: 1 },
  ], [['me', 15, 14]]);

  it('circle round to your side and back before they dart in on a short lane', () => {
    const { room, h } = pack();
    const wolves = room.enemies.filter((e) => e.variant === 'wolf');
    expect(wolves[0].radius).toBe(WOLF.radius);
    run(room, 1.4);
    // Round toward the back (you face up the screen: behind you is down it).
    expect(wolves.some((w) => w.y > h.y - 0.5)).toBe(true);
    const ev = run(room, 4, () => wolves.some((w) => w.attack?.kind === 'pounce'));
    const a = wolves.find((w) => w.attack?.kind === 'pounce')!.attack!;
    expect(a.unblockable).toBe(false);
    expect(a.range).toBe(WOLF.dart.range);
    void ev;
  });

  it('kill the keeper and they scatter; far enough off, they are gone', () => {
    const { room } = pack();
    run(room, 0.5);
    kill(room.enemies[0], room.events);
    const ev = run(room, 0.1);
    expect(ev.filter((e) => e.k === 'scatter')).toHaveLength(3);
    const wolves = room.enemies.filter((e) => e.variant === 'wolf');
    expect(wolves.every((w) => (w.scatterUntil ?? 0) > room.time)).toBe(true);
    run(room, WOLF.scatter);
    expect(wolves.filter((w) => w.escaped).length).toBeGreaterThan(0);
  });
});

describe('the oil thrower and its torch', () => {
  it('lobs oil where you stand and leaves a slick; on it your stick takes hold slowly', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'oiler', x: 15, y: 8 }]);
    const o = room.enemies[0];
    run(room, 4, () => o.attack?.kind === 'lob');
    expect(o.attack!.unblockable).toBe(true);
    expect([o.attack!.cx, o.attack!.cy]).toEqual([h.x, h.y]);
    run(room, o.attack!.windup + 0.1);
    expect(room.slicks).toHaveLength(1);
    expect(h.slick).toBe(true);
    // Push right from standing: on oil you've hardly moved off where you'd be on dry ground.
    kill(o, room.events);
    const x0 = h.x;
    room.setIntent('me', { ...NO_INTENT, mx: 1 });
    run(room, 0.2);
    expect(h.x - x0).toBeLessThan(HERO.speed * 0.2 * 0.6);
  });

  it('the torch-bearer walks to the slick you stand in and lights it; it burns you', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'oiler', x: 15, y: 8 }, { kind: 'scrapper', variant: 'torch', x: 19, y: 10 }]);
    const [o, t] = room.enemies;
    run(room, 4, () => room.slicks.length > 0);
    kill(o, room.events);
    const hp = h.hp;
    const ev = run(room, 6, () => t.attack?.kind === 'torch');
    expect(t.attack?.kind).toBe('torch');
    expect(t.attack!.radius).toBe(OIL.radius);
    run(room, TORCH.warn + 1.2, () => false);
    expect(room.slicks[0]?.lit ?? 1).toBeGreaterThanOrEqual(0);
    expect(h.hp).toBeLessThan(hp);
    void ev;
  });

  it('fire lights a slick (a burning goblin walking into it), and the goblins standing in it burn', () => {
    const { room } = field([{ kind: 'scrapper', x: 10, y: 6, awake: false }, { kind: 'scrapper', x: 10.6, y: 6.3, awake: false }], [['me', 25, 20]]);
    room.slicks.push({ id: 1, x: 10, y: 6, r: OIL.radius, until: 99, lit: -1 });
    room.enemies[1].burnUntil = 99;
    const ev = run(room, 0.3);
    expect(ev.some((e) => e.k === 'oilup')).toBe(true);
    expect(room.enemies[0].burnUntil).toBeGreaterThan(room.time);
  });
});

describe('the sapper', () => {
  it('digs in, goes under where nothing touches it, and comes up behind you', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'sapper', x: 15, y: 8 }]);
    const s = room.enemies[0];
    const ev = run(room, 3, () => !!s.under);
    expect(ev.some((e) => e.k === 'dig')).toBe(true);
    expect(s.act).toBe('carried');
    run(room, SAPPER.most, () => !s.under);
    expect(s.attack?.kind).toBe('erupt');
    // Behind: past you, the far side from where it started (you face up the screen).
    expect(s.y).toBeGreaterThan(h.y);
    expect(s.attack!.unblockable).toBe(true);
  });

  it('a heavy blow on the dirt over it forces it up, stunned', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'sapper', x: 15, y: 8 }]);
    const s = room.enemies[0];
    run(room, 3, () => !!s.under);
    run(room, SAPPER.dig + 0.1);
    Object.assign(h, { x: s.x, y: s.y + 1, fx: 0, fy: -1 });
    stepSappers({ heroes: room.heroes, enemies: room.enemies, javelins: [], props: [], now: room.time, ev: [{ k: 'swing', x: h.x, y: h.y, src: 'sword', heavy: true }] }, 1 / 30);
    expect(s.under).toBe(false);
    expect(s.act).toBe('stunned');
  });
});

describe('carrion crows', () => {
  const flock = () => {
    const map = { ...FIELD(), flocks: [{ x: 15, y: 8 }] };
    const room = new ArenaRoom(5, { map, foes: [{ kind: 'scrapper', x: 18, y: 6, awake: false }, { kind: 'scrapper', x: 4, y: 20, awake: false }], furniture: [] });
    const h = Object.assign(room.join('me'), { x: 15, y: 14, fx: 0, fy: -1, safeT: 0 });
    return { room, h };
  };

  it('creep past and they stay on the dead; walk up and they burst up, waking the goblins near', () => {
    const { room, h } = flock();
    room.setIntent('me', { ...NO_INTENT, my: -0.3 });
    h.sneaking = true;
    Object.assign(h, { y: 8 + CROWS.creep + 0.6 }); // (a creep is a steady half pace now)
    run(room, 0.2);
    expect(room.crows[0].up).toBe(-1);
    room.setIntent('me', { ...NO_INTENT, my: -1 });
    Object.assign(h, { y: 8 + CROWS.near - 0.2 });
    const ev = run(room, 0.2);
    expect(ev.some((e) => e.k === 'crows')).toBe(true);
    expect(room.enemies[0].alert).toBe(true);
    expect(room.enemies[1].alert).toBe(false);
    expect(h.crowsUntil ?? 0).toBe(0);
  });

  it('a fight near them sends them up too, and anyone close is lost in them a moment', () => {
    const { room, h } = flock();
    Object.assign(h, { x: 16, y: 9.5 });
    run(room, 0.1);
    expect(room.crows[0].up).toBeGreaterThanOrEqual(0);
    expect(h.crowsUntil).toBeGreaterThan(room.time);
  });
});

describe('the blind hunters', () => {
  it('a hero creeping past is not heard; a hero walking near is, and they come to the sound', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'blind', x: 15, y: 10, awake: false }], [['me', 15, 14]]);
    const b = room.enemies[0];
    h.sneaking = true;
    room.setIntent('me', { ...NO_INTENT, mx: 0.3 });
    run(room, 1);
    expect(b.alert).toBe(false);
    h.sneaking = false;
    room.setIntent('me', { ...NO_INTENT, mx: 1 });
    run(room, 0.5);
    expect(b.alert).toBe(true);
    expect(b.heardAt).toBeGreaterThan(0);
  });

  it('a fight far off brings them; quiet long enough and they lose you', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'blind', x: 3, y: 3, awake: false }, { kind: 'scrapper', x: 12, y: 10 }], [['me', 12, 11.5]]);
    const b = room.enemies[0];
    room.setIntent('me', { ...NO_INTENT, attackSeq: 1 });
    run(room, 0.6);
    expect(b.alert).toBe(true);
    // Stand stock still (and the goblin gone): quiet.
    kill(room.enemies[1], room.events);
    room.setIntent('me', { ...NO_INTENT, attackSeq: 1 });
    Object.assign(h, { x: 25, y: 20 });
    run(room, CAVE.forget + 1.5);
    expect(b.alert).toBe(false);
  });
});
