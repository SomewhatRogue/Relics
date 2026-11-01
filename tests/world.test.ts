import { beforeEach, describe, expect, it } from 'vitest';
import { clean, memoryWorldStore } from '../api/_world';
import { collide, npcAt, useMap } from '../src/shared/arena';
import { board } from '../src/shared/jobs';
import { newProfile, perkOffer } from '../src/shared/progress';
import { CHAPTER_1, newWorld } from '../src/shared/story';
import { SPOTS, townMap } from '../src/shared/town';
import { WEAPONS } from '../src/shared/tuning';
import { chargeFull } from '../src/sim/hero';
import { NO_INTENT } from '../src/sim/types';
import { Game } from '../src/client/game';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k),
} as Storage;
beforeEach(() => store.clear());

const hero = (n: number, name = 'H' + n) => ({ id: 'hhero' + String(n).padStart(6, '0'), name, cls: 'WARRIOR' as const });
const ready = () => {
  const w = newWorld();
  w.rescued = 6;
  w.storyDone.push(CHAPTER_1.goals.story);
  return w;
};

describe('the world server', () => {
  it('lets through only what a real run or gift could send', () => {
    expect(clean({ hero: { id: 'bad', name: 'x', cls: 'WARRIOR' } })).toBe(null);
    expect(clean({ hero: { ...hero(1), cls: 'PIRATE' } })).toBe(null);
    const c = clean({ hero: { ...hero(1), name: 'wren<b>!' }, stats: { jobs: 9, saved: -4, kills: 1e9 }, rescued: 99, works: { watch: 50, nope: 9 }, vote: 'burn it' })!;
    expect(c.hero.name).toBe('WRENB');
    expect(c.stats).toEqual({ jobs: 1, saved: 0, kills: 300 });
    expect(c.rescued).toBe(16);
    expect(c.works).toEqual({ watch: 50 });
    expect(c.vote).toBeUndefined();
  });

  it('keeps one world per code, and a Roll of the Brave per stat', async () => {
    const s = memoryWorldStore();
    await s.apply('wickhold', { hero: hero(1, 'WREN'), stats: { jobs: 1, saved: 3 }, rescued: 3, days: 1 });
    await s.apply('wickhold', { hero: hero(2, 'ASHE'), stats: { jobs: 1, saved: 5 }, rescued: 5, days: 1 });
    const v = await s.apply('wickhold', { hero: hero(1, 'WREN'), stats: { jobs: 1 }, days: 1 });
    expect(v.world.rescued).toBe(8);
    expect(v.world.day).toBe(4);
    expect(v.board.jobs.map((r) => [r.name, r.n])).toEqual([['WREN', 2], ['ASHE', 1]]);
    expect(v.board.saved[0].name).toBe('ASHE');
    expect((await s.load('our-band')).world.rescued).toBe(0);
  });

  it('the council decides when four heroes have voted, by majority', async () => {
    const s = memoryWorldStore();
    for (let i = 1; i <= 6; i++) await s.apply('g', { hero: hero(i), rescued: 1, story: i === 1 ? CHAPTER_1.mission.id : undefined });
    await s.apply('g', { hero: hero(1), vote: 'farm' });
    await s.apply('g', { hero: hero(2), vote: 'refugees' });
    let v = await s.apply('g', { hero: hero(3), vote: 'refugees' });
    expect(v.world.flags['north-fields']).toBeUndefined();
    v = await s.apply('g', { hero: hero(4), vote: 'farm' });
    // Two each: the tie goes to the choice voted first.
    expect(v.world.flags['north-fields']).toBe('farm');
  });
});

describe('the town', () => {
  it('every spot and everyone standing still can be reached; the patrols walk clear streets', () => {
    for (const w of [newWorld(), { ...ready(), works: { watch: 400, oldquarter: 600 }, flags: { 'north-fields': 'refugees' } }]) {
      const m = townMap(w);
      useMap(m);
      for (const s of SPOTS) {
        const p = { x: s.x, y: s.y + 0.4 };
        collide(p, 0.32);
        expect(Math.hypot(p.x - s.x, p.y - s.y), s.label).toBeLessThan(1.6);
      }
      for (const n of m.npcs!) for (let t = 0; t < 120; t += 0.7) {
        const at = npcAt(n, t), p = { x: at.x, y: at.y + (n.path ? 0 : 0.6) };
        collide(p, n.path ? 0.2 : 0.32);
        expect(Math.hypot(p.x - at.x, p.y - at.y - (n.path ? 0 : 0.6)), n.name).toBeLessThan(n.path ? 0.05 : 1.6);
        if (!n.path) break;
      }
    }
  });

  it('no fighting in town, but a roll still rolls', () => {
    const g = new Game();
    g.create('ROGUE', 'silk');
    g.skipWood();
    g.step(0.1, { ...NO_INTENT, attackSeq: 1, attack: true, relicSeq: 1 });
    expect(g.hero.act).not.toBe('attack');
    g.step(0.05, { ...NO_INTENT, rollSeq: 1, mx: 1 });
    expect(g.hero.act).toBe('roll');
  });

  it('town works fill from gold and change the town: the rubble goes, the Old Quarter opens', () => {
    const g = new Game();
    g.create('WARRIOR', 'b');
    g.skipWood();
    g.profile.gold = 700;
    expect(g.room.map.blocks.some((b) => b.kind === 'rubble')).toBe(true);
    for (let i = 0; i < 6; i++) g.fund('oldquarter', 100);
    expect(g.profile.stats.given).toBe(600);
    expect(g.room.map.blocks.some((b) => b.kind === 'rubble')).toBe(false);
    expect(g.room.map.npcs!.some((n) => n.name === 'OLD MERREN')).toBe(true);
    expect(g.fund('oldquarter', 100)).toBe(false);
  });

  it('a run lands on the hero line and the world; sewer jobs open once six dens are burned', () => {
    const g = new Game();
    g.create('MAGE', 'ashe');
    g.skipWood();
    expect(board(3, false).some((j) => j.place.region === 'Wickhold')).toBe(false);
    g.give({ stats: { dens: 6, jobs: 1 }, dens: 6, days: 1 });
    expect(g.profile.stats.dens).toBe(6);
    expect(g.jobs().some((j) => j.place.name === 'The Wickhold Sewers')).toBe(true);
  });

  it('the dice move gold by the bet, one way or the other', () => {
    const g = new Game();
    g.create('ROGUE', 'silk');
    g.skipWood();
    g.profile.gold = 100;
    for (let i = 0; i < 10; i++) {
      const before = g.profile.gold, r = g.dice(10)!;
      expect(g.profile.gold - before).toBe(r.won ? 10 : -10);
    }
  });

  it("each class's trainer offers its own perk, and it works", () => {
    const p = newProfile('RANGER');
    p.picks = 1;
    expect(perkOffer(p)[0]).toBe('steadyhand');
    const h = { perks: ['steadyhand'] } as never;
    expect(chargeFull(WEAPONS.longbow, h)).toBeLessThan(chargeFull(WEAPONS.longbow));
  });
});
