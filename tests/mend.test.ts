import { beforeEach, describe, expect, it } from 'vitest';
import { clean, memoryWorldStore } from '../api/_world';
import { newWorld, type WorldState } from '../src/shared/story';
import { townMap } from '../src/shared/town';
import { MENDS, WORKS, WORK_ORDER, stagesDone, workDone, workOpen, type WorkId } from '../src/shared/works';
import { RAID_FROM, RAID_GAP, lastRaid, lossText, raid, raidDue, raidable } from '../src/shared/raids';
import { contribute } from '../src/shared/worldsync';
import { mendLevel, townSays } from '../src/shared/townsays';
import { NEWS, PERRIN, RAID, STATE } from '../src/shared/mendlines';
import { Game } from '../src/client/game';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k),
} as Storage;
beforeEach(() => store.clear());

const hero = { id: 'hmend00001', name: 'MEND', cls: 'WARRIOR' as const };
const withWorks = (...ids: WorkId[]): WorldState => ({ ...newWorld(), works: Object.fromEntries(ids.map((k) => [k, WORKS[k].need])) });
const all = MENDS;

describe('the town works, in stages', () => {
  it('a stage opens only when the one before is done, and a gift never goes past what a work needs', () => {
    const g = new Game();
    g.create('WARRIOR', 'b');
    g.skipWood();
    g.profile.gold = 1000;
    expect(workOpen(g.world, 'plant')).toBe(false);
    expect(g.fund('plant', 25)).toBe(false);
    expect(g.fund('dig', 100)).toBe(true);
    expect(g.world.works.dig).toBe(WORKS.dig.need);
    expect(g.profile.gold).toBe(1000 - WORKS.dig.need);
    expect(workOpen(g.world, 'plant')).toBe(true);
    expect(stagesDone(g.world, 'dig')).toBe(1);
    expect(stagesDone(g.world, 'stakes')).toBe(0);
    expect(g.fund('dig', 25)).toBe(false);
  });

  it('the world server takes gifts to every new work, and nothing it does not know', () => {
    const c = clean({ hero, works: Object.fromEntries([...WORK_ORDER.map((k) => [k, 50]), ['moat', 50]]) })!;
    expect(Object.keys(c.works!).sort()).toEqual([...WORK_ORDER].sort());
  });
});

describe('Wickhold, broken and mended', () => {
  it('starts bloody: blood on the square, the dead on a cart, crows, scorched buildings, a garden trampled, a wall of sticks', () => {
    const m = townMap(newWorld());
    expect(m.marks!.filter((k) => k.kind === 'blood').length).toBeGreaterThan(3);
    expect(m.blocks.some((b) => b.kind === 'cart' && b.look === 3)).toBe(true);
    expect(m.rounds.some((r) => r.kind === 'crows')).toBe(true);
    expect(m.blocks.filter((b) => b.worn).length).toBeGreaterThan(5);
    expect(m.marks!.some((k) => k.kind === 'trample')).toBe(true);
    expect(m.rounds.some((r) => r.kind === 'deadtree')).toBe(true);
    expect(m.breach!.stage).toBe(0);
  });

  it('each work finished changes the map', () => {
    const base = townMap(newWorld()), posts = (w: WorldState) => townMap(w).rounds.filter((r) => r.kind === 'post').length;
    const washed = townMap(withWorks('wash'));
    expect(washed.marks!.some((k) => k.kind === 'blood' || k.kind === 'drag')).toBe(false);
    expect(washed.rounds.some((r) => r.kind === 'crows')).toBe(false);
    expect(washed.marks!.some((k) => k.kind === 'mound')).toBe(true);
    const lanes = (w: WorldState) => townMap(w).blocks.filter((b) => (b.kind === 'rubble' && b.x < 50) || (b.kind === 'cart' && b.look === 1)).length;
    expect(lanes(newWorld())).toBeGreaterThan(3);
    expect(lanes(withWorks('lanes'))).toBe(0);
    expect(posts(withWorks('lanterns'))).toBeGreaterThan(posts(newWorld()) + 5);
    expect(townMap(withWorks('shutters')).blocks.some((b) => b.worn && b.door !== 'bank')).toBe(false); // The counting house stays roofless (shared/town.ts).
    expect(base.marks!.some((k) => k.kind === 'beds' || k.kind === 'flowers')).toBe(false);
    expect(townMap(withWorks('dig')).marks!.filter((k) => k.kind === 'beds').length).toBe(3);
    expect(townMap(withWorks('dig', 'plant')).marks!.filter((k) => k.kind === 'flowers').length).toBe(3);
    expect(townMap(withWorks('dig', 'plant', 'arbour')).blocks.filter((b) => b.kind === 'bench').length).toBe(4);
    expect(townMap(withWorks('stakes')).breach!.stage).toBe(1);
    expect(townMap(withWorks('stakes', 'timber', 'stonewall')).breach!.stage).toBe(3);
    // A later stage paid for out of turn doesn't count till the one before it is done.
    expect(townMap(withWorks('timber')).breach!.stage).toBe(0);
  });
});

describe('raids', () => {
  it('pull down the top of what is mended, never the old works or stone, and the town remembers', () => {
    const w = withWorks('watch', 'oldquarter', 'wash', 'lanterns', 'dig', 'plant', 'stakes', 'timber', 'stonewall');
    w.day = 20;
    expect(raidable(w).sort()).toEqual(['lanterns', 'plant', 'wash']);
    const lost = raid(w, 5);
    expect(lost[0]).toBe('wash');
    expect(lost.length).toBe(2);
    for (const k of lost) expect(workDone(w, k)).toBe(false);
    for (const k of ['watch', 'oldquarter', 'stakes', 'timber', 'stonewall', 'dig'] as WorkId[]) expect(workDone(w, k)).toBe(true);
    expect(lastRaid(w)).toEqual({ day: 20, lost });
    expect(lossText(lastRaid(w)!)).toContain('the square is bloodied again');
  });

  it('knock the wall back one stage at a time, and the garden one stage', () => {
    const w = withWorks('stakes', 'timber', 'dig', 'plant', 'arbour');
    expect(raidable(w).sort()).toEqual(['arbour', 'timber']);
    raid(w, 1), raid(w, 2);
    expect(stagesDone(w, 'stakes') + stagesDone(w, 'dig')).toBe(3);
  });

  it('come on the same nights for everyone, not before the town has something to lose, and not two close together', () => {
    const w = withWorks(...all.filter((k) => k !== 'stonewall'));
    expect(raidDue(newWorld(), 50)).toBe(false);
    for (let d = 1; d < RAID_FROM; d++) expect(raidDue(w, d)).toBe(false);
    const days = Array.from({ length: 200 }, (_, i) => i + RAID_FROM).filter((d) => raidDue(w, d));
    expect(days.length).toBeGreaterThan(10);
    expect(days).toEqual(Array.from({ length: 200 }, (_, i) => i + RAID_FROM).filter((d) => raidDue(structuredClone(w), d)));
    w.raids = [{ day: days[0], lost: [] }];
    for (let d = days[0]; d < days[0] + RAID_GAP; d++) expect(raidDue(w, d)).toBe(false);
  });

  it('are rolled as the days pass: by the world server, and by a browser only off it', async () => {
    const a = memoryWorldStore(), b = memoryWorldStore(), gift = { works: Object.fromEntries(all.map((k) => [k, WORKS[k].need])) };
    await a.apply('g', { hero, ...gift }), await b.apply('g', { hero, ...gift });
    for (let i = 0; i < 60; i++) await a.apply('g', { hero, days: 1 }), await b.apply('g', { hero, days: 1 });
    const [wa, wb] = [(await a.load('g')).world, (await b.load('g')).world];
    expect(wa.raids!.length).toBeGreaterThan(0);
    expect(wa.raids).toEqual(wb.raids);
    expect(wa.works).toEqual(wb.works);
    const off = withWorks(...all);
    for (let i = 0; i < 60; i++) contribute(off, { hero, days: 1 }, Date.now(), false);
    expect(off.raids).toBeUndefined();
  });
});

describe('what the town says', () => {
  it('talks about the latest work done, then how the town stands; after a raid, the raid', () => {
    const w = newWorld();
    contribute(w, { hero, works: { wash: WORKS.wash.need } });
    expect(w.mended![0]).toMatchObject({ id: 'wash' });
    expect(townSays(w, 'wenna')).toBe(NEWS.wash!.wenna);
    w.day += 10;
    expect([null, STATE.wenna![0]]).toContain(townSays(w, 'wenna'));
    const seen = new Set(Array.from({ length: 6 }, (_, i) => townSays({ ...w, day: w.day + i }, 'dunn')));
    expect(seen).toContain(null);
    expect(seen).toContain(STATE.dunn![mendLevel(w)]);
    w.raids = [{ day: w.day, lost: ['wash'] }];
    expect(townSays(w, 'dunn')).toBe(RAID.dunn);
  });

  it('the town comes on: still broken, mending, mended with the garden in flower', () => {
    expect(mendLevel(newWorld())).toBe(0);
    expect(mendLevel(withWorks('wash', 'lanes'))).toBe(1);
    expect(mendLevel(withWorks(...all))).toBe(2);
  });

  it("Widow Perrin talks about her garden as it comes on, and of an evening once there's a bench", () => {
    expect(townSays(newWorld(), 'perrin')).toBe(PERRIN.stages[0]);
    expect(townSays(withWorks('dig', 'plant'), 'perrin')).toBe(PERRIN.stages[2]);
    expect(townSays(withWorks('dig', 'plant', 'arbour'), 'perrin', true)).toBe(PERRIN.evening);
    expect(townSays(withWorks('dig', 'plant', 'arbour'), 'perrin', false)).toBe(PERRIN.stages[3]);
  });

  it('no em dashes in any of it', () => {
    const text = JSON.stringify([WORKS, NEWS, STATE, RAID, PERRIN]);
    expect(text).not.toMatch(/\u2014|\u2013/);
  });
});

describe('the ground and the life in it', () => {
  const kinds = (w: WorldState) => new Set(townMap(w).marks!.map((k) => k.kind));
  const count = (w: WorldState, k: string) => townMap(w).marks!.filter((m) => m.kind === k).length;

  it('the town is not one sheet of cobbles, mended or not, and mending heals the mess', () => {
    const mats = (w: WorldState) => townMap(w).soil!.map((x) => x.mat), soilOf = (w: WorldState, k: string) => mats(w).filter((x) => x === k).length;
    for (const w of [newWorld(), withWorks(...all)]) {
      for (const k of ['ruts', 'puddle', 'weeds', 'gutter', 'holes']) expect(kinds(w).has(k as never), k).toBe(true);
      for (const k of ['cobble', 'flags', 'earth', 'mud', 'wet', 'straw', 'ash', 'grass', 'shade']) expect(mats(w), k).toContain(k);
    }
    // Earth and mud everywhere first; cobble only in islands and strips over it.
    expect(townMap(newWorld()).soil![0]).toMatchObject({ mat: 'mud', w: 64, h: 42 });
    // (The square is paved edge to edge since 2026-11-13, Kyle: "more clean"; washing it takes the wear off.)
    expect(soilOf(withWorks('wash'), 'mud') + soilOf(withWorks('wash'), 'earth')).toBeLessThan(soilOf(newWorld(), 'mud') + soilOf(newWorld(), 'earth'));
    expect(soilOf(withWorks('wash', 'lanes'), 'swept')).toBeGreaterThan(0);
    expect(soilOf(withWorks('lanes'), 'mud')).toBeLessThan(soilOf(newWorld(), 'mud'));
    expect(count(withWorks('wash', 'lanes'), 'holes')).toBeLessThan(count(newWorld(), 'holes'));
    expect(kinds(newWorld()).has('arrows')).toBe(true);
    expect(kinds(withWorks('lanes')).has('arrows')).toBe(false);
    expect(JSON.stringify(townMap(newWorld()).soil)).toBe(JSON.stringify(townMap(newWorld()).soil));
  });

  it('under siege: a gallows, the gravedigger at his work, the burned-out round a brazier, hurdles at the gate', () => {
    const m = townMap(newWorld()), cobb = m.npcs!.find((n) => n.name === 'GRAVEDIGGER COBB')!;
    expect(m.blocks.some((b) => b.kind === 'gallows')).toBe(true);
    expect(cobb.work).toBe('bury');
    expect(cobb.path!.length).toBeGreaterThan(2);
    expect(townMap(withWorks('wash')).npcs!.find((n) => n.name === 'GRAVEDIGGER COBB')!.work).toBe('dig');
    expect(m.npcs!.some((n) => n.name === 'GOODMAN TULL')).toBe(true);
    expect(townMap(withWorks('shutters')).npcs!.some((n) => n.name === 'GOODMAN TULL')).toBe(false);
    expect(m.blocks.filter((b) => b.kind === 'hurdle').length).toBe(2);
    expect(townMap(withWorks('stakes', 'timber')).blocks.some((b) => b.kind === 'hurdle')).toBe(false);
    expect(m.rounds.some((r) => r.kind === 'dog') && m.rounds.some((r) => r.kind === 'smoke')).toBe(true);
  });

  it('nobody talks to the ones huddled in the background', () => {
    const g = new Game();
    g.create('WARRIOR', 'b');
    g.skipWood();
    const mute = g.room.map.npcs!.filter((n) => n.mute);
    expect(mute.length).toBeGreaterThan(0);
    for (const n of mute) {
      Object.assign(g.hero, { x: n.x, y: n.y + 0.4 });
      expect(g.near()?.npc?.mute).not.toBe(true);
    }
  });
});
