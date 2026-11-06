/** Found relics in the room: charge spent per use, a dark one refused, each new kind doing its job, and none of them ever touching a friend. */
import { describe, expect, it } from 'vitest';
import { BELL, BOMB, KNUCKLE, MARK, SENTRY, TICK, type RelicId } from '../src/shared/tuning';
import { Rng } from '../src/shared/rng';
import { makeRelic, relicMax } from '../src/shared/relicitems';
import { ArenaRoom } from '../src/sim/room';
import { damage } from '../src/sim/damage';
import { newProp } from '../src/sim/props';
import { NO_INTENT, type FightEvent, type Hero, type Intent } from '../src/sim/types';

const run = (room: ArenaRoom, s: number): FightEvent[] => {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events);
  return out;
};

/** A Warrior at (9, 10) facing up, carrying a full relic of `kind`; one scrapper and a friend placed by the test; the rest far off and idle. */
function setup(kind: RelicId, el: '' | 'fire' = '') {
  const room = new ArenaRoom(1);
  room.props = [];
  const h = room.join('me'), ally = room.join('ally');
  const it = makeRelic(new Rng(3), kind, el);
  Object.assign(h, { x: 9, y: 10, fx: 0, fy: -1, relics: ['bash', kind], relic: kind, found: [it], relicItem: it.id });
  h.augments[kind] = el;
  Object.assign(ally, { x: 16, y: 14 });
  const corners = [[1, 15], [17, 15], [1, 9], [17, 9], [17, 13]];
  room.enemies.forEach((e, i) => Object.assign(e, { x: corners[i % 5][0], y: corners[i % 5][1], cooldown: 99, alert: false }));
  const s = room.enemies.find((e) => e.kind === 'scrapper')!;
  Object.assign(s, { hp: 200, maxHp: 200, respawns: false });
  return { room, h, ally, s, it };
}
const press = (room: ArenaRoom, n = 1, o: Partial<Intent> = {}) => room.setIntent('me', { ...NO_INTENT, relicSeq: n, ...o });
/** A friend untouched: full health, not shoved, no blow landed on them. */
const untouched = (ally: Hero, ev: FightEvent[]) => {
  expect(ally.hp).toBe(ally.maxHp);
  expect(Math.hypot(ally.kvx, ally.kvy)).toBeLessThan(0.01);
  expect(ev.some((e) => e.k === 'hit' && e.on === 'hero')).toBe(false);
};

describe('charge', () => {
  it('every use spends one charge; at nothing the RELIC button refuses and says DARK', () => {
    const { room, h, it } = setup('javelin');
    expect(it.charge).toBe(relicMax(it));
    press(room, 1);
    run(room, 0.5);
    expect(it.charge).toBe(relicMax(it) - 1);
    it.charge = 0;
    h.relicReady.javelin = 0;
    press(room, 2);
    const ev = run(room, 0.5);
    expect(it.charge).toBe(0);
    expect(room.javelins.length).toBe(1);
    expect(ev.some((e) => e.k === 'dark')).toBe(true);
  });

  it('the class skill spends nothing', () => {
    const { room, h, it } = setup('javelin');
    h.relic = 'bash';
    h.learned = undefined;
    press(room, 1);
    run(room, 0.6);
    expect(it.charge).toBe(relicMax(it));
  });
});

describe('the new relics act on goblins and the room, and spare friends', () => {
  it('a gall bomb throws goblins and barrels about; a friend in it is spared', () => {
    const { room, h, ally, s } = setup('bomb');
    Object.assign(s, { x: 9, y: 6 });
    Object.assign(ally, { x: 10, y: 6 });
    room.props = [newProp('barrel', 8.2, 6.3)];
    press(room, 1, { ax: 0, ay: -4 });
    const ev = run(room, BOMB.windup + BOMB.flight + 0.2);
    expect(s.hp).toBeLessThan(200);
    expect(ev.some((e) => e.k === 'spared')).toBe(true);
    const barrel = room.props.find((p) => p.kind === 'barrel')!;
    expect(barrel.broken || Math.hypot(barrel.x - 8.2, barrel.y - 6.3) > 0.2).toBe(true);
    untouched(ally, ev);
    expect(h.hp).toBe(h.maxHp);
  });

  it('the bone bell sets goblins flinching and quickens friends', () => {
    const { room, h, ally, s } = setup('bell');
    Object.assign(s, { x: 9, y: 8 });
    Object.assign(ally, { x: 10.5, y: 10 });
    press(room, 1);
    const ev = run(room, BELL.windup + 0.1);
    expect(s.act).toBe('flinch');
    expect(Math.hypot(s.kvx, s.kvy) > 0 || s.y < 8).toBe(true);
    expect(ally.quickUntil).toBeGreaterThan(room.time);
    expect(h.quickUntil).toBeGreaterThan(room.time);
    untouched(ally, ev);
  });

  it("the butcher's knuckle throws a line back and marks it: the next blow lands half as hard again", () => {
    const { room, ally, s } = setup('knuckle');
    Object.assign(s, { x: 9, y: 7.5 });
    Object.assign(ally, { x: 9.2, y: 8.8 });
    press(room, 1);
    const ev = run(room, KNUCKLE.windup + 0.05);
    expect(s.kvy).toBeLessThan(0);
    expect(s.markUntil).toBeGreaterThan(room.time);
    expect(ev.some((e) => e.k === 'spared')).toBe(true);
    untouched(ally, ev);
    const before = s.hp;
    damage(s, 10, room.time, []);
    expect(before - s.hp).toBe(Math.round(10 * MARK.mult));
    // Spent: the one after is plain.
    const mid = s.hp;
    damage(s, 10, room.time, []);
    expect(mid - s.hp).toBe(10);
  });

  it('the wind-up bow shoots what comes near and hobbles it, through a friend standing in the way', () => {
    const { room, ally, s } = setup('sentry');
    Object.assign(s, { x: 9, y: 5.5, act: 'stunned', actDur: 99 });
    Object.assign(ally, { x: 9, y: 7.5 });
    press(room, 1);
    const ev = run(room, SENTRY.windup + 2);
    expect(room.zones.some((z) => z.kind === 'sentry')).toBe(true);
    expect(s.hp).toBeLessThan(200);
    expect(s.hobbleUntil).toBeGreaterThan(room.time);
    untouched(ally, ev);
    run(room, SENTRY.time);
    expect(room.zones.some((z) => z.kind === 'sentry')).toBe(false);
  });

  it('the hook yanks a crate back at you', () => {
    const { room } = setup('hook');
    const crate = newProp('crate', 9, 7);
    room.props = [crate];
    press(room, 1, { ax: 0, ay: -1 });
    const ev = run(room, 0.35);
    expect(ev.some((e) => e.k === 'hookprop')).toBe(true);
    expect(crate.y).toBeGreaterThan(7);
  });

  it("a lodestone's burst spares a friend in it now (it used to hurt them)", () => {
    const { room, ally, s } = setup('lodestone');
    Object.assign(s, { x: 9, y: 6 });
    Object.assign(ally, { x: 9.6, y: 6.2 });
    press(room, 1, { ax: 0, ay: -4 });
    const ev = run(room, 3);
    expect(s.hp).toBeLessThan(200);
    untouched(ally, ev);
  });

  it('an elemental relic carries its element: a fire bomb sets them burning', () => {
    const { room, s } = setup('bomb', 'fire');
    Object.assign(s, { x: 9, y: 6 });
    press(room, 1, { ax: 0, ay: -4 });
    run(room, BOMB.windup + BOMB.flight + 0.1);
    expect(s.burnUntil).toBeGreaterThan(room.time);
  });
});
