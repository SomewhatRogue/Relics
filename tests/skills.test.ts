/** The skills taught after the first: each does what its trainer says, in the room, by the shared numbers. */
import { describe, expect, it } from 'vitest';
import { noSpread } from './nospread';
import { CHAIN, CLASS_KITS, FIRE_RING, HEARTSEEKER, KNIVES, LIGHT, SKILL_CHOICES, STAMP, TETHER, TICK, VANISH, VOLLEY, RELICS, type HeroClass, type RelicId } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { castElement } from '../src/sim/channel';
import { fallDmg } from '../src/sim/rogue';
import { walkSpeed } from '../src/sim/walkspeed';
import { hitEnemy } from '../src/sim/combat';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

noSpread();

const ticks = (s: number) => Math.round(s / TICK);
function run(room: ArenaRoom, s: number): FightEvent[] {
  const out: FightEvent[] = [];
  for (let i = 0; i < ticks(s); i++) room.step(), out.push(...room.events);
  return out;
}

/** A hero of `cls` carrying `skill`, a scrapper and the butcher held still in front, everyone else far off. */
function setup(cls: HeroClass, skill: RelicId, opts: { squire?: boolean } = {}) {
  const room = new ArenaRoom(1, { squire: opts.squire });
  const h = room.join('me');
  const [butcher, , , s] = room.enemies;
  const corners = [[1, 15], [17, 15], [1, 9], [17, 9], [17, 13]];
  room.enemies.forEach((e, i) => Object.assign(e, { x: corners[i % 5][0], y: corners[i % 5][1], cooldown: 99 }));
  Object.assign(h, { x: 9, y: 10, fx: 0, fy: -1, weapon: CLASS_KITS[cls][0], relics: [skill], relic: skill, noHound: cls !== 'RANGER' });
  for (const e of [butcher, s]) Object.assign(e, { cooldown: 99, act: 'stunned', actDur: 0.05, hp: 500, maxHp: 500 });
  return { room, h, s, butcher };
}
const fire = (room: ArenaRoom, o: Partial<Intent> = {}) => room.setIntent('me', { ...NO_INTENT, relicSeq: 1, ...o });

describe('three skills a class', () => {
  it('every class has three, the first its old one, each with a name and a cooldown', () => {
    for (const cls of Object.keys(SKILL_CHOICES) as HeroClass[]) {
      expect(SKILL_CHOICES[cls]).toHaveLength(3);
      for (const r of SKILL_CHOICES[cls]) expect(RELICS[r].cooldown).toBeGreaterThan(0);
    }
    expect(SKILL_CHOICES.WARRIOR.slice(0, 2)).toEqual(['bash', 'horn']);
  });

  it('SHIELD STAMP: after its windup, a ring around the Warrior knocks a small one flat and staggers the big', () => {
    const { room, h, s, butcher } = setup('WARRIOR', 'stamp');
    Object.assign(s, { x: 10.5, y: 10 });
    Object.assign(butcher, { x: 9, y: 8 });
    const far = room.enemies[4];
    Object.assign(far, { x: 9, y: 10 + STAMP.radius + 1.5, hp: 500, maxHp: 500 });
    fire(room);
    const early = run(room, STAMP.windup * 0.5);
    expect(early.some((e) => e.k === 'stamp')).toBe(false);
    const ev = run(room, STAMP.windup);
    expect(ev.some((e) => e.k === 'stamp')).toBe(true);
    expect(s.hp).toBe(500 - STAMP.dmg);
    expect(s.act).toBe('stunned');
    expect(butcher.hp).toBeLessThan(500);
    expect(far.hp).toBe(500);
    expect(Math.hypot(s.x - h.x, s.y - h.y)).toBeGreaterThan(1.5);
  });

  it('VOLLEY: nothing at first, then arrows fall on the spot for its time and hit only what stands in it', () => {
    const { room, s } = setup('RANGER', 'volley');
    Object.assign(s, { x: 9, y: 5, act: 'stunned', actDur: 99 });
    fire(room);
    run(room, VOLLEY.windup + VOLLEY.delay * 0.6);
    expect(room.zones.some((z) => z.kind === 'volley')).toBe(true);
    expect(s.hp).toBe(500);
    const ev = run(room, VOLLEY.delay + VOLLEY.time);
    const falls = ev.filter((e) => e.k === 'arrowfall').length;
    expect(falls).toBe(Math.round(VOLLEY.time / VOLLEY.every));
    expect(s.hp).toBe(500 - falls * VOLLEY.dmg);
    expect(room.zones.some((z) => z.kind === 'volley')).toBe(false);
  });

  it('HEARTSEEKER: stand and aim, then one heavy arrow at the goblin faced', () => {
    const { room, h, s: g } = setup('RANGER', 'sic');
    Object.assign(g, { x: 9, y: 5, act: 'stunned', actDur: 99, hp: 400, maxHp: 400 });
    fire(room, { ay: -1 });
    run(room, 0.05);
    const x0 = h.x, y0 = h.y;
    fire(room, { ay: -1, my: -1 });
    run(room, HEARTSEEKER.windup * 0.7);
    expect([h.x, h.y]).toEqual([x0, y0]);
    expect(g.hp).toBe(400);
    run(room, HEARTSEEKER.windup * 0.3 + 0.5);
    expect(400 - g.hp).toBeGreaterThanOrEqual(HEARTSEEKER.dmg * 0.9);
  });

  it('VANISH: goblins lose you (even close) and drop a blow wound up at you, until it clears or you strike', () => {
    const { room, h, butcher } = setup('ROGUE', 'vanish');
    Object.assign(butcher, { x: 9, y: 8.6, act: 'chase', actDur: 0, cooldown: 0 });
    run(room, 0.5);
    expect(butcher.attack?.aimed).toBe('me');
    fire(room);
    run(room, 0.15);
    expect(h.vanishUntil).toBeGreaterThan(room.time);
    expect(butcher.attack).toBeNull();
    expect(room.smokes.length).toBe(1);
    run(room, VANISH.time - 0.5);
    expect(h.hp).toBe(h.maxHp);
    // A strike shows you again.
    room.setIntent('me', { ...NO_INTENT, relicSeq: 1, attackSeq: 1, ay: -1 });
    run(room, 0.6);
    expect(h.vanishUntil ?? -9).toBeLessThan(room.time);
  });

  it('VANISH: you move faster while vanished, and your first blow out of it is an ambush', () => {
    const { room, h, s } = setup('ROGUE', 'vanish');
    const walk = (vanished: boolean) => walkSpeed(Object.assign(h, { vanishUntil: vanished ? room.time + 9 : -9 }), { ...NO_INTENT, mx: 1 }, room.time);
    expect(walk(true) / walk(false)).toBeCloseTo(VANISH.pace);
    Object.assign(s, { x: 9, y: 9, fx: 0, fy: -1, act: 'idle', alert: true, hp: 500 });
    h.vanishUntil = room.time + 9;
    const ev: FightEvent[] = [];
    hitEnemy(h, { windup: 0, active: 0.1, recover: 0, dmg: 10, range: 1.5, arc: 90, lunge: 0, knock: 0 }, s, room.time, ev);
    expect(ev.some((x) => x.k === 'hit' && x.ambush)).toBe(true);
  });

  it('SMOKE: goblins in a smoke bomb see no one, even close, and stumble; a big one swings blind, not at you', () => {
    const { room, h, butcher, s } = setup('ROGUE', 'smoke');
    room.smokes.push({ x: 9, y: 9, until: room.time + 5, r: 2.4 });
    Object.assign(s, { x: 9.4, y: 9, act: 'idle', actDur: 0, cooldown: 0 });
    Object.assign(butcher, { x: 8.6, y: 9, act: 'idle', actDur: 0, cooldown: 0 });
    Object.assign(h, { x: 9, y: 9.9 });
    const sx = s.x;
    run(room, 0.3);
    expect(s.attack?.aimed ?? '').toBe('');
    expect(s.x).not.toBeCloseTo(sx, 2);
    expect(butcher.attack?.kind).toBe('cleave');
    expect(butcher.attack?.aimed).toBe('');
  });

  it('KNIFE FAN: a shotgun, point blank a big goblin takes several knives at full', () => {
    const { room, butcher } = setup('ROGUE', 'knives');
    Object.assign(butcher, { x: 9, y: 8.9, act: 'stunned', actDur: 99, hp: 500 });
    fire(room, { ay: -1 });
    run(room, KNIVES.windup + 0.6);
    expect(500 - butcher.hp).toBeGreaterThanOrEqual(KNIVES.dmg * 3);
  });

  it('KNIFE FAN: a knife at its far end does less than one up close', () => {
    expect(fallDmg({ fall: { at: KNIVES.full, near: KNIVES.dmg, far: KNIVES.far }, travelled: 1, range: KNIVES.range, dmg: KNIVES.dmg })).toBe(KNIVES.dmg);
    expect(fallDmg({ fall: { at: KNIVES.full, near: KNIVES.dmg, far: KNIVES.far }, travelled: KNIVES.range, range: KNIVES.range, dmg: KNIVES.dmg })).toBe(KNIVES.far);
  });

  it('KNIFE FAN: the knives fan out, hitting goblins off to either side', () => {
    const { room, s, butcher } = setup('ROGUE', 'knives');
    const side = 3.5 * Math.sin(KNIVES.spread), up = 10 - 3.5 * Math.cos(KNIVES.spread);
    Object.assign(s, { x: 9 - side, y: up, act: 'stunned', actDur: 99 });
    Object.assign(butcher, { x: 9 + side, y: up, act: 'stunned', actDur: 99 });
    fire(room, { ay: -1 });
    run(room, KNIVES.windup + 0.05);
    expect(room.bolts.filter((b) => b.kind === 'knife')).toHaveLength(KNIVES.count);
    run(room, 1);
    expect(s.hp).toBeLessThan(500);
    expect(butcher.hp).toBeLessThan(500);
  });

  it('FIRE RING: burns and throws off what is close, then lights what walks in; the element is the ELEMENT button\'s, whatever the skill', () => {
    const { room, h, s } = setup('MAGE', 'firering');
    h.augments.channel = 'frost';
    expect(castElement(h)).toBe('frost');
    Object.assign(s, { x: 10.2, y: 10, act: 'stunned', actDur: 99 });
    fire(room);
    run(room, FIRE_RING.windup + 0.05);
    expect(s.hp).toBeLessThanOrEqual(500 - FIRE_RING.dmg);
    expect(s.burnUntil).toBeGreaterThan(room.time);
    const late = room.enemies[4];
    Object.assign(late, { x: 9.5, y: 10, cooldown: 99, act: 'stunned', actDur: 99, burnUntil: 0 });
    run(room, FIRE_RING.every + 0.1);
    expect(late.burnUntil).toBeGreaterThan(room.time);
    run(room, FIRE_RING.linger);
    expect(room.zones.some((z) => z.kind === 'fire')).toBe(false);
  });

  it('STORM TETHER: strikes the goblin faced again and again, and jumps to a wet one beside it; snaps when far', () => {
    const { room, h, s, butcher } = setup('MAGE', 'tether');
    // (Out in the rain, so the one beside it is wet: storm jumps only between wet goblins.)
    room.map = { ...room.map, theme: { ...room.map.theme, rain: 0.5 } };
    Object.assign(s, { x: 9, y: 5, act: 'stunned', actDur: 99 });
    Object.assign(butcher, { x: 10.5, y: 5, act: 'stunned', actDur: 99 });
    fire(room, { ay: -1 });
    run(room, TETHER.windup + 1.6);
    expect(h.tether?.id).toBe(s.id);
    expect(500 - s.hp).toBeGreaterThanOrEqual(TETHER.dmg * 3);
    expect(butcher.hp).toBeLessThan(500);
    Object.assign(h, { x: 9, y: 5 + TETHER.snap + 1 });
    run(room, 0.1);
    expect(h.tether).toBeUndefined();
  });

  it('CENSER CHAIN: hauls a hurt friend to your side, blessed; with none near, drags in a small goblin', () => {
    const { room, h } = setup('HEALER', 'chain', { squire: true });
    const q = room.heroes.find((x) => x.id === 'squire')!;
    Object.assign(q, { x: 9, y: 4, hp: q.maxHp / 2 });
    fire(room);
    run(room, CHAIN.windup + 0.6);
    expect(Math.hypot(q.x - h.x, q.y - h.y)).toBeLessThan(1.2);
    expect(q.blessedUntil).toBeGreaterThan(room.time);

    const solo = setup('HEALER', 'chain');
    Object.assign(solo.s, { x: 9, y: 5, act: 'chase', actDur: 0 });
    fire(solo.room);
    run(solo.room, CHAIN.windup + 0.6);
    expect(Math.hypot(solo.s.x - solo.h.x, solo.s.y - solo.h.y)).toBeLessThan(1.3);
    expect(solo.s.act).toBe('stunned');
  });

  it('LANTERN LIGHT: scorches and blinds goblins in reach, mends friends in it, more with coals', () => {
    const lit = (glow: number) => {
      const { room, h, s } = setup('HEALER', 'light');
      Object.assign(h, { glow, cold: false, hp: h.maxHp - 40 });
      Object.assign(s, { x: 9, y: 10 - LIGHT.radius + 0.4, act: 'chase', actDur: 0 });
      fire(room);
      run(room, LIGHT.windup + 0.05);
      return { dealt: 500 - s.hp, mended: h.hp - (h.maxHp - 40), s };
    };
    const none = lit(0), full = lit(10);
    expect(none.dealt).toBe(LIGHT.dmg);
    expect(none.s.act).toBe('stunned');
    expect(none.mended).toBeGreaterThan(0);
    expect(full.dealt).toBeGreaterThan(none.dealt);
    expect(full.mended).toBeGreaterThan(none.mended);
  });

  it('the same press gives the same fight (seeded)', () => {
    const play = () => {
      const { room, s } = setup('RANGER', 'volley');
      Object.assign(s, { x: 9, y: 6, act: 'chase', cooldown: 1 });
      fire(room);
      run(room, 4);
      return JSON.stringify([s.x, s.y, s.hp]);
    };
    expect(play()).toBe(play());
  });
});
