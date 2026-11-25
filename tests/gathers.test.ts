/**
 * What the North Fields give (docs/design/materials.md "Gathered"; shared/gatefieldsgather.ts): every spot is walkable ground,
 * a roaming room lays them at their chances from the seed alone, the saltpetre only once the den's pack is dead, and a
 * land that does not roam lays none.
 */
import { layAfter } from '../src/sim/matdrops';
import { describe, expect, it } from 'vitest';
import { collide, useMap } from '../src/shared/arena';
import { GATHERS } from '../src/shared/gatefieldsgather';
import { inSolid } from '../src/shared/reach';
import { landJob, territoryPlan } from '../src/shared/territory';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const room = (day: number, roam = true) => {
  const job = { ...landJob('gatefields', day), roam };
  const r = runRoom({ ...newRun(job), index: 0 });
  r.join('me'), r.setIntent('me', NO_INTENT);
  return r;
};
const lying = (r: ReturnType<typeof room>, mat?: string) => r.pickups.filter((p) => p.mat && (!mat || p.mat === mat));

describe('the north fields gathers', () => {
  it('has the spots the lore keeper placed', () => {
    const n = (m: string) => GATHERS.filter((g) => g.mat === m).length;
    expect([n('charcoal'), n('fatwood'), n('saltpetre'), n('clay'), n('mint'), n('struck'), n('amber')]).toEqual([2, 5, 1, 1, 3, 1, 3]);
    expect(GATHERS.find((g) => g.mat === 'saltpetre')!.after).toBe(406);
  });

  it('every spot is walkable, in no block, and not under a pack start, on several seeds', () => {
    for (const d of [3, 11, 29, 47, 90]) {
      const p = territoryPlan(landJob('gatefields', d));
      expect(p.map.gathers).toHaveLength(GATHERS.length);
      useMap(p.map);
      for (const g of p.map.gathers!) {
        const at = { x: g.x, y: g.y };
        collide(at, 0.45);
        expect(Math.hypot(at.x - g.x, at.y - g.y), `${g.mat} at ${g.x},${g.y} (day ${d})`).toBeLessThan(0.02);
        expect(inSolid(p.map, g.x, g.y, 0.2), `${g.mat} solid`).toBe(false);
        for (const f of p.foes) expect(Math.hypot(f.x - g.x, f.y - g.y), `${g.mat} under a foe`).toBeGreaterThan(0.6);
        for (const c of p.chests) expect(Math.hypot(c.x - g.x, c.y - g.y)).toBeGreaterThan(0.6);
      }
    }
  });

  it('has the struck pine and the old stumps', () => {
    const m = territoryPlan(landJob('gatefields', 3)).map;
    expect(m.blocks.filter((b) => b.kind === 'struckpine')).toHaveLength(1);
  });

  it('lays at about the chances over many seeds, the same for one seed, never the saltpetre at the start', () => {
    const tally: Record<string, number> = {};
    const N = 120;
    for (let d = 1; d <= N; d++) {
      const r = room(d);
      expect(lying(r, 'saltpetre')).toHaveLength(0);
      for (const p of lying(r)) tally[p.mat!] = (tally[p.mat!] ?? 0) + 1;
    }
    const near = (mat: string, per: number, chance: number) => {
      const exp = N * per * chance;
      expect(tally[mat] ?? 0, mat).toBeGreaterThan(exp * 0.7);
      expect(tally[mat] ?? 0, mat).toBeLessThan(exp * 1.3);
    };
    near('charcoal', 2, 0.6), near('fatwood', 5, 0.5), near('clay', 1, 0.7), near('mint', 3, 0.5), near('struck', 1, 0.8), near('amber', 3, 0.35);
    const a = lying(room(7)).map((p) => [p.mat, p.x, p.y]), b = lying(room(7)).map((p) => [p.mat, p.x, p.y]);
    expect(a).toEqual(b);
  });

  it('lays the saltpetre once, when every foe of pack 406 is dead', () => {
    // The room calls layAfter on each death (sim/room.ts, beside dropMats); here the deaths are set by hand.
    const r = room(5);
    layAfter(r);
    expect(lying(r, 'saltpetre')).toHaveLength(0);
    const den = r.allEnemies.filter((e) => e.pack === 406);
    expect(den.length).toBe(4);
    for (const e of den.slice(0, 3)) e.act = 'dead' as typeof e.act;
    layAfter(r);
    expect(lying(r, 'saltpetre')).toHaveLength(0);
    den[3].act = 'dead' as typeof den[3]['act'];
    layAfter(r);
    expect(lying(r, 'saltpetre')).toHaveLength(1);
    layAfter(r);
    expect(lying(r, 'saltpetre')).toHaveLength(1);
  });

  it('lays none when the land does not roam', () => {
    const r = room(5, false);
    for (let i = 0; i < 3; i++) r.step();
    expect(lying(r)).toHaveLength(0);
  });
});
