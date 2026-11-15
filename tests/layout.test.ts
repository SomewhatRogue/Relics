import { describe, expect, it } from 'vitest';
import { collide, levelAt, useMap, type GameMap } from '../src/shared/arena';

/** A body walking: small steps toward (tx, ty), colliding each step. */
function walk(b: { x: number; y: number; z: number }, tx: number, ty: number, steps = 200) {
  for (let i = 0; i < steps; i++) {
    const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
    if (d < 0.05) break;
    b.x += (dx / d) * Math.min(0.1, d);
    b.y += (dy / d) * Math.min(0.1, d);
    collide(b, 0.32);
  }
  return b;
}

// Three levels, as the new town: the ground (0), a terrace (1) from y 10 down, a hill (2) on it from y 16; steps
// up each edge at x 4 to 6.
const STACK: GameMap = {
  name: 'T', w: 20, h: 30, wallFace: 3, rounds: [], blocks: [], braziers: [], torches: [], hero: { x: 5, y: 5 }, exit: null,
  theme: { floor: 'cobble', back: 'stone', ambient: [0.3, 0.3, 0.3], moon: 0 },
  ledges: [
    { x: 0, y: 10, w: 20, h: 20, ramps: [{ x: 4, y: 8.5, w: 2, h: 3 }] },
    { x: 0, y: 16, w: 20, h: 14, lv: 2, ramps: [{ x: 4, y: 14.5, w: 2, h: 3 }] },
  ],
};

describe('stacked levels', () => {
  it('stands you on the highest ledge under you', () => {
    expect([levelAt(STACK, 10, 5), levelAt(STACK, 10, 12), levelAt(STACK, 10, 20)]).toEqual([0, 1, 2]);
  });

  it('walls you off from below, takes you up the steps, and drops you off an edge', () => {
    useMap(STACK);
    expect(walk({ x: 10, y: 5, z: 0 }, 10, 20).y).toBeLessThan(10);
    const up = walk(walk(walk({ x: 5, y: 5, z: 0 }, 5, 13), 5, 20), 10, 20);
    expect([up.z, Math.round(up.y)]).toEqual([2, 20]);
    // On the terrace, the hill's edge is a wall too.
    expect(walk({ x: 10, y: 13, z: 1 }, 10, 20).y).toBeLessThan(16);
    // Off the hill's edge (away from the steps): down a level, then down again.
    const off = walk({ x: 10, y: 20, z: 2 }, 10, 13);
    expect(off.z).toBe(1);
    expect(walk(off, 10, 5).z).toBe(0);
  });

  it('settles someone set down inside a raised level onto it, only where the map says so', () => {
    useMap({ ...STACK, settle: true });
    const p = { x: 10, y: 22, z: 0 };
    collide(p, 0.32);
    expect([p.z, p.y]).toEqual([2, 22]);
    useMap(STACK);
    const q = { x: 10, y: 22, z: 0 };
    collide(q, 0.32);
    expect(q.z).toBe(0);
  });
});

// The new town itself (docs/design/town-layout.md).
import { doorAt, inRamp, npcAt } from '../src/shared/arena';
import { CHAPTER_1, newWorld } from '../src/shared/story';
import { LAYOUT, SPOT_REACH, oldTown, townMap, townProps, townSpots } from '../src/shared/town';
import { WORKS } from '../src/shared/works';

const ready = () => Object.assign(newWorld(), { rescued: 6, storyDone: [CHAPTER_1.goals.story] });
const WORLDS = () => [newWorld(), { ...ready(), works: { watch: 400, oldquarter: 600 }, flags: { 'north-fields': 'refugees' } }, { ...ready(), rescued: 16, works: Object.fromEntries(Object.keys(WORKS).map((k) => [k, 9999])), flags: { 'north-fields': 'farm' } }];

/** Where a body can walk to from where you arrive, on a quarter-tile grid, minding levels, steps and drops. */
function walkable(m: GameMap) {
  useMap(m);
  const C = 0.25, cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), lv = new Int8Array(cols * rows).fill(-1);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = (i + 0.5) * C, y = (j + 0.5) * C, z = levelAt(m, x, y), p = { x, y, z };
    collide(p, 0.32);
    if (Math.hypot(p.x - x, p.y - y) < 0.02) lv[j * cols + i] = z;
  }
  const seen = new Uint8Array(cols * rows), at = (x: number, y: number) => Math.floor(y / C) * cols + Math.floor(x / C);
  const q = [at(m.hero.x, m.hero.y)];
  seen[q[0]] = 1;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], i = c % cols, j = (c / cols) | 0, ramp = inRamp(m, (i + 0.5) * C, (j + 0.5) * C);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (j + dj) * cols + i + di;
      if (i + di < 0 || j + dj < 0 || i + di >= cols || j + dj >= rows || seen[k] || lv[k] < 0) continue;
      // Same level, on the steps, or dropping down: never up a wall.
      if (lv[k] > lv[c] && !ramp && !inRamp(m, (i + di + 0.5) * C, (j + dj + 0.5) * C)) continue;
      seen[k] = 1, q.push(k);
    }
  }
  const near = (x: number, y: number, r: number) => {
    for (let j = Math.floor((y - r) / C); j <= Math.floor((y + r) / C); j++) for (let i = Math.floor((x - r) / C); i <= Math.floor((x + r) / C); i++)
      if (i >= 0 && j >= 0 && i < cols && j < rows && seen[j * cols + i] && Math.hypot((i + 0.5) * C - x, (j + 0.5) * C - y) <= r) return true;
    return false;
  };
  return near;
}

describe('the new town', () => {
  it('is today\'s town until a screen asks for it', () => {
    expect(townMap(newWorld()).w).toBe(oldTown(newWorld()).w);
  });

  it('every spot, door and person standing still can be reached from where you arrive, up and down the steps', () => {
    LAYOUT.on = true;
    try {
      for (const w of WORLDS()) {
        const m = townMap(w), near = walkable(m), miss: string[] = [];
        for (const s of townSpots(w)) if (!near(s.x, s.y, SPOT_REACH)) miss.push('spot ' + s.label);
        for (const b of m.blocks) if (b.door && !b.locked && !near(doorAt(b).x, doorAt(b).y, 0.6)) miss.push('door ' + b.door);
        for (const n of m.npcs ?? []) if (!n.path && !n.mute && !near(n.x, n.y, SPOT_REACH)) miss.push('person ' + n.name);
        expect(miss).toEqual([]);
      }
    } finally {
      LAYOUT.on = false;
    }
  });

  it('keeps every door, its interior, and the people the old town has', () => {
    LAYOUT.on = true;
    try {
      for (const w of WORLDS()) {
        const m = townMap(w), old = oldTown(w);
        expect(m.blocks.filter((b) => b.door).map((b) => b.door).sort()).toEqual(old.blocks.filter((b) => b.door).map((b) => b.door).sort());
        const left = (old.npcs ?? []).map((n) => n.name).filter((n) => !m.npcs!.some((x) => x.name === n));
        expect(left).toEqual([]);
        expect(townProps().length).toBeGreaterThan(5);
      }
    } finally {
      LAYOUT.on = false;
    }
  });

  it('the rounds walk clear lanes, and nothing stands inside a building', () => {
    LAYOUT.on = true;
    try {
      for (const w of WORLDS()) {
        const m = townMap(w), bad: string[] = [];
        useMap(m);
        const inBlock = (x: number, y: number, r: number) => m.blocks.some((b) => b.kind !== 'fence' && x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r);
        for (const n of m.npcs ?? []) for (let t = 0; t < 160; t += 0.5) {
          const at = npcAt(n, t);
          if (inBlock(at.x, at.y, 0.05)) (bad.push(`${n.name} at ${at.x.toFixed(1)},${at.y.toFixed(1)}`), (t = 999));
          if (!n.path) break;
        }
        for (const o of m.rounds) if (o.r > 0.05 && inBlock(o.x, o.y, -0.05)) bad.push(`${o.kind} at ${o.x.toFixed(1)},${o.y.toFixed(1)}`);
        expect(bad).toEqual([]);
      }
    } finally {
      LAYOUT.on = false;
    }
  });
});
