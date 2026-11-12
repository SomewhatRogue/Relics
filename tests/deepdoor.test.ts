/** The Doorkeepers in the Deep, at the sealed door (docs/design/deep-bosses.md, build order 3). */
import { describe, expect, it } from 'vitest';
import { deepFloor } from '../src/shared/deep';
import { goal, newRun, runRoom } from '../src/sim/run';
import { plateOf } from '../src/sim/bossplate';
import { NO_INTENT } from '../src/sim/types';

const room = (n: number, seed = 1, party = 1) => {
  const run = newRun(deepFloor(n, seed, 'x'));
  run.party = party;
  return { run, r: runRoom(run) };
};
/** A seed whose floor 5 is the Doorkeepers'. */
const doorSeed = [0, 1, 2, 3].find((s) => deepFloor(5, s, 'x').arena === 'doorkeepers')!;

describe('the Doorkeepers in the Deep', () => {
  it("boss floors take it in turns, the Haulier and the Doorkeepers, on the run's seed", () => {
    for (const seed of [0, 1, 7]) {
      // (Floor 10 is THE LISTENER's whatever the turn: the old caves, tests/listener.test.ts.)
      const arenas = [5, 10, 15, 20].map((n) => deepFloor(n, seed, 'x').arena);
      expect(arenas[1]).toBe('listener');
      expect(new Set(arenas.filter((a) => a !== 'listener'))).toEqual(new Set(['haulier', 'doorkeepers']));
      expect(arenas[0]).not.toBe(arenas[3]);
    }
  });

  it('their floor is the sealed door: the pair, the pit-prop stacks, the posts, the oil, the side tunnels, the chained chest', () => {
    const { run, r } = room(5, doorSeed);
    expect(r.map.sealed).toBeTruthy();
    expect(r.map.adits).toHaveLength(2);
    expect(r.map.blocks.filter((b) => b.kind === 'log')).toHaveLength(2);
    expect(r.props.some((p) => p.kind === 'oil')).toBe(true);
    expect(r.enemies.filter((e) => e.boss).map((e) => e.boss!.who).sort()).toEqual(['hasp', 'latch']);
    expect(plateOf(r.enemies, 0)?.bars).toHaveLength(2);
    expect(goal(run, r)).toMatchObject({ done: false });
    expect(goal(run, r).text).toContain('DOORKEEPERS');
    for (const e of r.enemies.filter((x) => x.boss)) Object.assign(e, { hp: 0, act: 'dead' });
    expect(goal(run, r).done).toBe(true);
  });

  it('are tougher deeper, as every boss down there', () => {
    const s20 = [0, 1, 2, 3].find((s) => deepFloor(20, s, 'x').arena === 'doorkeepers')!;
    const hp = (n: number, s: number) => room(n, s).r.enemies.find((e) => e.boss)!.maxHp;
    expect(hp(20, s20)).toBeGreaterThan(hp(5, doorSeed));
  });

  it("with three or more, the small ones come in out of the side tunnels, not the barn's doors", () => {
    const { r } = room(5, doorSeed, 3);
    const before = new Set(r.enemies.map((e) => e.id));
    for (const id of ['a', 'b', 'c']) r.join(id);
    for (const h of r.heroes) Object.assign(h, { x: 6, y: 9, hp: 9999, maxHp: 9999 });
    const pair = r.enemies.filter((e) => e.boss);
    for (let i = 0; i < 400 && r.enemies.length === before.size; i++) {
      for (const h of r.heroes) r.setIntent(h.id, NO_INTENT);
      for (const e of pair) (e.alert = true), (e.hp = Math.min(e.hp, Math.floor(e.maxHp * 0.3)));
      r.step();
    }
    const added = r.enemies.filter((e) => !before.has(e.id));
    expect(added.length).toBeGreaterThan(0);
    for (const e of added) expect(r.map.adits!.some((a) => Math.hypot(a.x - e.home.x, a.y - e.home.y) < 1.8)).toBe(true);
  });
});
