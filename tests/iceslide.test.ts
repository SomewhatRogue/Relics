/** Frozen goblins as a set-up for heavy hits (Kyle, 2026-11-05): a longer freeze for small ones, heavy hits
 *  sending them skidding, the crash, nothing for friends, the stun cap, and the same every time. */
import { describe, expect, it } from 'vitest';
import { FLING, FROST, HERO, STUN_CAP, TICK, WEAPONS, type Swing } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { hitEnemy } from '../src/sim/combat';
import { blast, smite } from '../src/sim/bolts';
import { afflict, type World } from '../src/sim/elements';
import { stepCarry } from '../src/sim/grab';
import { bladeStruck } from '../src/sim/spellblade';
import { fling } from '../src/sim/iceslide';
import { NO_INTENT, type Enemy, type FightEvent, type Hero } from '../src/sim/types';

/** The training yard, empty but for us: no goblins, no props. */
function yard(seed = 1) {
  const room = new ArenaRoom(seed, { scrappers: false, props: false });
  const me = room.join('me');
  room.enemies = [];
  room.props = [];
  Object.assign(me, { x: 9, y: 12, fx: 0, fy: -1 });
  return { room, me };
}
const world = (room: ArenaRoom): World => ({ heroes: room.heroes, enemies: room.enemies, javelins: room.javelins, props: room.props, survivors: room.survivors, now: room.time, ev: room.events });
function goblin(room: ArenaRoom, id: number, x: number, y: number, kind: Enemy['kind'] = 'scrapper'): Enemy {
  const e = Object.assign(newEnemy(id, kind, x, y), { hp: 400, maxHp: 400, cooldown: 99, alert: true, respawns: false });
  room.enemies.push(e);
  return e;
}
const freeze = (room: ArenaRoom, e: Enemy) => (e.frozenUntil = room.time + 3);
/** Step the room `s` seconds, the heroes standing still; the events. */
function run(room: ArenaRoom, s: number): FightEvent[] {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events);
  return out;
}
/** `h` lands `s` (its kit's) on `e`, standing just below it. */
function blow(room: ArenaRoom, h: Hero, weapon: Hero['weapon'], s: Swing, e: Enemy, charged = false): number {
  Object.assign(h, { weapon, heavy: charged, power: charged ? 1 : 0, counter: false, hitIds: [], x: e.x, y: e.y + Math.min(1, s.range - 0.1), fx: 0, fy: -1 });
  return hitEnemy(h, s, e, room.time, room.events);
}

describe('a longer freeze for the small', () => {
  it('a small goblin stays frozen 1.8 times as long; a butcher as before', () => {
    const { room } = yard();
    const small = goblin(room, 1, 5, 8), big = goblin(room, 2, 12, 8, 'butcher'), w = world(room);
    for (const e of [small, big]) afflict(w, e, 'frost', 0), afflict(w, e, 'frost', 0);
    expect(small.frozenUntil - room.time).toBeCloseTo(FROST.freeze * FROST.small, 5);
    expect(FROST.freeze * FROST.small).toBeCloseTo(3.96, 5);
    expect(big.frozenUntil - room.time).toBeCloseTo(FROST.freeze, 5);
  });
});

describe('heavy hits send a frozen small goblin skidding', () => {
  const kinds: [string, Hero['weapon'], (w: Hero['weapon']) => Swing, boolean][] = [
    ['a greatsword blow', 'greatsword', (k) => WEAPONS[k].combo[0], false],
    ['a mace blow', 'mace', (k) => WEAPONS[k].combo[0], false],
    ["the staff's tap", 'staff', (k) => WEAPONS[k].combo[0], false],
    ['a charged sword bash', 'sword', (k) => WEAPONS[k].heavy, true],
    ["a charged spear lunge", 'spear', (k) => WEAPONS[k].heavy, true],
    ["the flail's heavy", 'flail', (k) => WEAPONS[k].heavy, true],
  ];
  for (const [name, kit, swing, charged] of kinds)
    it(`${name}: skids away from the hitter${charged ? ', faster for a charged blow' : ''}`, () => {
      const { room, me } = yard();
      const e = goblin(room, 1, 9, 7);
      freeze(room, e);
      expect(blow(room, me, kit, swing(kit), e, charged)).toBeGreaterThan(0);
      expect(e.sled).toBeTruthy();
      expect(e.sled!.vy).toBeLessThan(0);
      expect(Math.hypot(e.sled!.vx, e.sled!.vy)).toBeCloseTo(charged ? FLING.hardSpeed : FLING.speed, 5);
      expect(room.events.some((v) => v.k === 'fling')).toBe(true);
    });

  it("the staff's tap keeps it frozen: its fire doesn't turn to steam on the way", () => {
    const { room, me } = yard();
    const e = goblin(room, 1, 9, 7), s = WEAPONS.staff.combo[0];
    freeze(room, e);
    me.augments.channel = 'fire';
    const n = blow(room, me, 'staff', s, e);
    bladeStruck(me, s, e, n, world(room));
    expect(e.sled).toBeTruthy();
    expect(e.frozenUntil).toBeGreaterThan(room.time);
    expect(room.events.some((v) => v.k === 'steam')).toBe(false);
  });

  it("a mace's smite sends it skidding off from where it fell, and doesn't stun it", () => {
    const { room, me } = yard();
    const e = goblin(room, 1, 9, 7);
    freeze(room, e);
    Object.assign(me, { weapon: 'mace', x: 9, y: 10 });
    const b = smite(me, WEAPONS.mace.heavy, 3);
    blast(world(room), b, 9, 7.6);
    expect(e.sled).toBeTruthy();
    expect(e.sled!.vy).toBeLessThan(0);
    expect(Math.hypot(e.sled!.vx, e.sled!.vy)).toBeCloseTo(FLING.hardSpeed, 5);
    expect(e.act).not.toBe('stunned');
  });

  it("a Warrior's throw of a frozen goblin sends it skidding", () => {
    const { room, me } = yard();
    const e = goblin(room, 1, 9, 12);
    freeze(room, e);
    Object.assign(e, { act: 'carried' });
    Object.assign(me, { weapon: 'sword', act: 'carry', actT: 0.5, carrying: e.id, grabQueuedAt: room.time, attackQueuedAt: -9, fx: 1, fy: 0 });
    stepCarry(me, NO_INTENT, room.enemies, room.time, TICK, room.events, () => undefined);
    expect(e.sled).toBeTruthy();
    expect(e.sled!.vx).toBeCloseTo(FLING.hardSpeed, 5);
    expect(e.kvx).toBe(0);
  });

  it('quick blows from light kits only chip it; a big one still shatters where it stands', () => {
    for (const kit of ['daggers', 'rapier', 'sword'] as const) {
      const { room, me } = yard();
      const e = goblin(room, 1, 9, 7);
      freeze(room, e);
      expect(blow(room, me, kit, WEAPONS[kit].combo[0], e)).toBeGreaterThan(0);
      expect(e.sled ?? null).toBeNull();
      expect(e.frozenUntil).toBeGreaterThan(room.time);
    }
    const { room, me } = yard();
    const b = goblin(room, 1, 9, 7, 'butcher');
    freeze(room, b);
    blow(room, me, 'greatsword', WEAPONS.greatsword.combo[0], b);
    expect(b.sled ?? null).toBeNull();
    expect(b.frozenUntil).toBe(0);
  });
});

describe('the crash', () => {
  it('stops on a wall and shatters there, short of its run', () => {
    const { room, me } = yard();
    const e = goblin(room, 1, 9, 2.6);
    freeze(room, e);
    blow(room, me, 'greatsword', WEAPONS.greatsword.combo[0], e);
    const ev = run(room, 1.5);
    expect(e.act).toBe('dead');
    expect(e.death).toBe('shatter');
    const c = ev.find((v) => v.k === 'icecrash');
    expect(c).toMatchObject({ big: true, r: FLING.r });
    expect(ev.some((v) => v.k === 'shatter')).toBe(true);
    expect(2.6 - (c as { y: number }).y).toBeLessThan(FLING.len - 1);
  });

  it('ploughs into a goblin: knocks it down, hurts it most, hurts and chills the ones beside', () => {
    const { room, me } = yard();
    const e = goblin(room, 1, 9, 9), hit = goblin(room, 2, 9, 6), side = goblin(room, 3, 10.1, 5.8);
    freeze(room, e);
    blow(room, me, 'greatsword', WEAPONS.greatsword.combo[0], e);
    const ev = run(room, 0.6);
    expect(e.death).toBe('shatter');
    expect(ev.find((v) => v.k === 'icecrash')).toMatchObject({ big: true });
    expect(hit.act).toBe('stunned');
    expect(400 - hit.hp).toBeGreaterThanOrEqual(FLING.plough * 0.5);
    expect(400 - side.hp).toBeGreaterThan(0);
    expect(400 - hit.hp).toBeGreaterThan(400 - side.hp);
    expect(side.chillUntil).toBeGreaterThan(room.time);
    expect(hit.chillUntil).toBeGreaterThan(room.time);
  });

  it('a friend in the way stops it, and no hero or freed one takes a scratch', () => {
    const { room, me } = yard();
    const you = room.join('you');
    Object.assign(you, { x: 9, y: 6, fx: 0, fy: 1 });
    const e = goblin(room, 1, 9, 9);
    freeze(room, e);
    blow(room, me, 'greatsword', WEAPONS.greatsword.combo[0], e);
    const hp = { me: me.hp, you: you.hp };
    const ev = run(room, 0.8);
    const c = ev.find((v) => v.k === 'icecrash') as { y: number } | undefined;
    expect(c).toBeTruthy();
    expect(c!.y).toBeGreaterThan(6);
    expect(c!.y - 6).toBeLessThan(HERO.radius + e.radius + 0.4);
    expect(me.hp).toBe(hp.me);
    expect(you.hp).toBe(hp.you);
    expect(ev.some((v) => v.k === 'hit' && v.on === 'hero')).toBe(false);
  });

  it('slid its whole length without meeting anything, it shatters at the end for less', () => {
    for (const hard of [false, true]) {
      const { room } = yard();
      Object.assign(room.heroes[0], { x: 1, y: 14 });
      const e = goblin(room, 1, 2, 10), side = goblin(room, 2, 2 + (hard ? FLING.hardLen : FLING.len) - 0.2, 10.75);
      // (Held where it stands, or it'd walk off toward us.)
      Object.assign(side, { act: 'stunned', actDur: 99 });
      freeze(room, e);
      fling(e, 'me', 1, 0, hard, room.time, room.events);
      const ev = run(room, 2);
      const c = ev.find((v) => v.k === 'icecrash') as { x: number; big: boolean; r: number } | undefined;
      expect(e.death).toBe('shatter');
      expect(c).toMatchObject({ big: false, r: FLING.endR });
      expect(c!.x - 2).toBeCloseTo(hard ? FLING.hardLen : FLING.len, 0);
      expect(400 - side.hp, JSON.stringify([hard, ev.filter((v) => v.k === 'hit')])).toBe(FLING.endDmg);
    }
  });

  it("the stun cap holds: the same hero's second crash into a goblin within the cap hurts it but doesn't knock it down; a friend's does", () => {
    const { room, me } = yard();
    const you = room.join('you');
    Object.assign(you, { x: 15, y: 14 });
    const hit = goblin(room, 9, 9, 4);
    const send = (id: number, by: Hero) => {
      Object.assign(hit, { x: 9, y: 4, act: 'chase', actT: 0, kvx: 0, kvy: 0, cooldown: 99 });
      const e = goblin(room, id, 9, 7);
      freeze(room, e);
      blow(room, by, 'greatsword', WEAPONS.greatsword.combo[0], e);
      run(room, 0.6);
      expect(e.death).toBe('shatter');
    };
    send(1, me);
    expect(hit.act).toBe('stunned');
    run(room, 1.5);
    const hp = hit.hp;
    send(2, me);
    expect(hit.hp).toBeLessThan(hp);
    expect(hit.act).not.toBe('stunned');
    expect(room.time).toBeLessThan(STUN_CAP.every);
    send(3, you);
    expect(hit.act).toBe('stunned');
  });
});

describe('the room decides it', () => {
  it('the same blows give the same slide and crash, tick for tick (what a guest is sent)', () => {
    const play = () => {
      const { room, me } = yard(7);
      const e = goblin(room, 1, 8.6, 9), a = goblin(room, 2, 9, 5.5), b = goblin(room, 3, 10, 5);
      freeze(room, e);
      blow(room, me, 'mace', WEAPONS.mace.combo[2], e);
      const trace: string[] = [];
      for (let i = 0; i < 60; i++) room.step(), trace.push(JSON.stringify([e.x, e.y, e.sled ?? null, a.hp, a.act, b.hp, room.events.map((v) => v.k)]));
      return trace;
    };
    const one = play(), two = play();
    expect(one).toEqual(two);
    expect(one.some((t) => t.includes('icecrash'))).toBe(true);
  });
});
