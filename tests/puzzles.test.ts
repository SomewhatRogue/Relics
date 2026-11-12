/** Instance puzzles: pushing tubs (sim/tubs.ts, shared/puzzle.ts; docs/design/instance-puzzles.md). */
import { describe, expect, it } from 'vitest';
import { openCut } from '../src/shared/instances';
import { centre, cellAt, isWall, type Cell, type TubPuzzle } from '../src/shared/puzzle';
import { SORTING_ROWS } from '../src/shared/cutsorting';
import { PUZZLE, TICK } from '../src/shared/tuning';
import { newRun, runRoom, type Run } from '../src/sim/run';
import { goal } from '../src/sim/goal';
import { gateReady } from '../src/sim/stretches';
import { NO_INTENT, type Hero } from '../src/sim/types';
import type { ArenaRoom } from '../src/sim/room';
import { HERO } from '../src/shared/tuning';

/** The fewest pushes to solve it (the hero walks a ring of open floor round the grid), or null if it can't be. */
function solve(rows: string[]): number | null {
  const R = rows.length, C = rows[0].length, at = (c: number, r: number) => rows[r]?.[c];
  const walls = new Set<string>(), plates: string[] = [], tubs: string[] = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '#') walls.add(`${c},${r}`);
    if (ch === '.' || ch === '*') plates.push(`${c},${r}`);
    if (ch === '$' || ch === '*') tubs.push(`${c},${r}`);
  }));
  void at;
  const xy = (k: string) => k.split(',').map(Number) as Cell, key = (c: number, r: number) => `${c},${r}`;
  const inside = ([c, r]: Cell) => c >= 0 && r >= 0 && c < C && r < R, walk = ([c, r]: Cell) => c >= -1 && r >= -1 && c <= C && r <= R && !walls.has(key(c, r));
  const reach = (ts: Set<string>, h: Cell) => {
    const seen = new Set([key(...h)]), q = [h];
    while (q.length) {
      const [c, r] = q.pop()!;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n: Cell = [c + dc, r + dr], k = key(...n);
        if (!seen.has(k) && walk(n) && !ts.has(k)) seen.add(k), q.push(n);
      }
    }
    return seen;
  };
  const id = (ts: Set<string>, h: Cell) => [...ts].sort().join('|') + '@' + [...reach(ts, h)].sort()[0];
  const start = new Set(tubs), h0: Cell = [Math.floor(C / 2), R], dist = new Map([[id(start, h0), 0]]), q: [Set<string>, Cell, number][] = [[start, h0, 0]];
  while (q.length) {
    const [ts, h, k] = q.shift()!;
    if (plates.every((p) => ts.has(p))) return k;
    const rs = reach(ts, h);
    for (const t of ts) for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const [c, r] = xy(t), to: Cell = [c + dc, r + dr];
      if (!rs.has(key(c - dc, r - dr)) || !inside(to) || walls.has(key(...to)) || ts.has(key(...to))) continue;
      const n = new Set(ts);
      n.delete(t), n.add(key(...to));
      const s = id(n, [c, r]);
      if (!dist.has(s)) dist.set(s, k + 1), q.push([n, [c, r], k + 1]);
    }
  }
  return null;
}

describe('the sorting floor`s layout', () => {
  it('solves, in ten pushes at the least; one wrong first push strands a tub (the lever puts it right)', () => {
    expect(solve(SORTING_ROWS)).toBe(10);
    const strand = SORTING_ROWS.map((r) => [...r]);
    strand[3][4] = ' ', strand[3][5] = '$';
    expect(solve(strand.map((r) => r.join('')))).toBeNull();
  });
});

describe('pushing tubs', () => {
  const floor = (ids = ['me']) => {
    const run: Run = newRun(openCut(12));
    Object.assign(run, { index: 1, way: 1, party: ids.length });
    const room = runRoom(run), hs = ids.map((id) => room.join(id)), p = room.map.puzzles![0];
    for (const id of ids) room.setIntent(id, NO_INTENT);
    // The pack at the way in out of it; everyone up and well.
    room.enemies = [];
    hs.forEach((h) => Object.assign(h, { hp: 9999, maxHp: 9999 }));
    return { run, room, hs, p };
  };
  const tubAt = (room: ArenaRoom, p: TubPuzzle, c: Cell) => room.props.find((q) => q.kind === 'tub' && cellAt(p, q.x, q.y)[0] === c[0] && cellAt(p, q.x, q.y)[1] === c[1]);
  const push = (room: ArenaRoom, h: Hero, p: TubPuzzle, c: Cell, d: Cell, s = PUZZLE.push + 0.6) => {
    const m = centre(p, c), back = HERO.radius + 0.56 + 0.05;
    room.setIntent(h.id, { ...NO_INTENT, mx: d[0], my: d[1] });
    for (let n = 0; n < Math.round(s / TICK); n++) {
      if (n < Math.round(PUZZLE.push / TICK) + 1) Object.assign(h, { x: m.x - d[0] * back, y: m.y - d[1] * back });
      room.step();
    }
    room.setIntent(h.id, NO_INTENT);
  };

  it('lays the puzzle on the map under the hill, its tubs where they start', () => {
    const { room, p } = floor();
    expect(p.tubs.length).toBe(3);
    for (const c of p.tubs) expect(tubAt(room, p, c)).toBeTruthy();
    expect(room.map.stretches![0].puzzle).toBe(0);
  });

  it('holding the stick into a tub slides it a square; a wall or a tub stops it', () => {
    const { room, hs, p } = floor();
    push(room, hs[0], p, [2, 2], [1, 0]);
    expect(tubAt(room, p, [3, 2])).toBeTruthy();
    expect(tubAt(room, p, [2, 2])).toBeFalsy();
    // Up from (4, 1) is rock: it stays.
    expect(isWall(p, [4, 0])).toBe(true);
    push(room, hs[0], p, [4, 1], [0, -1]);
    expect(tubAt(room, p, [4, 1])).toBeTruthy();
    // A tap isn't a push.
    push(room, hs[0], p, [4, 3], [-1, 0], PUZZLE.push / 2);
    expect(tubAt(room, p, [4, 3])).toBeTruthy();
  });

  it('GRAB by the lever puts every tub back', () => {
    const { room, hs, p } = floor();
    push(room, hs[0], p, [2, 2], [1, 0]);
    Object.assign(hs[0], { x: p.lever.x + 0.6, y: p.lever.y });
    room.setIntent('me', { ...NO_INTENT, grabSeq: 1 });
    room.step(), room.step();
    for (const c of p.tubs) expect(tubAt(room, p, c)).toBeTruthy();
    expect(tubAt(room, p, [3, 2])).toBeFalsy();
  });

  it('every plate with a tub on it: solved, and the gate is ready; till then the goal says what to do', () => {
    const { run, room, p } = floor();
    expect(goal(run, room).text).toContain('tubs');
    expect(gateReady(run, room)).toBe(false);
    const tubs = room.props.filter((q) => q.kind === 'tub');
    p.plates.forEach((c, i) => Object.assign(tubs[i], centre(p, c)));
    room.step();
    expect(gateReady(run, room)).toBe(true);
    expect(goal(run, room).text).not.toContain('tubs');
  });

  it('two or more at it: goblins out of the drift while it`s worked, a few at once; alone, none', () => {
    const near = (ids: string[]) => {
      const { room, hs, p } = floor(ids);
      const m = centre(p, [3, 4]);
      for (let n = 0; n < Math.round((PUZZLE.wave.first + PUZZLE.wave.every * 4 + 0.5) / TICK); n++) {
        hs.forEach((h, i) => Object.assign(h, { x: m.x + i * 0.8, y: m.y + 2.2, hp: 9999 }));
        room.step();
      }
      return { n: room.enemies.length, at: room.enemies.every((e) => Math.hypot(e.x - p.from.x, e.y - p.from.y) < 12) };
    };
    expect(near(['me']).n).toBe(0);
    const two = near(['a', 'b']);
    expect(two.n).toBeGreaterThan(0);
    expect(two.n).toBeLessThanOrEqual(PUZZLE.wave.most);
  });
});
