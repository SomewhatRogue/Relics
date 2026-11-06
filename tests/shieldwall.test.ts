/**
 * The shield-bearer as a lighter Planker (sim/board.ts, VARIANTS.shield): a wall from the front, soft behind.
 * Each attack from the front, the side and the back, plain and heavy; the knock-aside and its window; the
 * cone; the slow turn letting a dodge get behind; every class's answer; the same fight twice.
 */
import { describe, expect, it } from 'vitest';
import { GUARD, HERO, TICK, VARIANTS, WEAPONS, type Swing, type WeaponId } from '../src/shared/tuning';
import { hitEnemy } from '../src/sim/combat';
import { blast, shoot, stepBolt, throwNet } from '../src/sim/bolts';
import { boardOut } from '../src/sim/board';
import { stepHound } from '../src/sim/ranger';
import { shadowstep } from '../src/sim/relics';
import type { World } from '../src/sim/elements';
import { NO_INTENT, type Enemy, type FightEvent, type Hero } from '../src/sim/types';
import { field, run } from './foeyard';

const S = VARIANTS.shield;

/** A shield-bearer at (15, 10) facing (fx, fy), awake, health to spare and no blow coming; a hero 1.2 below, facing it. */
function yard(weapon: WeaponId = 'sword', fx = 0, fy = 1) {
  const f = field([{ kind: 'scrapper', variant: 'shield', x: 15, y: 10 }], [['me', 15, 11.2]]);
  const e = f.room.enemies[0];
  Object.assign(f.h, { weapon, fx: 0, fy: -1 });
  Object.assign(e, { fx, fy, hp: 999, maxHp: 999, cooldown: 99 });
  return { ...f, e };
}

const blow = (dmg = 20, knock = 3): Swing => ({ ...WEAPONS.sword.combo[0], dmg, range: 9, arc: 360, knock });
/** One blow from `h` with these heavy/perfect/counter flags; what it took off. */
function strike(h: Hero, e: Enemy, now: number, ev: FightEvent[], o: { heavy?: boolean; power?: number; perfect?: boolean; counter?: boolean; knock?: number } = {}): number {
  Object.assign(h, { hitIds: [], heavy: !!o.heavy, power: o.power ?? 0, perfect: !!o.perfect, counter: !!o.counter });
  const before = e.hp;
  hitEnemy(h, blow(20, o.knock), e, now, ev);
  return before - e.hp;
}
/** The hero stood at angle `deg` off the goblin's facing, 1.2 out. */
const stand = (h: Hero, e: Enemy, deg: number) => {
  const a = Math.atan2(e.fy, e.fx) + (deg * Math.PI) / 180;
  Object.assign(h, { x: e.x + Math.cos(a) * 1.2, y: e.y + Math.sin(a) * 1.2 });
};

/** A shot from the hero at (15, 11.2) straight up into it; what it took off. */
function shot(w: World, h: Hero, e: Enemy, o: { weapon?: WeaponId; full?: boolean; perfect?: boolean; burst?: number } = {}): number {
  Object.assign(h, { weapon: o.weapon ?? 'longbow', heavy: !!(o.full || o.perfect), power: o.full || o.perfect ? 1 : 0.4, perfect: !!o.perfect, x: e.x, y: e.y + 3, fx: 0, fy: -1 });
  const before = e.hp, b = shoot(h, { ...WEAPONS[o.weapon ?? 'longbow'].heavy, dmg: 20, ...(o.burst ? { burst: o.burst } : {}) }, '');
  for (let i = 0; i < 60 && stepBolt(b, w, TICK); i++);
  return before - e.hp;
}
const world = (h: Hero, e: Enemy, now: number, ev: FightEvent[] = []): World => ({ heroes: [h], enemies: [e], javelins: [], props: [], now, ev });

describe('blows from the front, the side and the back', () => {
  it('plain from the front: a tenth, BLOCKED; from the side all of it; from behind all of it and more', () => {
    const { room, h, e } = yard();
    const ev: FightEvent[] = [];
    expect(strike(h, e, room.time, ev)).toBe(Math.round(20 * S.front));
    expect(ev.some((x) => x.k === 'hit' && x.boarded)).toBe(true);
    stand(h, e, 90);
    expect(strike(h, e, room.time, [])).toBe(20);
    stand(h, e, 180);
    expect(strike(h, e, room.time, [])).toBeGreaterThanOrEqual(Math.round(20 * GUARD.rearMult));
  });

  it('heavy from the front (a held blow short of full, a combo finisher): a quarter, and the board stays up', () => {
    const { room, h, e } = yard();
    const ev: FightEvent[] = [];
    expect(strike(h, e, room.time, ev, { heavy: true, power: 0.5 })).toBe(Math.round(20 * S.heavy));
    expect(strike(h, e, room.time, ev, { knock: 8 })).toBe(Math.round(20 * S.heavy));
    expect(ev.some((x) => x.k === 'boardout')).toBe(false);
    stand(h, e, 90);
    expect(strike(h, e, room.time, [], { heavy: true, power: 0.5 })).toBe(20);
    stand(h, e, 180);
    expect(strike(h, e, room.time, [], { heavy: true, power: 0.5 })).toBeGreaterThanOrEqual(20);
  });

  it('a Rogue knife from the front is next to nothing; in its back, a backstab', () => {
    const { room, h, e } = yard('daggers');
    expect(strike(h, e, room.time, [])).toBe(Math.round(20 * (WEAPONS.daggers.front ?? 1) * S.front));
    stand(h, e, 180);
    expect(strike(h, e, room.time, [])).toBe(Math.round(20 * WEAPONS.daggers.backstab!));
  });

  it('shots: plain stopped dead at the front; a full draw or a perfect a quarter; the side and back in full', () => {
    const { room, h, e } = yard('longbow');
    const ev: FightEvent[] = [], w = world(h, e, room.time, ev);
    expect(shot(w, h, e)).toBe(0);
    expect(ev.some((x) => x.k === 'deflect')).toBe(true);
    expect(shot(w, h, e, { weapon: 'crossbow' })).toBe(0);
    expect(shot(w, h, e, { full: true })).toBe(Math.round(20 * S.through));
    e.boardOutAt = undefined;
    expect(shot(w, h, e, { perfect: true })).toBeLessThanOrEqual(Math.round(20 * 2 * S.through));
    e.boardOutAt = undefined;
    for (const [fx, fy] of [[1, 0], [0, -1]]) {
      Object.assign(e, { fx, fy });
      expect(shot(w, h, e)).toBe(20);
    }
  });

  it('bursts and lightning go round it; stunned, frozen, netted or unaware, it takes it all', () => {
    const { room, h, e } = yard('wand');
    const w = world(h, e, room.time);
    const b = shoot(h, { ...WEAPONS.wand.heavy, dmg: 20 }, 'fire');
    const before = e.hp;
    blast(w, b, e.x, e.y + 0.4);
    // (Its own resistances still count: nothing of the board's.)
    expect(before - e.hp).toBeGreaterThan(Math.round(20 * S.heavy));
    Object.assign(h, { weapon: 'sword', x: 15, y: 11.2 });
    for (const down of [{ act: 'stunned', actDur: 9, actT: 0 }, { frozenUntil: 99 }, { snareUntil: 99 }, { alert: false }] as Partial<Enemy>[]) {
      const { room: r2, h: h2, e: e2 } = yard();
      Object.assign(e2, down);
      expect(strike(h2, e2, r2.time, []), JSON.stringify(down)).toBeGreaterThanOrEqual(20);
    }
  });
});

describe('the knock-aside', () => {
  it('a full charge, a perfect or a counter into the board knocks it aside: BOARD OUT, a quarter, once', () => {
    for (const o of [{ heavy: true, power: 1 }, { heavy: true, power: 1, perfect: true }, { counter: true }]) {
      const { room, h, e } = yard();
      const ev: FightEvent[] = [];
      strike(h, e, room.time, ev, o);
      expect(ev.filter((x) => x.k === 'boardout').length, JSON.stringify(o)).toBe(1);
      expect(e.boardOutAt).toBe(room.time);
      // (The knocking blow itself isn't marked BLOCKED: BOARD OUT says it.)
      expect(ev.some((x) => x.k === 'hit' && x.boarded)).toBe(false);
      // Knocked again while it's out: nothing new goes out.
      strike(h, e, room.time + 0.1, ev, o);
      expect(ev.filter((x) => x.k === 'boardout').length).toBe(1);
    }
  });

  it('for its window anything lands in full from the front, a plain shot too; then the board is back up', () => {
    const { room, h, e } = yard();
    strike(h, e, room.time, [], { heavy: true, power: 1 });
    const t0 = room.time;
    expect(boardOut(e, t0 + S.out - 0.05)).toBe(true);
    expect(strike(h, e, t0 + 0.4, [])).toBe(20);
    expect(shot(world(h, e, t0 + 0.6), h, e)).toBe(20);
    Object.assign(h, { weapon: 'sword', x: 15, y: 11.2, fx: 0, fy: -1 });
    expect(boardOut(e, t0 + S.out + 0.01)).toBe(false);
    expect(strike(h, e, t0 + S.out + 0.05, [])).toBe(Math.round(20 * S.front));
  });

  it('a full draw knocks it aside too, for a friend to hit in full', () => {
    const { room, h, e } = yard('longbow');
    const ev: FightEvent[] = [];
    shot(world(h, e, room.time, ev), h, e, { full: true });
    expect(ev.some((x) => x.k === 'boardout')).toBe(true);
    expect(boardOut(e, room.time + 0.5)).toBe(true);
  });

  it('the board drawn out is one field set once: nothing about it goes out a tick', () => {
    const { room, h, e } = yard();
    strike(h, e, room.time, [], { heavy: true, power: 1 });
    const at = e.boardOutAt;
    run(room, 1);
    expect(e.boardOutAt).toBe(at);
  });
});

describe('the cone', () => {
  it('covers about 70 degrees either side of its facing, for blows and shots alike', () => {
    expect(Math.acos(S.cone) * (180 / Math.PI)).toBeCloseTo(70, 0);
    const { room, h, e } = yard();
    stand(h, e, 64);
    expect(strike(h, e, room.time, [])).toBe(Math.round(20 * S.front));
    stand(h, e, 76);
    expect(strike(h, e, room.time, [])).toBe(20);
    const w = world(h, e, room.time);
    for (const [deg, took] of [[64, 0], [76, 20]]) {
      const a = (deg * Math.PI) / 180;
      Object.assign(e, { fx: Math.sin(a), fy: Math.cos(a) });
      expect(shot(w, h, e), `${deg}`).toBe(took);
    }
  });
});

describe('the slow turn', () => {
  it(`turns ${S.turn} radians a second, not a small goblin's 7`, () => {
    const { room, h, e } = yard('sword', 0, -1);
    // The hero right behind it: half a second later it has turned at most its rate's worth.
    run(room, 0.5);
    const turned = Math.acos(Math.max(-1, Math.min(1, -e.fy)));
    expect(turned).toBeLessThanOrEqual(S.turn * 0.5 + 0.05);
    expect(turned).toBeGreaterThan(S.turn * 0.3);
    void h;
  });

  it('a Rogue dashing past it ends up off its board, and it is slow to come round', () => {
    const { room, h, e } = yard('daggers');
    room.setIntent('me', { ...NO_INTENT, mx: 0.8, my: -1, rollSeq: 1 });
    run(room, WEAPONS.daggers.dodge.time + 0.2);
    const tx = h.x - e.x, ty = h.y - e.y;
    expect(h.y, 'past it').toBeLessThan(e.y);
    expect((e.fx * tx + e.fy * ty) / Math.hypot(tx, ty), 'off its board').toBeLessThan(S.cone);
    Object.assign(h, { fx: -tx, fy: -ty });
    // Nothing off for the board (a Rogue's knives are still its own weak head on, short of its back).
    expect(strike(h, e, room.time, [])).toBeGreaterThanOrEqual(Math.round(20 * (WEAPONS.daggers.front ?? 1)));
  });

  it('a hero walking round it stays off its board', () => {
    const { room, h, e } = yard();
    let front = 0, n = 0;
    for (let i = 0; i < 60; i++) {
      const a = Math.PI / 2 + i * 0.12;
      Object.assign(h, { x: e.x + Math.cos(a) * 1.5, y: e.y + Math.sin(a) * 1.5 });
      run(room, 1 / 30);
      const tx = h.x - e.x, ty = h.y - e.y;
      if (i > 15) (n++, (front += (e.fx * tx + e.fy * ty) / Math.hypot(tx, ty) > S.cone ? 1 : 0));
    }
    expect(front / n).toBeLessThan(0.2);
  });
});

describe("every class's answer", () => {
  it('Warrior: block its stab, and the counter knocks the board aside', () => {
    const { room, h, e } = yard('sword');
    e.cooldown = 0.1;
    room.setIntent('me', { ...NO_INTENT, ay: -1, block: true, blockSeq: 1 });
    const ev = run(room, 3, () => room.events.some((x) => x.k === 'block'));
    void ev;
    expect(HERO.hp - h.hp).toBe(0);
    room.setIntent('me', { ...NO_INTENT, ay: -1, attackSeq: 1 });
    const after = run(room, 0.5);
    expect(after.some((x) => x.k === 'boardout')).toBe(true);
  });

  it('Warrior: TAUNT GUARD turns it round while a friend goes behind and hits it in full', () => {
    const f = field([{ kind: 'scrapper', variant: 'shield', x: 15, y: 10 }], [['me', 15, 11.4], ['pal', 15, 7.6]]);
    const [w, pal] = f.hs, e = f.room.enemies[0];
    Object.assign(w, { weapon: 'sword', drills: { ...(w.drills ?? {}), ladder: 1 } });
    Object.assign(pal, { weapon: 'daggers', fx: 0, fy: 1 });
    Object.assign(e, { fx: 0, fy: -1, hp: 999, maxHp: 999, cooldown: 99 });
    f.room.setIntent('me', { ...NO_INTENT, block: true, blockSeq: 1 });
    run(f.room, 2.5);
    // Turned to the Warrior: its back to the friend.
    expect(e.fy).toBeGreaterThan(0.9);
    expect(strike(pal, e, f.room.time, [])).toBe(Math.round(20 * WEAPONS.daggers.backstab!));
  });

  it('Rogue: SHADOWSTEP lands behind it and stuns it', () => {
    const { room, h, e } = yard('daggers');
    shadowstep(h, [e], [], room.time);
    expect(e.act).toBe('stunned');
    expect(strike(h, e, room.time, [])).toBeGreaterThanOrEqual(20);
  });

  it('Ranger: a net holds it; the hound worries it from behind', () => {
    const { room, h, e } = yard('longbow');
    const w = world(h, e, room.time);
    const b = throwNet(h, '');
    for (let i = 0; i < 60 && stepBolt(b, w, TICK); i++);
    expect(e.snareUntil).toBeGreaterThan(room.time);
    Object.assign(h, { weapon: 'longbow', x: 15, y: 11.2, fx: 0, fy: -1 });
    expect(strike(h, e, room.time, [])).toBeGreaterThanOrEqual(20);
    // The hound: sent at it, it ends up at its back and bites.
    const g = yard('longbow');
    g.h.hound = { x: 15, y: 12, fx: 0, fy: -1, state: 'run', target: g.e.id, t: 0, next: 0, back: 0, bites: 0, moving: false };
    const ev: FightEvent[] = [];
    for (let t = 0; t < 1.5; t += TICK) stepHound(g.h, [g.e], g.room.time + t, TICK, ev);
    const d = g.h.hound!;
    expect((d.x - g.e.x) * g.e.fx + (d.y - g.e.y) * g.e.fy).toBeLessThan(0);
    expect(g.e.hp).toBeLessThan(999);
  });

  it('Ranger: jump back from it and it walks into the snare, held, and takes it all', () => {
    const { room, h, e } = yard('longbow');
    Object.assign(e, { cooldown: 99 });
    h.snareReady = 0;
    room.setIntent('me', { ...NO_INTENT, ay: -1, rollSeq: 1 });
    run(room, 3, () => e.act === 'stunned');
    expect(e.act).toBe('stunned');
    Object.assign(h, { x: e.x, y: e.y + 1.2, fx: 0, fy: -1 });
    expect(strike(h, e, room.time, [])).toBeGreaterThanOrEqual(20);
  });

  it('Mage: a storm cut ignores the board; Healer: a smite stuns it', () => {
    const { room, h, e } = yard('mace');
    const w = world(h, e, room.time);
    const b = shoot(h, { ...WEAPONS.mace.heavy, dmg: 20, burst: 1.3, stun: 1.2 }, '');
    const before = e.hp;
    blast(w, b, e.x, e.y);
    expect(before - e.hp).toBeGreaterThanOrEqual(20);
    expect(e.act).toBe('stunned');
    // (The storm cut through the board: tests/storm.test.ts.)
  });
});

describe('the same fight twice', () => {
  it('a Warrior and a Rogue on two shield-bearers play out the same', () => {
    const play = () => {
      const f = field([{ kind: 'scrapper', variant: 'shield', x: 14, y: 10 }, { kind: 'scrapper', variant: 'shield', x: 16, y: 10 }], [['a', 14, 12], ['b', 16, 8]]);
      Object.assign(f.hs[0], { weapon: 'sword' });
      Object.assign(f.hs[1], { weapon: 'daggers' });
      for (let i = 0; i < 8 / TICK; i++) {
        f.room.setIntent('a', { ...NO_INTENT, ay: -1, attack: i % 40 < 30, attackSeq: Math.floor(i / 40), block: i % 90 > 70 });
        f.room.setIntent('b', { ...NO_INTENT, mx: Math.sin(i / 20), my: 1, attackSeq: Math.floor(i / 7), rollSeq: Math.floor(i / 60) });
        f.room.step();
      }
      return JSON.stringify(f.room.enemies.map((e) => [e.x, e.y, e.hp, e.fx, e.boardOutAt ?? null, e.act]));
    };
    expect(play()).toBe(play());
  });
});
