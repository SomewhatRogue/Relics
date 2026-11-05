/**
 * Storm and fire reworked (Kyle, 2026-11-04): fire passes on only when a burning goblin dies; storm
 * ignores shields, jumps only between wet goblins (in water, or out in the rain), lands harder on them;
 * the wand's storm tap is a stream that builds and slows you, its hold a lightning bolt from the hand.
 */
import { describe, expect, it } from 'vitest';
import { ARENA, type GameMap } from '../src/shared/arena';
import { BURN, STORM, STREAM, TICK } from '../src/shared/tuning';
import { damage } from '../src/sim/damage';
import { burning, stepElements, type World } from '../src/sim/elements';
import { newEnemy } from '../src/sim/enemies';
import { wet } from '../src/sim/wet';
import type { FightEvent } from '../src/sim/types';
import { lost, mageArena } from './magearena';

/** The arena with a pool over (8.5..12, 2..8). */
const POOL: GameMap = { ...ARENA, water: [{ x: 8.5, y: 2, w: 3.5, h: 6 }] };
/** The arena under rain. */
const RAIN: GameMap = { ...ARENA, theme: { ...ARENA.theme, rain: 0.4 } };

describe('fire passes on only when a burning goblin dies', () => {
  it('touching, a burning goblin sets nothing alight while it lives; dying, it sets those near it alight', () => {
    const a = Object.assign(newEnemy(1, 'scrapper', 5, 5), { hp: 999, maxHp: 999 }), b = newEnemy(2, 'scrapper', 5 + a.radius * 2 + BURN.spread - 0.05, 5);
    const far = newEnemy(3, 'scrapper', 5, 5 + a.radius * 2 + BURN.spread + 0.4);
    const ev: FightEvent[] = [], w: World = { heroes: [], enemies: [a, b, far], javelins: [], props: [], now: 0, ev };
    Object.assign(a, { burnUntil: BURN.time, burnNext: 0.01 });
    for (let t = 0; t < 1; t += TICK) (w.now = t), stepElements(w);
    expect(burning(b, w.now)).toBe(false);
    a.hitAt = w.now;
    expect(damage(a, 9999, w.now, ev)).toBe(true);
    w.now += TICK;
    stepElements(w);
    expect(burning(b, w.now)).toBe(true);
    expect(burning(far, w.now)).toBe(false);
  });

  it('a fire spell still sets alight what it hits', () => {
    const a = mageArena('wand', [[9, 5], [9.4, 4.4]], 'fire');
    a.loose(0.9, 0.6);
    expect(a.es.every((e) => burning(e, a.room.time))).toBe(true);
  });
});

describe('storm ignores shields', () => {
  /** A shield-bearer facing the Mage takes a spellblade's cut in `el`. */
  const cut = (el: 'frost' | 'storm') => {
    const a = mageArena('spellblade', [[9, 7.9]], el);
    a.e.variant = 'shield';
    const ev = a.tap(0.5);
    return { n: lost(a.e), boarded: ev.some((x) => x.k === 'hit' && !!x.boarded) };
  };

  it("a storm cut isn't stopped by the board from the front; a frost cut is", () => {
    const storm = cut('storm'), frost = cut('frost');
    expect(frost.boarded).toBe(true);
    expect(storm.boarded).toBe(false);
    expect(storm.n).toBeGreaterThan(frost.n);
  });

  it('the lightning bolt hits a shield wall from the front as hard as anything', () => {
    const plain = mageArena('wand', [[9, 6]], 'storm');
    plain.loose(0.9, 0.12);
    const wall = mageArena('wand', [[9, 6], [10, 6]], 'storm');
    wall.es.forEach((e) => (e.variant = 'shield'));
    wall.loose(0.9, 0.12);
    expect(lost(wall.e)).toBeGreaterThanOrEqual(lost(plain.e));
  });
});

describe('storm jumps only between wet goblins', () => {
  // The bolt's target, a wet one 1.6 off, a wet one beyond STORM.reach, and one 1.6 off on dry ground.
  const spots: [number, number][] = [[9, 6], [10.6, 6], [9, 6 - STORM.reach - 0.8], [7.4, 6]];
  const bolt = (map?: GameMap) => {
    const a = mageArena('wand', spots, 'storm', false, 'scrapper', map);
    a.loose(0.9, 0.12);
    return a.es.map(lost);
  };

  it('wet is in the water, or anywhere in the rain', () => {
    expect(wet({ x: 9, y: 6 }, POOL)).toBe(true);
    expect(wet({ x: 7.4, y: 6 }, POOL)).toBe(false);
    expect(wet({ x: 7.4, y: 6 }, RAIN)).toBe(true);
    expect(wet({ x: 9, y: 6 }, ARENA)).toBe(false);
  });

  it('dry, it jumps nowhere', () => {
    const [hit, ...rest] = bolt();
    expect(hit).toBeGreaterThan(0);
    expect(rest).toEqual([0, 0, 0]);
  });

  it('in water, it lands 1.5x and jumps to every wet goblin within reach, never the dry one', () => {
    const dry = bolt()[0], [hit, near, far, onDry] = bolt(POOL);
    expect(hit).toBe(Math.round(dry * STORM.wet));
    expect(near).toBeGreaterThan(0);
    expect(far).toBe(0);
    expect(onDry).toBe(0);
  });

  it('in the rain, everything is wet', () => {
    const [hit, near, far, onDry] = bolt(RAIN);
    expect(hit).toBeGreaterThan(0);
    expect(near).toBeGreaterThan(0);
    expect(onDry).toBeGreaterThan(0);
    expect(far).toBe(0);
  });

  it('a wet goblin is jumped to once a cast', () => {
    const a = mageArena('wand', [[9, 7], [9, 6], [9, 5]], 'storm', false, 'scrapper', POOL);
    const ev = a.loose(0.62, 0.12);
    const jumps = ev.filter((x) => x.k === 'shock').length;
    // Three struck on the line, two jumps from the first (the others are reached already).
    expect(jumps).toBe(3 + 2);
  });
});

describe("the wand's storm stream", () => {
  it('builds the longer it stays on one goblin, and starts again on the next when that one dies', () => {
    const a = mageArena('wand', [[9, 6], [9.6, 5]], 'storm');
    a.h.primed = false;
    const rate = (secs: number) => {
      const was = lost(a.e);
      for (let t = 0; t < secs; t += 0.1) a.tap(0.1);
      return (lost(a.e) - was) / secs;
    };
    const early = rate(0.5);
    rate(STREAM.build);
    const late = rate(0.5);
    expect(late / early).toBeGreaterThan(1.8);
    a.e.hp = 1;
    a.tap(0.3);
    expect(a.e.act).toBe('dead');
    expect(a.h.stream?.id).toBe(a.es[1].id);
    expect(a.room.time - a.h.stream!.at).toBeLessThan(0.4);
  });

  it('goes off without taps, and walks you at STREAM.pace while on', () => {
    const walked = (tapping: boolean) => {
      const a = mageArena('wand', [[9, 4]], 'storm');
      tapping ? a.tap(0.2) : a.run(0.2);
      const x = a.h.x;
      for (let t = 0; t < 1; t += 0.1) tapping ? a.tap(0.1, { mx: 1 }) : a.run(0.1, { mx: 1 });
      return a.h.x - x;
    };
    const on = walked(true), off = walked(false);
    expect(on / off).toBeLessThan(STREAM.pace + 0.15);
    const a = mageArena('wand', [[9, 6]], 'storm');
    a.tap(0.2);
    expect(a.h.stream).toBeDefined();
    // (The same press held on, so no new tap.)
    a.run(STREAM.keep + 0.1, { attackSeq: 1 });
    expect(a.h.stream).toBeUndefined();
  });

  it('at full build it outdoes the other wand taps a little, not by a mile', () => {
    const dps = (el: 'fire' | 'frost') => {
      const a = mageArena('wand', [[9, 5.5]], el);
      a.h.primed = false;
      for (let t = 0; t < 6; t += 0.1) a.tap(0.1);
      return lost(a.e) / 6;
    };
    const a = mageArena('wand', [[9, 5.5]], 'storm');
    a.h.primed = false;
    for (let t = 0; t < STREAM.build; t += 0.1) a.tap(0.1);
    const was = lost(a.e);
    for (let t = 0; t < 4; t += 0.1) a.tap(0.1);
    const full = (lost(a.e) - was) / 4, others = (dps('fire') + dps('frost')) / 2;
    expect(full / others).toBeGreaterThan(1.1);
    expect(full / others).toBeLessThan(1.4);
  });
});

describe("the wand's storm hold: a lightning bolt", () => {
  it('hits the first goblin only; on the flash it runs through the whole line', () => {
    const line: [number, number][] = [[9, 7], [9, 6], [9, 5], [9, 4]];
    const plain = mageArena('wand', line, 'storm');
    plain.loose(0.9, 0.12);
    expect(plain.es.map((e) => lost(e) > 0)).toEqual([true, false, false, false]);
    const perfect = mageArena('wand', line, 'storm');
    const ev = perfect.loose(0.62, 0.12);
    expect(ev.find((x) => x.k === 'spell')).toMatchObject({ what: 'thunderbolt', big: true });
    expect(perfect.es.every((e) => lost(e) > 0)).toBe(true);
  });
});
