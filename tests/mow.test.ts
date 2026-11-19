/**
 * A melee swing cuts down standing rye and reeds (sim/buildings.ts `sweepBlocks`; Kyle, 2026-11-19): what is in the
 * swing is cut for good and says so once, what is out of reach or behind you stands, and a cut block is still
 * nothing you bump into.
 */
import { describe, expect, it } from 'vitest';
import { solid } from '../src/shared/arena';
import { landJob } from '../src/shared/territory';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

describe('mowing', () => {
  it('a sword swing cuts the rye in front of it and leaves the rest standing', () => {
    const run = newRun(landJob('lowfurrow', 3)), room = runRoom(run), h = room.join('me');
    for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead' });
    // (The fields' rye is its `reeds` blocks with `look` 1000 and up; the pond's reeds are the others.)
    const all = room.map.blocks.filter((b) => b.kind === 'reeds'), rye = all.filter((b) => (b.look ?? 0) >= 1000);
    expect(rye.length).toBeGreaterThan(100);
    expect(all.every((b) => b.soft && !b.ruined)).toBe(true);
    // Stand just south of one and swing north into it.
    const t = rye[Math.floor(rye.length / 2)], cx = t.x + t.w / 2;
    Object.assign(h, { x: cx, y: t.y + t.h + 0.5, fx: 0, fy: -1, safeT: 99 });
    const mows: unknown[] = [];
    for (let i = 0; i < 40; i++) {
      room.setIntent(h.id, { ...NO_INTENT, attack: i < 3, attackSeq: 1, ax: 0, ay: -1 });
      room.step();
      mows.push(...room.events.filter((e) => e.k === 'mow'));
    }
    expect(t.ruined).toBe(true);
    const cut = all.filter((b) => b.ruined);
    expect(mows.length).toBe(cut.length);
    // Only what the swing reached: everything cut is within a few tiles, and nothing behind the hero is.
    for (const b of cut) expect(Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - h.y)).toBeLessThan(4);
    expect(cut.every((b) => b.y < h.y)).toBe(true);
    expect(cut.length).toBeLessThan(30);
    expect(cut.some((b) => solid(b))).toBe(false);
  });
});
