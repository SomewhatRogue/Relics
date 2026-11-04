/** Places laid out to a plan: every sort generates, the same place is the same, and nothing is cut off. */
import { describe, expect, it } from 'vitest';
import { doorAt } from '../src/shared/arena';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { placeSeed, siteOf, type SiteKind } from '../src/shared/sites';
import { planRoom, type RoadId } from '../src/shared/terrain';
import { walkable } from './walk';

const job = (name: string, seed: number, o: Partial<Job> = {}): Job => ({ ...board(1)[0], rooms: 3, objective: 'hunt', seed, ...o, place: PLACES.find((p) => p.name === name)! });
const SORTS: SiteKind[] = ['green', 'farmstead', 'fields', 'camp', 'street', 'manor', 'ruinvillage', 'wood', 'mine', 'sheepwash', 'peat', 'carr'];

describe('places', () => {
  it('every place on the board has a sort of its own, and every sort is somewhere', () => {
    expect(new Set(PLACES.map(siteOf))).toEqual(new Set(SORTS));
    expect(siteOf({ name: 'Nowhere', kind: 'ruins', region: 'Fenmere', ruin: 1 })).toBe('ruinvillage');
  });

  it('an old saved job: the same place is laid out the same whatever the job; another room of it is another part of it', () => {
    // Routed jobs vary their approach rooms on purpose (tests/route.test.ts); an old one keeps its place's plan in every room.
    for (const p of PLACES) {
      const a = planRoom(job(p.name, 11, { layout: undefined }), 1).map, b = planRoom(job(p.name, 977, { objective: 'rescue', layout: undefined }), 1).map;
      expect(JSON.stringify(a.soil), p.name).toBe(JSON.stringify(b.soil));
      expect(a.theme.floor).toBe(b.theme.floor);
      expect(JSON.stringify(planRoom(job(p.name, 11, { layout: undefined }), 1).map)).toBe(JSON.stringify(a));
      expect(placeSeed(p, 0)).not.toBe(placeSeed(p, 1));
    }
    const green = planRoom(job('Barrowby', 3, { layout: undefined }), 0).map;
    expect(green.theme.floor).toBe('grass');
    expect(green.blocks.filter((b) => b.kind === 'house').length).toBeGreaterThanOrEqual(3);
    expect(green.rounds.some((r) => r.kind === 'well')).toBe(true);
    expect(planRoom(job('Fennick Ford', 3, { layout: undefined }), 0).map.blocks.some((b) => b.style === 'stone')).toBe(true);
    expect(planRoom(job('The Charcoal Camps', 3, { layout: undefined }), 0).map.blocks.filter((b) => b.kind === 'shack' || b.kind === 'tent').length).toBeGreaterThanOrEqual(6);
  });

  it('in every place, for every job: the way in, the way out and everything the job needs can be walked to', () => {
    const objectives: Job['objective'][] = ['hunt', 'rescue', 'larder', 'burn', 'story'];
    for (const p of PLACES) for (let s = 1; s <= 5; s++) for (const index of [0, 1, 2]) {
      const o = objectives[(s + index) % objectives.length], road: RoadId | undefined = index === 2 ? (s % 2 ? 'high' : 'low') : undefined;
      const j = job(p.name, s * 37 + index, { objective: o, rooms: 3 }), plan = planRoom(j, index, road), m = plan.map, w = walkable(plan);
      const where = `${p.name} seed ${j.seed} room ${index} ${o}${road ? ' ' + road : ''}`;
      expect(w.open(m.hero.x, m.hero.y), where).toBe(true);
      for (const a of m.exit ? [m.exit] : m.roads!.map((r) => r.area)) expect(w.reach(a.x + a.w / 2, a.y + a.h, 1.2), `${where}: the way out`).toBe(true);
      for (const q of plan.props.filter((q) => q.kind === 'cage' || q.kind === 'larder')) expect(w.reach(q.x, q.y, 1.3), `${where}: ${q.kind}`).toBe(true);
      for (const f of plan.foes) if (!f.z) expect(w.reach(f.x, f.y, 1.2), `${where}: ${f.kind} at ${f.x.toFixed(1)},${f.y.toFixed(1)}`).toBe(true);
      for (const c of plan.chests) expect(w.reach(c.x, c.y, 1.3), `${where}: chest`).toBe(true);
      for (const b of m.blocks) if (b.door || b.kind === 'den') expect(w.reach(doorAt(b).x, doorAt(b).y, 1), `${where}: ${b.kind} door`).toBe(true);
      // Most of the ground is one walkable space.
      expect(w.reached / w.all, where).toBeGreaterThan(0.75);
    }
  }, 120000);

  it('the objectives still fit: three dens to burn, the cages, the larder racks', () => {
    for (const p of PLACES) {
      const burn = planRoom(job(p.name, 5, { objective: 'burn' }), 2).map;
      expect(burn.blocks.filter((b) => b.kind === 'den').length, p.name).toBe(3);
      const rescue = planRoom(job(p.name, 5, { objective: 'rescue' }), 2);
      expect(rescue.props.filter((q) => q.kind === 'cage').length, p.name).toBe(2);
    }
  });
});
