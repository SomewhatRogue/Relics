import { describe, expect, it } from 'vitest';
import { inArea } from '../src/shared/arena';
import { walkable } from './walk';
import { house, houseSeed } from '../src/shared/houses';
import { runInterior } from '../src/shared/interiors';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { planRoom, type RoomPlan } from '../src/shared/terrain';

const job = (seed: number, kind: Job['place']['kind'] = 'farm', objective: Job['objective'] = 'hunt', ruin = 1): Job =>
  ({ ...board(1)[0], layout: undefined, rooms: 3, place: { ...PLACES.find((p) => p.kind === kind)!, ruin }, objective, seed });
const layout = (p: RoomPlan) => JSON.stringify({ w: p.map.w, h: p.map.h, f: p.map.theme.floor, b: p.map.blocks, r: p.map.rounds, p: p.props });

describe('houses on a job', () => {
  it('differ from seed to seed, inside and out, and the same seed makes the same house', () => {
    expect(layout(runInterior(job(11), 0, 2, 'cottage'))).not.toBe(layout(runInterior(job(12), 0, 2, 'cottage')));
    expect(layout(runInterior(job(11), 0, 2, 'cottage'))).toBe(layout(runInterior(job(11), 0, 2, 'cottage')));
    const kinds = new Set<string>(), barns = new Set<string>(), looks = new Set<string>(), floors = new Set<string>(), names = new Set<string>();
    for (let s = 1; s <= 80; s++) {
      kinds.add(house(s, 'cottage').kind), barns.add(house(s, 'barn').kind);
      const h = house(s, 'cottage');
      looks.add(`${h.roof}${h.thatch}${h.leanTo}${h.broken}`);
      const p = runInterior(job(s), 1, 3, 'cottage');
      floors.add(p.map.theme.floor), names.add(p.map.name);
    }
    expect(kinds.size).toBe(6);
    expect(barns.size).toBe(2);
    expect(looks.size).toBeGreaterThan(12);
    expect(floors).toEqual(new Set(['planks', 'dirt', 'flagstone']));
    expect(names.size).toBeGreaterThanOrEqual(4);
  });

  it('look outside like what they are inside: the street tags each door with the seed its inside uses', () => {
    for (const s of [3, 41, 97]) {
      const j = job(s, 'village'), plan = planRoom(j, 1);
      const doors = plan.map.blocks.map((b, i) => [b, i] as const).filter(([b]) => b.door);
      expect(doors.length).toBeGreaterThan(0);
      for (const [b, i] of doors) {
        expect(b.look).toBe(houseSeed(j, 1, i));
        expect([b.w, b.h]).toEqual([3.5, 2]);
        const inside = runInterior(j, 1, i, b.door!), home = house(b.look!, b.door!);
        // A lit house outside has its fire going inside (unless the whole house is burning).
        expect(inside.map.torches.length > 0).toBe(home.lit && b.fate !== 'burning' && !!inside.map.blocks.some((q) => q.kind === 'hearth'));
        expect(!!inside.map.blaze).toBe(b.fate === 'burning');
      }
    }
  });

  it('every layout leaves the door clear and a way to everyone and everything in it', () => {
    let sleepers = 0, feeders = 0, empty = 0, butchers = 0;
    for (let s = 1; s <= 120; s++) for (const door of ['cottage', 'barn']) {
      const j = job(s * 7 + 3, 'farm', s % 5 ? 'hunt' : 'rescue', s % 4), plan = runInterior(j, s % 3, s % 4, door), m = plan.map;
      const w = walkable(plan), where = `${door} seed ${j.seed}: ${house(houseSeed(j, s % 3, s % 4), door).kind}`;
      // The way in and out: you stand clear in the doorway, and the exit is right there.
      expect(w.open(m.hero.x, m.hero.y), where).toBe(true);
      expect(inArea(m.exit, m.w / 2, m.h - 0.3), where).toBe(true);
      expect(w.reach(m.w / 2, m.h - 0.8, 0.3), where).toBe(true);
      // Most of the floor is one walkable space (no shut-off rooms).
      expect(w.reached / w.all, where).toBeGreaterThan(0.85);
      // Every goblin, every cage, every body can be got at.
      for (const f of plan.foes) expect(w.reach(f.x, f.y, 0.9), `${where}: ${f.kind} at ${f.x.toFixed(1)},${f.y.toFixed(1)}`).toBe(true);
      for (const q of plan.props.filter((q) => q.kind === 'cage')) expect(w.reach(q.x, q.y, 1.2), `${where}: cage`).toBe(true);
      for (const n of m.npcs ?? []) expect(w.reach(n.x, n.y, 1), `${where}: body`).toBe(true);
      // The fire, if lit, is in a hearth.
      for (const t of m.torches) expect(m.blocks.some((q) => q.kind === 'hearth' && q.look === 2 && inArea(q, t.x, t.y)), where).toBe(true);
      sleepers += m.sleepers?.length ?? 0;
      feeders += plan.foes.filter((f) => f.feeding && !m.sleepers?.some((q) => q.x === f.x && q.y === f.y)).length;
      butchers += plan.foes.filter((f) => f.kind === 'butcher').length;
      if (!plan.foes.length) empty++;
    }
    expect(sleepers).toBeGreaterThan(10);
    expect(feeders).toBeGreaterThan(5);
    expect(empty).toBeGreaterThan(10);
    expect(butchers).toBeGreaterThan(0);
  });
});
