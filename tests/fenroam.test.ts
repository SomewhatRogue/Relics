/**
 * The Fen (shared/fenroam*.ts; docs/design/the-fen.md): the plan is the seed's alone, its zones and its shelter are
 * there, a hero walks from the way in to the staithe and on to the Peat Cuts by the game's own collide(), nothing
 * starts in the staithe's ring or the water, every gather can be stood on, the chapel stands as its one landmark,
 * and the two lands link both ways.
 */
import { describe, expect, it } from 'vitest';
import { collide, useMap, type GameMap } from '../src/shared/arena';
import { FENROAM, STAITHE_NAME } from '../src/shared/fenroam';
import { fenRoamAt } from '../src/shared/fenroamground';
import { LARDER, MAIN, WAY_IN } from '../src/shared/fenroamland';
import { knownLand, landJob, territoryPlan, type TerrPlan } from '../src/shared/territory';
import { BOUNTIES, FEN_BOUNTIES, FEN_LEVEL, bountyOf, postedFor, take } from '../src/shared/bounties';
import { BACKWARD, ONWARD, wayOf } from '../src/shared/landlinks';
import { newProfile } from '../src/shared/progress';
import { newRun, runRoom } from '../src/sim/run';

const plan = (day = 3): TerrPlan => territoryPlan(landJob('fenroam', day));
const C = 0.5, R = 0.45;
type P = { x: number; y: number };

/** Every half-tile cell a hero can stand in, flooded from `from` with collide() itself. */
function walkable(m: GameMap, from: P): (p: P) => boolean {
  useMap(m);
  const cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), seen = new Set<number>(), q: number[] = [];
  const start = Math.floor(from.y / C) * cols + Math.floor(from.x / C);
  seen.add(start), q.push(start);
  for (let h = 0; h < q.length; h++) {
    const s = q[h], i = s % cols, j = (s - i) / cols;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj, n = nj * cols + ni;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows || seen.has(n)) continue;
      const x = (ni + 0.5) * C, y = (nj + 0.5) * C, p = { x, y };
      collide(p, R);
      if (Math.hypot(p.x - x, p.y - y) > 0.02) continue;
      seen.add(n), q.push(n);
    }
  }
  return (p) => [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]].some(([dx, dy]) => seen.has(Math.floor((p.y + dy) / C) * cols + Math.floor((p.x + dx) / C)));
}

describe('the Fen', () => {
  it('builds for three seeds, the same twice for one, and is a roaming land', () => {
    for (const d of [3, 17, 41]) expect(plan(d).foes.length).toBeGreaterThan(35);
    expect(plan(3)).toEqual(plan(3));
    expect(plan(3).map.blocks.filter((b) => b.kind === 'reeds')).not.toEqual(plan(41).map.blocks.filter((b) => b.kind === 'reeds'));
    expect(knownLand('fenroam')).toBe(true);
    expect(landJob('fenroam', 3).roam).toBe(true);
    expect(landJob('fenroam', 3).title).toBe('The Fen');
  });

  it('is 60 by 100, one stretch, no gate, six parts south to north, the staithe its shelter', () => {
    const p = plan(), m = p.map;
    expect([m.w, m.h]).toEqual([FENROAM.w, FENROAM.h]);
    expect(m.name).toBe('THE FEN');
    expect(m.stretches).toHaveLength(1);
    expect(m.blocks.some((b) => b.kind === 'gate')).toBe(false);
    expect(p.zones.map((z) => z.name)).toEqual(['THE BOG EDGE', 'THE CAUSEWAYS', STAITHE_NAME, 'THE WIDE REEDS', 'THE DROWNED CHAPEL', 'THE PEAT CUTS']);
    expect(p.zones.map((z) => z.y)).toEqual([...p.zones.map((z) => z.y)].sort((a, b) => b - a));
    expect(m.stations!.map((s) => s.name)).toEqual([STAITHE_NAME]);
  });

  it('can be walked from the way in to the staithe and on to the larder, and the way in is open ground', () => {
    for (const d of [3, 17, 41]) {
      const m = plan(d).map, can = walkable(m, m.hero), s = m.stations![0];
      expect(m.hero).toEqual(WAY_IN);
      expect(can(s), `staithe ${d}`).toBe(true);
      for (const q of MAIN.slice(1, -1)) expect(can(q), `track at ${q.x}, ${q.y} ${d}`).toBe(true);
      expect(can({ x: LARDER.x, y: LARDER.y + 1.6 }), `larder ${d}`).toBe(true);
      for (const g of m.gathers!) expect(can(g), `${g.mat} at ${g.x}, ${g.y}`).toBe(true);
      for (const c of plan(d).chests) expect(can(c), `chest at ${c.x}, ${c.y}`).toBe(true);
    }
  });

  it('starts no foe in the water, in anything solid, by the way in or in the staithe\'s ring', () => {
    const p = plan(), m = p.map, s = m.stations![0];
    useMap(m);
    for (const f of p.foes) {
      const at = `${f.role ?? f.kind} ${f.pack} at ${f.x}, ${f.y}`;
      expect(fenRoamAt(f.x, f.y), at).not.toBe(2);
      expect(Math.hypot(f.x - s.x, f.y - s.y), at).toBeGreaterThan(9);
      expect(Math.hypot(f.x - m.hero.x, f.y - m.hero.y), at).toBeGreaterThan(10);
      expect(f.y, at).toBeLessThan(88);
      const q = { x: f.x, y: f.y };
      collide(q, 0.4);
      expect(Math.hypot(q.x - f.x, q.y - f.y), at).toBeLessThan(0.05);
    }
    expect(new Set(p.foes.map((f) => f.pack)).size).toBe(11);
  });

  it('has the staithe\'s keeper, fire and smokehouse in its ring, open at its centre', () => {
    const m = plan().map, s = m.stations![0];
    expect(m.npcs!.some((n) => n.talk === 'station:staithe' && n.name === 'KEEPER' && !n.mute && Math.hypot(n.x - s.x, n.y - s.y) < s.r)).toBe(true);
    expect(m.braziers.some((b) => b.wild && Math.hypot(b.x - s.x, b.y - s.y) < s.r)).toBe(true);
    expect(m.blocks.some((b) => b.kind === 'smokehouse' && Math.hypot(b.x + b.w / 2 - s.x, b.y + b.h / 2 - s.y) < s.r)).toBe(true);
    useMap(m);
    const c = { x: s.x, y: s.y };
    collide(c, R);
    expect(Math.hypot(c.x - s.x, c.y - s.y)).toBeLessThan(0.02);
  });

  it('has the drowned chapel as its one landmark, solid, standing in the water toward the north end, and its echoes', () => {
    for (const d of [3, 17]) {
      const m = plan(d).map, ch = m.blocks.filter((b) => b.kind === 'chapel');
      expect(ch).toHaveLength(1);
      const c = ch[0], mid = { x: c.x + c.w / 2, y: c.y + c.h / 2 };
      expect(mid.y).toBeLessThan(30);
      expect(c.w).toBeGreaterThanOrEqual(6);
      expect(fenRoamAt(c.x - 0.5, mid.y)).toBe(1);
      useMap(m);
      const q = { ...mid };
      collide(q, R);
      expect(Math.hypot(q.x - mid.x, q.y - mid.y)).toBeGreaterThan(0.2);
      const echoes = m.blocks.filter((b) => b.kind === 'awash');
      expect(echoes.length).toBeGreaterThanOrEqual(10);
      expect(new Set(echoes.map((b) => b.look))).toEqual(new Set([0, 1, 2]));
    }
  });

  it('lays black peat on the cuts after the larder, clay and mint at the water', () => {
    const g = plan().map.gathers!;
    expect(g.filter((x) => x.mat === 'peat').map((x) => x.after ?? x.chance)).toEqual([460, 0.15]);
    expect(g.filter((x) => x.mat === 'clay')).toHaveLength(2);
    expect(g.filter((x) => x.mat === 'mint')).toHaveLength(2);
  });

  it('posts the fen\'s bounties from level 6, each n what the map places', () => {
    for (const day of [3, 17]) {
      const foes = plan(day).foes;
      for (const b of FEN_BOUNTIES) expect(foes.filter((f) => f.pack !== undefined && b.packs.includes(f.pack) && (!b.kinds || b.kinds.includes(f.kind))).length, b.id).toBe(b.n);
    }
    expect(BOUNTIES.map((b) => b.id)).toEqual(['wolves', 'den', 'nest', 'raiders', 'snarers']);
    for (const b of FEN_BOUNTIES) expect(bountyOf(b.id)).toBe(b);
    expect(postedFor(4, FEN_LEVEL - 1)).toHaveLength(2);
    const day = 4, fen = postedFor(day, FEN_LEVEL)[2];
    expect(FEN_BOUNTIES).toContain(fen);
    const p = newProfile('WARRIOR', 'X');
    p.level = FEN_LEVEL - 1;
    expect(take(p, fen.id, day)).toBe(false);
    p.level = FEN_LEVEL;
    expect(take(p, fen.id, day)).toBe(true);
  });

  it('links to the north fields both ways: on from their far end, back to it from the fen\'s way in', () => {
    const on = ONWARD.gatefields!, back = BACKWARD.fenroam!, fields = territoryPlan(landJob('gatefields', 3)).map;
    expect(on.to).toBe('fenroam');
    expect([back.to, back.at]).toEqual(['gatefields', 'NORTH END']);
    const end = wayOf('gatefields', back.at)!, can = walkable(fields, fields.hero);
    expect(can(on.from) && can(end)).toBe(true);
    // The far end is in the fields' way out, and the arrival close enough to it not to be far (asked only once walked off).
    const ex = fields.exit!;
    expect(on.from.x >= ex.x - 0.5 && on.from.x <= ex.x + ex.w && on.from.y < 1.5).toBe(true);
    expect(Math.hypot(end.x - on.from.x, end.y - on.from.y)).toBeLessThan(2.2);
    // A run onto the fen starts at its way in; one back onto the fields at their far end, a fall waking there too.
    const into = runRoom(newRun(landJob(on.to, 3)));
    expect(into.map.hero).toEqual(WAY_IN);
    const run = newRun({ ...landJob(back.to, 3), at: back.at }), home = runRoom(run);
    expect(home.map.hero).toEqual(end);
    expect(run.rest).toBeUndefined();
    // Out to the staithe from town: the run starts in its ring.
    const st = newRun({ ...landJob('fenroam', 3), at: STAITHE_NAME }), r = runRoom(st), s = r.map.stations![0];
    expect(Math.hypot(r.map.hero.x - s.x, r.map.hero.y - s.y)).toBeLessThan(s.r);
  });
});
