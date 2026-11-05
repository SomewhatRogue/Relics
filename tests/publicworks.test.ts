import { describe, expect, it } from 'vitest';
import { npcAt } from '../src/shared/arena';
import { stopsAt } from '../src/shared/npcstops';
import { publicWorks } from '../src/shared/publicworks';
import { FOREMAN } from '../src/shared/mendlines';
import { SPOTS, townMap } from '../src/shared/town';
import { newWorld } from '../src/shared/story';
import { WORKS } from '../src/shared/works';
import { Game } from '../src/client/game';

describe('the public works', () => {
  it('is PUBLIC WORKS on the spot and the stall, and Foreman Judd talks for the board', () => {
    expect(SPOTS.find((s) => s.id === 'works')!.label).toBe('PUBLIC WORKS');
    const m = townMap(newWorld());
    expect(m.blocks.some((b) => b.kind === 'stall' && b.label === 'PUBLIC WORKS')).toBe(true);
    const judd = m.npcs!.find((n) => n.name === FOREMAN.name)!;
    expect(judd.talk).toBe('works');
    expect(judd.mute).not.toBe(true);
    expect(JSON.stringify(FOREMAN)).not.toMatch(/—|–/);
  });

  it('talking to Judd is the way to the board', () => {
    const g = new Game();
    g.create('WARRIOR', 'b');
    g.skipWood();
    const judd = g.room.map.npcs!.find((n) => n.name === FOREMAN.name)!;
    Object.assign(g.hero, { x: judd.x - 0.5, y: judd.y + 0.3 });
    expect(g.near()?.talk).toBe('works');
  });

  it('his crew sweep, haul and shovel on short loops, stop to work, and are in the background', () => {
    const crew = publicWorks(newWorld()).filter((n) => n.mute);
    expect(crew.map((n) => n.work).sort()).toEqual(['haul', 'shovel', 'sweep']);
    for (const n of crew) {
      expect(n.clock).toBe(true);
      let still = 0, moving = 0;
      for (let t = 0; t < 120; t += 0.25) (npcAt(n, t).still ? still++ : moving++);
      expect(still).toBeGreaterThan(0);
      expect(moving).toBeGreaterThan(0);
      // Short loops: never far from where they start.
      for (const [x, y] of n.path!) expect(Math.hypot(x - n.x, y - n.y)).toBeLessThan(7);
    }
    // The rubble's gone once the Old Quarter is cleared, and so is the one shovelling it.
    const cleared = publicWorks({ ...newWorld(), works: { oldquarter: WORKS.oldquarter.need } });
    expect(cleared.some((n) => n.work === 'shovel')).toBe(false);
  });

  it('a round with stops is the same at the same time, and stands at its corners', () => {
    const p: [number, number][] = [[0, 0], [4, 0]];
    expect(stopsAt(p, [2, 1], 1, 0.5)).toMatchObject({ x: 0, y: 0, still: true });
    expect(stopsAt(p, [2, 1], 1, 4)).toMatchObject({ x: 2, y: 0 });
    expect(stopsAt(p, [2, 1], 1, 6.5)).toMatchObject({ x: 4, still: true });
    expect(stopsAt(p, [2, 1], 1, 11 + 4)).toEqual(stopsAt(p, [2, 1], 1, 4));
    expect(stopsAt(p, [2, 1], 1, 1.76e9)).toEqual(stopsAt(p, [2, 1], 1, 1.76e9));
  });
});
