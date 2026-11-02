import { describe, expect, it } from 'vitest';
import { inArea, type Block } from '../src/shared/arena';
import { burningAt, reaches } from '../src/shared/blaze';
import { fate, grimness, house, houseSeed } from '../src/shared/houses';
import { runInterior } from '../src/shared/interiors';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { planRoom } from '../src/shared/terrain';
import { HOUSEFIRE, TICK } from '../src/shared/tuning';
import { interiorRoom, newRun, tally } from '../src/sim/run';
import { walkable } from './walk';
import { Game } from '../src/client/game';
import { NO_INTENT } from '../src/sim/types';

// A browser's storage, for the saves.
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k),
} as Storage;

const job = (seed: number, o: Partial<Job> & { ruin?: number; kind?: Job['place']['kind'] } = {}): Job => {
  const { ruin = 2, kind = 'farm', ...rest } = o;
  return { ...board(1)[0], rooms: 3, objective: 'hunt', size: 'medium', ...rest, place: { ...PLACES.find((p) => p.kind === kind)!, ruin }, seed };
};
const BIG = ['THE LONGHOUSE', 'THE HALL HOUSE', 'THE GREAT BARN'];

/** A run room's houses with their fates, and the job they came from. */
function streets(n: number, o: Parameters<typeof job>[1]) {
  const out: { j: Job; b: Block; i: number; room: number }[] = [];
  for (let s = 1; s <= n; s++) for (const room of [0, 1, 2]) {
    const j = job(s * 31 + 7, o), plan = planRoom(j, room);
    plan.map.blocks.forEach((b, i) => b.look !== undefined && out.push({ j, b, i, room }));
  }
  return out;
}

describe('big houses', () => {
  it('come on long and deep jobs, all three sorts, and every one leaves the door clear and a way to all of it', () => {
    const names = new Set<string>();
    for (let s = 1; s <= 160; s++) for (const door of ['cottage', 'barn']) {
      const j = job(s * 13 + 1, { deep: s % 2 === 0, size: 'long', objective: s % 3 ? 'hunt' : 'rescue', ruin: 1 + (s % 3) }), plan = runInterior(j, s % 3, s % 4, door), m = plan.map;
      if (!BIG.includes(m.name)) continue;
      names.add(m.name);
      expect(m.w).toBeGreaterThanOrEqual(18);
      const w = walkable(plan), where = `${m.name} seed ${j.seed}`;
      expect(w.open(m.hero.x, m.hero.y), where).toBe(true);
      expect(inArea(m.exit, m.w / 2, m.h - 0.3), where).toBe(true);
      expect(w.reached / w.all, where).toBeGreaterThan(0.85);
      for (const f of plan.foes) expect(w.reach(f.x, f.y, 0.9), `${where}: ${f.kind}`).toBe(true);
      for (const q of plan.props.filter((q) => q.kind === 'cage')) expect(w.reach(q.x, q.y, 1.2), `${where}: cage`).toBe(true);
    }
    expect(names).toEqual(new Set(BIG));
    // Never on a short job, nor the first room of a medium one.
    for (let s = 1; s <= 60; s++) expect(BIG).not.toContain(runInterior(job(s, { size: 'short', rooms: 2 }), 0, 1, 'cottage').map.name);
  });
});

describe('what the goblins did', () => {
  it('is the same for the same seed, worse in worse places, and some houses stay quiet', () => {
    const j = job(41, { ruin: 3 });
    expect(JSON.stringify(runInterior(j, 1, 2, 'cottage').map.grim)).toBe(JSON.stringify(runInterior(j, 1, 2, 'cottage').map.grim));
    const tally = (o: Parameters<typeof job>[1]) => {
      let n = 0, quiet = 0, houses = 0;
      const kinds = new Set<string>();
      for (let s = 1; s <= 150; s++) {
        const p = runInterior(job(s * 7, o), 1, s % 5, s % 3 ? 'cottage' : 'barn');
        if (p.map.blaze) continue;
        const g = (p.map.grim ?? []).filter((q) => q.kind !== 'strewn');
        houses++, (n += g.length), g.length || quiet++;
        for (const q of g) kinds.add(q.kind);
        // The pot is always on the goblins' fire; nothing grim lies in the doorway.
        for (const q of g) if (q.kind === 'pot') expect(p.map.braziers.some((b) => b.x === q.x && b.y === q.y)).toBe(true);
        for (const q of g) if (q.kind === 'torn' || q.kind === 'hung' || q.kind === 'bones') expect(Math.abs(q.x - p.map.w / 2) < 1.5 && q.y > p.map.h - 3).toBe(false);
      }
      return { mean: n / houses, quiet: quiet / houses, kinds };
    };
    const mild = tally({ ruin: 1 }), bad = tally({ ruin: 3, deep: true, size: 'long' });
    expect(bad.mean).toBeGreaterThan(mild.mean * 1.3);
    expect(mild.quiet).toBeGreaterThan(0.25);
    expect(bad.quiet).toBeGreaterThan(0.08);
    expect(bad.kinds).toEqual(new Set(['torn', 'pinned', 'hung', 'bones', 'smear', 'tally', 'trail', 'pot', 'remains']));
  });
});

describe('wrecked and burning houses', () => {
  it('more of them the worse the place; the blocked ones have no door; footprints never change', () => {
    const count = (ruin: number) => {
      const c: Record<string, number> = { standing: 0, wrecked: 0, blocked: 0, burning: 0 };
      for (const { b } of streets(60, { ruin, kind: 'village' })) {
        c[b.fate!]++;
        expect([b.w, b.h]).toEqual([3.5, 2]);
        expect(!!b.door).toBe(b.fate !== 'blocked');
        expect(!!b.smoulder).toBe(b.fate === 'burning');
      }
      return c;
    };
    const mild = count(1), bad = count(3);
    for (const k of ['wrecked', 'blocked', 'burning']) expect(bad[k], k).toBeGreaterThan(mild[k]);
    expect(mild.standing).toBeGreaterThan(mild.wrecked + mild.blocked + mild.burning);
  });

  it('a burning house always leaves a way from the door to the cage that no fire crosses before the roof comes in', () => {
    let seen = 0;
    for (const { j, b, i, room } of streets(120, { ruin: 3, kind: 'village', objective: 'rescue' })) {
      if (b.fate !== 'burning') continue;
      const p = runInterior(j, room, i, b.door!), z = p.map.blaze!, cage = p.props.find((q) => q.kind === 'cage')!;
      seen++;
      expect(z.fall).toBeGreaterThanOrEqual(HOUSEFIRE.fallMin);
      expect(p.foes.length).toBe(0);
      // Everything that will be burning before the roof goes, as walls.
      const fire = z.patches.filter((q) => q.at < z.fall);
      const w = walkable(p, fire);
      expect(w.open(p.map.hero.x, p.map.hero.y), `seed ${j.seed}`).toBe(true);
      expect(w.reach(cage.x, cage.y, 1.2), `seed ${j.seed} cage`).toBe(true);
      expect(reaches({ ...p.map, floor: 'dirt', props: p.props, stand: [], sleep: [], hide: cage, body: cage }, fire, p.map.hero, cage)).toBe(true);
      // Nothing burns or falls in the doorway, ever.
      for (let t = 0; t < z.fall; t += 1) for (const a of burningAt(z, t)) expect(inArea(a, p.map.w / 2, p.map.h - 1.3)).toBe(false);
      for (const m of z.beams) expect(Math.hypot(m.x - p.map.w / 2, m.y - (p.map.h - 1.3))).toBeGreaterThan(HOUSEFIRE.beamR + 0.4);
    }
    expect(seen).toBeGreaterThan(5);
  });

  it('inside, fire burns you, a beam hits where its circle was, and the roof throws you out and takes the caged', () => {
    const hit = streets(120, { ruin: 3, kind: 'village', objective: 'rescue' }).find(({ b }) => b.fate === 'burning')!;
    const run = newRun(hit.j);
    run.index = hit.room;
    const room = interiorRoom(run, hit.i, 'cottage'), z = room.map.blaze!, h = room.join('me');
    Object.assign(h, { x: room.map.hero.x, y: room.map.hero.y });
    // Standing in the doorway the whole time: never burned.
    const full = h.hp;
    while (room.time < 5) room.step();
    expect(h.hp).toBe(full);
    // In a patch that's alight: a little at a time, about HOUSEFIRE.dps a second.
    const p = z.patches.find((q) => q.at === 0)!;
    Object.assign(h, { x: p.x + p.w / 2, y: p.y + p.h / 2 - 0.1 });
    const before = h.hp, t0 = room.time;
    while (room.time < t0 + 1) (h.x = p.x + p.w / 2), (h.y = p.y + p.h / 2 - 0.1), room.step();
    expect(before - h.hp).toBeGreaterThanOrEqual(HOUSEFIRE.dps - 4);
    expect(before - h.hp).toBeLessThanOrEqual(HOUSEFIRE.dps + 4);
    // Under a beam when it comes down.
    h.hp = full;
    const m = z.beams.find((q) => q.at > room.time + 0.5)!;
    while (room.time < m.at - TICK * 2) (h.x = room.map.hero.x), (h.y = room.map.hero.y), room.step();
    Object.assign(h, { x: m.x, y: m.y, hp: full });
    let got = false;
    for (let k = 0; k < 6; k++) room.step(), (got ||= room.events.some((e) => e.k === 'rafter'));
    expect(got).toBe(true);
    expect(full - h.hp).toBeGreaterThanOrEqual(HOUSEFIRE.beamDmg);
    // The roof: thrown out the door, hurt but alive; the cage is gone, and the run counts the loss.
    Object.assign(h, { hp: 10, act: 'idle' });
    const evs = [];
    while (room.time < z.fall + TICK * 2) {
      Object.assign(h, { x: room.map.hero.x, y: room.map.hero.y });
      room.step();
      evs.push(...room.events);
      if (room.blaze?.fallen) break;
    }
    expect(room.blaze?.fallen).toBe(true);
    expect(inArea(room.map.exit, h.x, h.y)).toBe(true);
    expect(h.hp).toBe(1);
    expect(room.props.some((q) => q.kind === 'cage')).toBe(false);
    tally(run, room, evs, 'me');
    expect(run.lost).toBe(1);
  });

  it('a house from a seed is the same house: same fate, same grim, same fire', () => {
    for (const s of [5, 77, 301]) {
      const j = job(s, { ruin: 3, deep: true, size: 'long' }), seed = houseSeed(j, 1, 2);
      expect(fate(j, 1, seed)).toBe(fate(j, 1, seed));
      expect(house(seed, 'cottage')).toEqual(house(seed, 'cottage'));
      expect(JSON.stringify(runInterior(j, 1, 2, 'cottage').map)).toBe(JSON.stringify(runInterior(j, 1, 2, 'cottage').map));
      expect(grimness(j, 1)).toBeGreaterThan(grimness(job(s, { ruin: 1 }), 1));
    }
  });

  it('in the game: a blocked house has no door to use, a burning one can be gone into, and once it falls in it is ash outside', () => {
    let j: Job | undefined;
    for (let s = 1; s < 400 && !j; s++) {
      const c = job(s, { ruin: 3, kind: 'village', rooms: 2 }), bs = planRoom(c, 0).map.blocks;
      if (bs.some((b) => b.fate === 'burning') && bs.some((b) => b.fate === 'blocked')) j = c;
    }
    const g = new Game();
    g.startJob(j!);
    const blocked = g.room.map.blocks.find((b) => b.fate === 'blocked')!, burning = g.room.map.blocks.find((b) => b.fate === 'burning')!;
    Object.assign(g.hero, { x: blocked.x + blocked.w / 2, y: blocked.y + blocked.h + 0.45 });
    expect(g.near()?.door).not.toBe(blocked);
    g.enter(blocked);
    expect(g.outside).toBeNull();
    g.enter(burning);
    expect(g.outside?.door).toBe(burning);
    const fall = g.room.map.blaze!.fall;
    for (let t = 0; t < fall + 2 && g.outside; t += 0.05) {
      if (g.room.time < fall - 1) Object.assign(g.hero, { x: g.room.map.w / 2, y: g.room.map.h - 2, hp: 100 });
      g.step(0.05, NO_INTENT);
    }
    expect(g.outside).toBeNull();
    expect(burning.ruined).toBe(true);
    expect(g.hero.hp).toBeGreaterThan(0);
  });
});
