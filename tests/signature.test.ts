/** Each class's own button (Kyle, 2026-11-05; shared/signs.ts, sim/signature.ts): the Rogue's SHADOW STEP,
 *  the Ranger's MARK, the Healer's MEND, each pressed by a guest too; and the Rogue's new SMOKE BOMB. */
import { describe, expect, it } from 'vitest';
import { HEAL_SIGN, MARK_SIGN, SIGNS } from '../src/shared/signs';
import { ARCHER, POTION, SHADOWSTEP, SMOKEBOMB, TICK, WEAPONS, type WeaponId } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { begin, newEnemy } from '../src/sim/enemies';
import { damage } from '../src/sim/damage';
import { shoot } from '../src/sim/bolts';
import { NO_INTENT, type Enemy, type FightEvent, type Hero, type Intent } from '../src/sim/types';

/** A hero of `weapon`'s class at (9, 9) facing up, goblins held at each spot. */
function arena(weapon: WeaponId, at: [number, number][] = [[9, 6]], id = 'me') {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  const h = room.join(id);
  Object.assign(h, { weapon, x: 9, y: 9, fx: 0, fy: -1, safeT: 0 });
  const es = at.map(([x, y], i) => Object.assign(newEnemy(10 + i, 'scrapper', x, y), { cooldown: 99, hp: 400, maxHp: 400, alert: true, fx: 0, fy: -1, respawns: false }));
  room.enemies = es;
  const run = (s: number, i: Partial<Intent> = {}, who = id): FightEvent[] => {
    const out: FightEvent[] = [];
    room.setIntent(who, { ...NO_INTENT, ...i });
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      es.forEach((e, j) => Object.assign(e, { x: at[j][0], y: at[j][1], kvx: 0, kvy: 0, cooldown: 99 }));
    }
    return out;
  };
  return { room, h, es, run };
}

describe('SHADOW STEP, the Rogue’s own button', () => {
  it('steps behind the goblin faced, stuns it, and waits its 20 s; a press in the wait does nothing', () => {
    const a = arena('daggers', [[9, 5]]);
    // It faces the hero, so its back is the far side.
    a.es[0].fy = 1;
    let ev = a.run(0.3, { signSeq: 1 });
    expect(ev.some((e) => e.k === 'shadow')).toBe(true);
    expect(a.h.y).toBeLessThan(5);
    expect(a.es[0].act).toBe('stunned');
    expect(a.h.signReady).toBeCloseTo(a.room.time - 0.3 + 0.06 + SHADOWSTEP.cooldown, 0);
    expect(SIGNS.shadow.cooldown).toBe(SHADOWSTEP.cooldown);
    Object.assign(a.h, { x: 9, y: 9 });
    ev = a.run(0.3, { signSeq: 2 });
    expect(ev.some((e) => e.k === 'shadow')).toBe(false);
    expect(a.h.y).toBeCloseTo(9);
  });

  it("a guest's press steps on the leader's room", () => {
    const a = arena('daggers', [[4, 5]]);
    const g = a.room.join('guest');
    Object.assign(g, { weapon: 'daggers', x: 4, y: 9, fx: 0, fy: -1, safeT: 0 });
    a.es[0].fy = 1;
    const ev = a.run(0.3, { signSeq: 1 }, 'guest');
    expect(ev.some((e) => e.k === 'shadow')).toBe(true);
    expect(g.y).toBeLessThan(5);
  });

  it('is nobody else’s: a Warrior’s press does nothing', () => {
    const a = arena('sword', [[9, 5]]);
    const ev = a.run(0.3, { signSeq: 1 });
    expect(ev.some((e) => e.k === 'shadow' || e.k === 'hunted' || e.k === 'mended')).toBe(false);
    expect(a.h.y).toBeCloseTo(9);
  });
});

describe('MARK, the Ranger’s own button', () => {
  it('marks the goblin faced for 8 s on a 10 s wait; a new mark moves it; the hound goes for it', () => {
    const a = arena('longbow', [[9, 4], [13, 9]]);
    a.run(0.1);
    let ev = a.run(0.1, { signSeq: 1 });
    expect(ev.find((e) => e.k === 'hunted')).toBeTruthy();
    expect(a.es[0].markedBy).toBe('me');
    expect(a.es[0].markedUntil).toBeCloseTo(a.room.time - 0.1 + MARK_SIGN.time, 0);
    expect(a.es[1].markedBy).toBeFalsy();
    expect(a.h.hound?.target).toBe(a.es[0].id);
    // In the wait, nothing.
    ev = a.run(0.2, { signSeq: 2, ax: 4, ay: 0 });
    expect(ev.some((e) => e.k === 'hunted')).toBe(false);
    // After it, the laptop's pointer picks the other: the first comes off (one mark a Ranger).
    a.h.signReady = 0;
    a.run(0.1, { signSeq: 3, ax: 4, ay: 0 });
    expect(a.es[1].markedBy).toBe('me');
    expect(a.es[0].markedBy).toBe('');
    expect(MARK_SIGN.cooldown).toBe(10);
  });

  it('nothing in reach: says so, and costs nothing', () => {
    const a = arena('longbow', [[9, 9 - MARK_SIGN.range - 2]]);
    const ev = a.run(0.2, { signSeq: 1 });
    expect(ev.find((e) => e.k === 'nosign')).toMatchObject({ why: 'mark' });
    expect(a.h.signReady ?? 0).toBe(0);
  });

  it('a marked goblin takes 5 more from a quick hit, 40% more from a heavy, a little more from a tick, and only while marked', () => {
    const a = arena('longbow', [[9, 4]]), e = a.es[0];
    damage(e, 20, a.room.time, []);
    expect(e.maxHp - e.hp).toBe(20);
    Object.assign(e, { hp: 400, markedBy: 'friend', markedUntil: a.room.time + 5 });
    const ev: FightEvent[] = [];
    damage(e, 20, a.room.time, ev);
    expect(400 - e.hp).toBe(25);
    expect(ev.find((x) => x.k === 'hit')).toMatchObject({ marked: true });
    damage(e, 20, a.room.time, [], { heavy: true });
    expect(400 - e.hp).toBe(25 + 28);
    damage(e, 4, a.room.time, [], { tick: true });
    expect(400 - e.hp).toBe(25 + 28 + 5);
    e.markedUntil = a.room.time - 0.1;
    e.hp = 400;
    damage(e, 20, a.room.time, []);
    expect(400 - e.hp).toBe(20);
  });

  it("the Ranger's arrows bend toward their mark, a little; another's, and a far-off mark, don't", () => {
    const fly = (owner: string, markedBy: string, ex: number) => {
      const a = arena('longbow', [[ex, 3]]);
      Object.assign(a.es[0], { markedBy, markedUntil: 99 });
      const s = WEAPONS.longbow.heavy;
      const b = shoot({ ...a.h, id: owner, fx: 0, fy: -1 } as Hero, { ...s, shot: 'arrow' }, '');
      a.room.bolts = [b];
      a.room.step();
      return b.dx;
    };
    // Off the line by 0.9 tiles at 6 tiles: inside the cone, so it turns toward it.
    expect(fly('me', 'me', 9.9)).toBeGreaterThan(0.001);
    expect(fly('me', 'friend', 9.9)).toBeCloseTo(0, 5);
    // Well off the line: no turn (an aim assist, not a homing arrow).
    expect(fly('me', 'me', 14)).toBeCloseTo(0, 5);
    // And slight: no more than MARK_SIGN.bend a second.
    expect(Math.asin(fly('me', 'me', 9.9))).toBeLessThanOrEqual(MARK_SIGN.bend * TICK + 1e-6);
  });

  it("a guest's press marks on the leader's room", () => {
    const a = arena('longbow', [[4, 5]]);
    const g = a.room.join('guest');
    Object.assign(g, { weapon: 'longbow', x: 4, y: 9, fx: 0, fy: -1, safeT: 0 });
    a.run(0.2, { signSeq: 1 }, 'guest');
    expect(a.es[0].markedBy).toBe('guest');
  });
});

describe('MEND, the Healer’s own button', () => {
  const healer = (friends: [number, number, number][] = []) => {
    const a = arena('mace', [[2, 2]]);
    const fs = friends.map(([x, y, hp], i) => Object.assign(a.room.join('f' + i), { weapon: 'sword', x, y, hp, safeT: 0 }));
    return { ...a, fs };
  };

  it('heals the nearest hurt friend 25 for 20 stamina, on a 12 s wait, with a gold line', () => {
    const a = healer([[10, 9, 50], [12, 9, 40]]);
    const ev = a.run(0.1, { signSeq: 1 });
    expect(a.fs[0].hp).toBe(50 + HEAL_SIGN.heal);
    expect(a.fs[1].hp).toBe(40);
    expect(ev.find((e) => e.k === 'mended')).toMatchObject({ self: false, n: HEAL_SIGN.heal });
    expect(a.h.stamina).toBeLessThanOrEqual(100 - HEAL_SIGN.cost + 1);
    expect(a.h.signReady).toBeCloseTo(a.room.time - 0.1 + HEAL_SIGN.cooldown, 0);
    a.run(0.1, { signSeq: 2 });
    expect(a.fs[0].hp).toBe(75);
  });

  it('heals yourself when no friend near is hurt, or when you are the worst off', () => {
    let a = healer([[10, 9, 100], [9 + HEAL_SIGN.range + 1, 9, 10]]);
    a.h.hp = 60;
    let ev = a.run(0.1, { signSeq: 1 });
    expect(a.h.hp).toBe(85);
    expect(ev.find((e) => e.k === 'mended')).toMatchObject({ self: true });
    a = healer([[10, 9, 70]]);
    a.h.hp = 30;
    a.run(0.1, { signSeq: 1 });
    expect(a.h.hp).toBe(55);
    expect(a.fs[0].hp).toBe(70);
  });

  it('nobody hurt, or no breath: says so and costs nothing; never a goblin', () => {
    const a = healer([[10, 9, 100]]);
    Object.assign(a.es[0], { x: 10, y: 8, hp: 10 });
    let ev = a.run(0.1, { signSeq: 1 });
    expect(ev.find((e) => e.k === 'nosign')).toMatchObject({ why: 'hurt' });
    expect(a.h.stamina).toBe(100);
    expect(a.es[0].hp).toBe(10);
    a.h.hp = 50;
    a.h.stamina = HEAL_SIGN.cost - 1;
    ev = a.run(0.1, { signSeq: 2 });
    expect(ev.find((e) => e.k === 'nosign')).toMatchObject({ why: 'breath' });
    expect(a.h.hp).toBe(50);
  });

  it('reaches someone the room may heal (Hew in the wood), and a guest’s press works', () => {
    const a = arena('mace', [[2, 2]]);
    a.room.map.npcs = [{ x: 10, y: 9, name: 'HEW', talk: 'hew', look: 'burner', hp: 20, maxHp: 100 }];
    const g = a.room.join('guest');
    Object.assign(g, { weapon: 'censer', x: 11, y: 9, safeT: 0 });
    a.run(0.1, { signSeq: 1 }, 'guest');
    expect(a.room.map.npcs[0].hp).toBe(45);
  });
});

describe('SMOKE BOMB, the Rogue’s third skill', () => {
  it('is thrown to the goblin faced and smokes there 5 s, 2.4 round', () => {
    const a = arena('daggers', [[9, 5]]);
    Object.assign(a.h, { relics: ['smoke'], relic: 'smoke', learned: undefined });
    const ev = a.run(SMOKEBOMB.windup + SMOKEBOMB.flight + 0.1, { relicSeq: 1 });
    expect(ev.some((e) => e.k === 'smokebomb')).toBe(true);
    expect(a.room.smokes).toHaveLength(1);
    expect(a.room.smokes[0]).toMatchObject({ r: SMOKEBOMB.radius });
    expect(Math.hypot(a.room.smokes[0].x - 9, a.room.smokes[0].y - 5)).toBeLessThan(0.5);
    expect(a.room.smokes[0].until - a.room.time).toBeGreaterThan(SMOKEBOMB.time - 0.3);
  });

  it('a goblin in it sees nobody but those close; an archer winding up at someone in it lets go', () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false });
    const h = room.join('me');
    Object.assign(h, { weapon: 'daggers', x: 9, y: 12, safeT: 0 });
    const g = Object.assign(newEnemy(1, 'scrapper', 9, 7), { alert: true, respawns: false, cooldown: 0 }) as Enemy;
    const arch = Object.assign(newEnemy(2, 'scrapper', 3, 12), { alert: true, respawns: false, bow: true, cooldown: 0 }) as Enemy;
    room.enemies = [g, arch];
    // The goblin stands in smoke; the hero's well clear of it.
    room.smokes = [{ x: 9, y: 7, until: 99, r: SMOKEBOMB.radius }];
    const y0 = g.y;
    room.setIntent('me', NO_INTENT);
    for (let i = 0; i < Math.round(0.6 / TICK); i++) room.step(), Object.assign(arch, { cooldown: 99 });
    expect(Math.abs(g.y - y0)).toBeLessThan(0.3);
    // The archer winds up at the hero, who then stands in smoke: the shot is dropped.
    room.smokes = [{ x: 9, y: 12, until: 99, r: SMOKEBOMB.radius }];
    begin(arch, 'shot', ARCHER.shot, h, []);
    room.step();
    expect(arch.attack).toBeNull();
    expect(h.hiddenUntil).toBeGreaterThan(room.time);
    expect(POTION.seen).toBeLessThan(SMOKEBOMB.radius);
  });
});
