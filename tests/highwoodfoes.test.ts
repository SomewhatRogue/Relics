/**
 * The High Wood's slice 2 (shared/highwoodfoes.ts, highwoodnooks.ts, highwoodgather.ts): its packs, nooks, mini boss
 * chests, gathers and bounties, and its raid roster.
 */
import { describe, expect, it } from 'vitest';
import { collide, useMap, type GameMap } from '../src/shared/arena';
import { BOUNTIES, FEN_BOUNTIES, FEN_LEVEL, WOOD_BOUNTIES, WOOD_LEVEL, bountyOf, postedFor, take } from '../src/shared/bounties';
import { LODGE, WAY_IN } from '../src/shared/highwoodland';
import { COIN_OAK_PACK, IRONHIDES_PACK, WOOD_PACKS } from '../src/shared/highwoodfoes';
import { WOOD_GATHERS } from '../src/shared/highwoodgather';
import { WOOD_NOOKS, WOOD_NOOK_PACKS } from '../src/shared/highwoodnooks';
import { highWoodAt } from '../src/shared/highwoodground';
import { newProfile } from '../src/shared/progress';
import { RAID } from '../src/shared/raidtune';
import { landJob, territoryPlan } from '../src/shared/territory';
import { layAfter } from '../src/sim/matdrops';
import { newRun, runRoom } from '../src/sim/run';
import { roster } from '../src/sim/raidform';
import { Rng } from '../src/shared/rng';

const plan = (day = 3) => territoryPlan(landJob('highwood', day));
const far = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('the High Wood: foes, nooks, gathers, bounties', () => {
  it('has fourteen packs of about fifty-five bodies, none near the way in or the lodge, each standing clear', () => {
    for (const d of [3, 17]) {
      const p = plan(d), foes = p.foes.filter((f) => WOOD_PACKS.includes(f.pack!));
      expect(new Set(foes.map((f) => f.pack))).toEqual(new Set(WOOD_PACKS));
      expect(WOOD_PACKS).toHaveLength(14);
      expect(Math.min(...WOOD_PACKS)).toBeGreaterThanOrEqual(471);
      expect(foes.length).toBeGreaterThanOrEqual(50);
      expect(foes.length).toBeLessThanOrEqual(62);
      useMap(p.map);
      for (const f of p.foes) {
        expect(far(f, WAY_IN), `way in ${f.pack}`).toBeGreaterThan(10);
        expect(far(f, LODGE), `lodge ${f.pack}`).toBeGreaterThan(9);
        const q = { x: f.x, y: f.y, z: f.z ?? 0 };
        collide(q, 0.45);
        expect(far(q, f), `${f.pack} at ${f.x}, ${f.y}`).toBeLessThan(0.05);
      }
    }
  });

  it('puts its roles where the parts say', () => {
    const f = plan().foes, of = (pack: number) => f.filter((x) => x.pack === pack);
    for (const pk of [471, 472, 473]) expect(of(pk).some((x) => x.role === 'snarer'), `${pk}`).toBe(true);
    expect(of(474).filter((x) => x.bow && x.z === 1)).toHaveLength(2);
    expect(of(475).map((x) => x.role).sort()).toEqual(['keeper', 'wolf', 'wolf']);
    expect(of(IRONHIDES_PACK).filter((x) => x.role === 'ironhide')).toHaveLength(3);
    expect(of(IRONHIDES_PACK).filter((x) => x.role === 'torch')).toHaveLength(2);
    expect(of(478).filter((x) => x.kind === 'nest')).toHaveLength(1);
    for (const pk of [479, 480]) expect(of(pk).every((x) => x.task?.k === 'lurk'), `${pk}`).toBe(true);
    expect(of(COIN_OAK_PACK).map((x) => x.role)).toEqual(expect.arrayContaining(['heavy', 'drummer', 'butcher']));
    expect(f.filter((x) => x.name)).toHaveLength(0);
  });

  it('has five nooks with two mini bosses guarding chained chests, packs in their own range', () => {
    const p = plan();
    expect(WOOD_NOOKS).toHaveLength(5);
    expect(WOOD_NOOK_PACKS.every((n) => !WOOD_PACKS.includes(n))).toBe(true);
    for (const n of WOOD_NOOKS) {
      expect(far(n, LODGE), n.id).toBeGreaterThan(10);
      expect(far(n, WAY_IN), n.id).toBeGreaterThan(10);
      if (n.boss === undefined) continue;
      const pack = p.foes.filter((f) => f.pack === n.boss), boss = pack.filter((f) => f.kind === 'butcher' && f.elite?.length && f.big);
      expect(boss, n.id).toHaveLength(1);
      expect(pack.length, n.id).toBeGreaterThanOrEqual(2);
      for (const f of pack) expect(far(f, n), `${n.id} ${f.kind}`).toBeLessThan(n.r);
      expect(p.chests.filter((c) => c.chained && c.guard === n.boss), n.id).toHaveLength(1);
    }
    expect(p.chests.filter((c) => c.guard !== undefined)).toHaveLength(2);
    for (const b of [...FEN_BOUNTIES, ...WOOD_BOUNTIES]) for (const id of WOOD_NOOK_PACKS) expect(b.packs).not.toContain(id);
  });

  it('lays thunderstone only once the ironhides are dead, with hide, silk and fatwood spots on dry ground', () => {
    const g = plan().map.gathers!;
    expect(g.filter((x) => x.mat === 'thunder').map((x) => x.after ?? x.chance)).toEqual([IRONHIDES_PACK, 0.5, 0.4]);
    for (const m of ['hide', 'silk', 'fatwood'] as const) expect(g.filter((x) => x.mat === m).length, m).toBeGreaterThanOrEqual(3);
    const m = plan().map as GameMap;
    useMap(m);
    for (const s of WOOD_GATHERS) {
      expect(highWoodAt(s.x, s.y), `${s.mat} ${s.x}`).toBe(0);
      const q = { x: s.x, y: s.y };
      collide(q, 0.3);
      expect(far(q, s), `${s.mat} ${s.x}, ${s.y}`).toBeLessThan(0.05);
    }
    const r = runRoom(newRun(landJob('highwood', 5)));
    const lying = () => r.pickups.filter((x) => x.mat === 'thunder' && x.life > 1000).length;
    layAfter(r);
    const before = lying();
    const band = r.allEnemies.filter((e) => e.pack === IRONHIDES_PACK);
    expect(band).toHaveLength(6);
    for (const e of band.slice(0, 5)) e.act = 'dead' as typeof e.act;
    layAfter(r);
    expect(lying()).toBe(before);
    band[5].act = 'dead' as (typeof band)[0]['act'];
    layAfter(r);
    expect(lying()).toBe(before + 1);
  });

  it('posts the wood\'s bounties from level 9 and not 8, each n what the map places', () => {
    for (const day of [3, 17]) {
      const foes = plan(day).foes;
      for (const b of WOOD_BOUNTIES) expect(foes.filter((f) => f.pack !== undefined && b.packs.includes(f.pack) && (!b.kinds || b.kinds.includes(f.kind))).length, b.id).toBe(b.n);
    }
    expect(WOOD_BOUNTIES.map((b) => b.id)).toEqual(['ironhides', 'coinoak', 'lanesnarers']);
    for (const b of WOOD_BOUNTIES) {
      expect(bountyOf(b.id)).toBe(b);
      expect(BOUNTIES.some((x) => x.id === b.id)).toBe(false);
      for (const f of FEN_BOUNTIES) expect(b.pay).toBeGreaterThan(f.pay);
    }
    expect(postedFor(4, FEN_LEVEL)).toHaveLength(3);
    expect(postedFor(4, WOOD_LEVEL - 1)).toHaveLength(3);
    const day = 4, w = postedFor(day, WOOD_LEVEL);
    expect(w).toHaveLength(4);
    expect(WOOD_BOUNTIES).toContain(w[3]);
    const p = newProfile('WARRIOR', 'X');
    p.level = WOOD_LEVEL - 1;
    expect(take(p, w[3].id, day)).toBe(false);
    p.level = WOOD_LEVEL;
    expect(take(p, w[3].id, day)).toBe(true);
    expect(take(p, w[0].id, day)).toBe(true);
    expect(take(p, w[1].id, day)).toBe(false);
  });

  it('has a raid roster of wood kinds', () => {
    const ro = RAID.rosters['THE HIGH WOOD'];
    expect(ro).toBeTruthy();
    const m = plan().map, seen = new Set<string>();
    for (let i = 0; i < 60; i++) for (const r of roster(m, new Rng(i + 1))) seen.add(r);
    for (const k of ['snarer', 'torch', 'keeper', 'wolf', 'archer', 'lunger', 'fodder']) expect(seen.has(k), k).toBe(true);
  });
});
