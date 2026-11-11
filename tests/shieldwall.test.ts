/**
 * The shield-bearer (sim/board.ts, VARIANTS.shield): the board stops everything from the front, and lowers
 * for its own blow. Each attack from the front, the side and the back; the lowered window; the cone; the
 * slow turn letting a dodge get behind; every class's answer; the same fight twice.
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

describe('the board from the front (Kyle, 2026-11-11: it stops everything)', () => {
  it('a blow from the front, plain, heavy, charged, perfect or a counter, does nothing: BLOCKED', () => {
    const { room, h, e } = yard();
    const ev: FightEvent[] = [];
    for (const o of [{}, { heavy: true, power: 0.5 }, { heavy: true, power: 1 }, { perfect: true }, { counter: true }, { knock: 8 }]) expect(strike(h, e, room.time, ev, o), JSON.stringify(o)).toBe(0);
    expect(ev.filter((x) => x.k === 'hit' && x.boarded).length).toBe(6);
  });

  it('from the side all of it; from behind all of it and more; a Rogue knife in its back is a backstab', () => {
    const { room, h, e } = yard();
    stand(h, e, 90);
    expect(strike(h, e, room.time, [])).toBe(20);
    stand(h, e, 180);
    expect(strike(h, e, room.time, [])).toBeGreaterThanOrEqual(Math.round(20 * GUARD.rearMult));
    const r = yard('daggers');
    stand(r.h, r.e, 180);
    expect(strike(r.h, r.e, r.room.time, [])).toBe(Math.round(20 * WEAPONS.daggers.backstab!));
  });

  it('shots from the front are stopped dead, a full draw and a perfect too; the side and back in full', () => {
    const { room, h, e } = yard('longbow');
    const ev: FightEvent[] = [], w = world(h, e, room.time, ev);
    expect(shot(w, h, e)).toBe(0);
    expect(ev.some((x) => x.k === 'deflect')).toBe(true);
    expect(shot(w, h, e, { weapon: 'crossbow' })).toBe(0);
    expect(shot(w, h, e, { full: true })).toBe(0);
    expect(shot(w, h, e, { perfect: true })).toBe(0);
    for (const [fx, fy] of [[1, 0], [0, -1]]) {
      Object.assign(e, { fx, fy });
      expect(shot(w, h, e)).toBe(20);
    }
  });

  it("a burst set off in front breaks on the board; one on top of it lands; stunned, frozen, netted or unaware, it takes it all", () => {
    const { room, h, e } = yard('wand');
    const w = world(h, e, room.time);
    const b = shoot(h, { ...WEAPONS.wand.heavy, dmg: 20 }, 'fire');
    const before = e.hp;
    blast(w, b, e.x, e.y + 0.8);
    expect(before - e.hp).toBe(0);
    blast(w, b, e.x, e.y);
    expect(before - e.hp).toBeGreaterThan(0);
    Object.assign(h, { weapon: 'sword', x: 15, y: 11.2 });
    for (const down of [{ act: 'stunned', actDur: 9, actT: 0 }, { frozenUntil: 99 }, { snareUntil: 99 }, { alert: false }] as Partial<Enemy>[]) {
      const { room: r2, h: h2, e: e2 } = yard();
      Object.assign(e2, down);
      expect(strike(h2, e2, r2.time, []), JSON.stringify(down)).toBeGreaterThanOrEqual(20);
    }
  });
});

describe('the board lowered for its own blow', () => {
  it(`down for the last ${S.drop} s of its wind-up and the blow, ${S.after} s after; up otherwise`, () => {
    const { room, h, e } = yard();
    e.act = 'attack';
    e.attack = { ...WEAPONS.sword.combo[0], kind: 'stab', t: 0, windup: 1.4, active: 0.1, recover: 0.6, x: 15, y: 11, dx: 0, dy: 1, dmg: 5, range: 1.3, arc: 60, knock: 2, unblockable: false } as unknown as Enemy['attack'];
    expect(boardOut(e)).toBe(false);
    expect(strike(h, e, room.time, [])).toBe(0);
    e.attack!.t = 1.4 - S.drop + 0.05;
    expect(boardOut(e)).toBe(true);
    expect(strike(h, e, room.time, [])).toBe(20);
    e.attack!.t = 1.4 + 0.1 + S.after + 0.05;
    expect(boardOut(e)).toBe(false);
  });
});

describe('the cone', () => {
  it('covers about 70 degrees either side of its facing, for blows and shots alike', () => {
    expect(Math.acos(S.cone) * (180 / Math.PI)).toBeCloseTo(70, 0);
    const { room, h, e } = yard();
    stand(h, e, 64);
    expect(strike(h, e, room.time, [])).toBe(0);
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
  it('Warrior: block its stab, and the counter lands while its board is still down', () => {
    const { room, h, e } = yard('sword');
    e.cooldown = 0.1;
    room.setIntent('me', { ...NO_INTENT, ay: -1, block: true, blockSeq: 1 });
    run(room, 3, () => room.events.some((x) => x.k === 'block'));
    expect(HERO.hp - h.hp).toBe(0);
    const hp = e.hp;
    room.setIntent('me', { ...NO_INTENT, ay: -1, attackSeq: 1 });
    run(room, 0.5);
    expect(e.hp).toBeLessThan(hp);
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

  it('Healer: a smite on top of it stuns it', () => {
    const { room, h, e } = yard('mace');
    const w = world(h, e, room.time);
    const b = shoot(h, { ...WEAPONS.mace.heavy, dmg: 20, burst: 1.3, stun: 1.2 }, '');
    const before = e.hp;
    blast(w, b, e.x, e.y);
    expect(before - e.hp).toBeGreaterThanOrEqual(20);
    expect(e.act).toBe('stunned');
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
      return JSON.stringify(f.room.enemies.map((e) => [e.x, e.y, e.hp, e.fx, e.act]));
    };
    expect(play()).toBe(play());
  });
});
