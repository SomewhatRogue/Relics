/**
 * A hound that's been through a house door is drawn where it is (client/jobrooms.ts `carry`). The draw blends
 * each body from where it stood last tick (`room.prev`), and the tick keeps that for heroes, goblins and
 * survivors, never for hounds; going through a door used to write the hound's spot by the door there once, and
 * nothing moved it after. So on the screen that runs the fight (the leader's, or yours alone) the hound swept
 * from that door to where it really was, thirty times a second: far then near, gone then back. A friend's
 * screen never had it. (Kyle, 2026-11-18: "the dog would vanish and reappear multiple times a second or be VERY
 * far away and then very close on my screen but not on theirs. might have to do with host / joining".)
 */
import { describe, expect, it } from 'vitest';
import { Followers } from '../src/client/followers';
import { JobRooms } from '../src/client/jobrooms';
import { board, PLACES } from '../src/shared/jobs';
import { WEAPONS } from '../src/shared/tuning';
import { newRun, runRoom } from '../src/sim/run';

describe('a hound through a door', () => {
  it('is never drawn from where it stood at the door', () => {
    const run = newRun({ ...board(1)[0], rooms: 3, place: PLACES.find((p) => p.kind === 'village')!, objective: 'rescue', seed: 77 });
    const street = runRoom(run), rooms = new JobRooms(new Followers());
    rooms.reset(street);
    const h = street.join('me');
    h.weapon = Object.keys(WEAPONS).find((k) => WEAPONS[k as keyof typeof WEAPONS].cls === 'RANGER') as typeof h.weapon;
    h.safeT = 1e9;
    street.step();
    expect(h.hound).toBeTruthy();
    const door = street.map.blocks.find((b) => b.door && !b.ruined && !b.locked && (b.burning ?? -1) < 0)!;
    expect(door).toBeTruthy();
    // In at the door and out again, then two seconds' walk down the street with the hound at heel.
    const inside = rooms.goIn(run, h, door)!;
    expect(inside).toBeTruthy();
    for (let i = 0; i < 10; i++) inside.step();
    expect(rooms.comeOut(h)).toBe(street);
    const from = { x: h.x, y: h.y }, dir = h.x < street.map.w / 2 ? 1 : -1;
    for (let i = 0; i < 60; i++) (h.x += 0.12 * dir), street.step();
    expect(Math.hypot(h.x - from.x, h.y - from.y)).toBeGreaterThan(5);
    for (const room of [street, inside]) {
      // What the draw blends the hound from, in each room it has been in: nothing, or where it was a tick ago.
      const p = room.prev.get('d:me');
      if (p && room.heroes.includes(h)) expect(Math.hypot(p[0] - h.hound!.x, p[1] - h.hound!.y)).toBeLessThan(0.6);
    }
  });
});
