/** THE LAMPMAN in the lamp room, under the hill (sim/lampman.ts, shared/cutlamproom.ts). */
import { describe, expect, it } from 'vitest';
import { openCut } from '../src/shared/instances';
import { CUT_NAMES, LAMP_WORDS } from '../src/shared/opencutwords';
import { INSTANCE, LAMP, TICK } from '../src/shared/tuning';
import { newRun, runRoom } from '../src/sim/run';
import { goal } from '../src/sim/goal';
import { NO_INTENT } from '../src/sim/types';
import type { ArenaRoom } from '../src/sim/room';

const lampRoom = () => {
  const run = newRun(openCut(12));
  Object.assign(run, { index: 1, way: 1, party: 1, stretch: 1 });
  const room = runRoom(run), h = room.join('me'), e = room.enemies.find((x) => x.name === CUT_NAMES.lampman)!, L = room.map.lamps!;
  room.setIntent('me', NO_INTENT);
  room.enemies = room.enemies.filter((x) => x === e);
  Object.assign(h, { hp: 9999, maxHp: 9999 });
  return { run, room, h, e, L };
};
const step = (room: ArenaRoom, s: number, each = () => {}) => {
  const seen: { k: string; what?: string }[] = [];
  for (let n = 0; n < Math.round(s / TICK); n++) each(), room.step(), seen.push(...(room.events as typeof seen));
  return seen;
};

describe('THE LAMPMAN', () => {
  it('keeps six lamps round its room, all lit when you come in', () => {
    const { e, L } = lampRoom();
    expect(L.length).toBe(6);
    expect(e.lamps!.lit).toEqual(L.map(() => true));
  });

  it('roused, goes for the lit lamp nearest you and puts it out', () => {
    const { room, h, e, L } = lampRoom();
    // Stood by lamp 0, a little in from it.
    const near = L[0];
    const seen = step(room, LAMP.first + 6, () => Object.assign(h, { x: near.x - 1.2, y: near.y + 1.6, hp: 9999 }));
    expect(e.alert).toBe(true);
    expect(seen.some((x) => x.k === 'lamp' && x.what === 'snuff')).toBe(true);
    expect(e.lamps!.lit[0]).toBe(false);
    expect(seen.some((x) => x.k === 'lamp' && x.what === 'how')).toBe(true);
    expect(e.lamps!.lit.filter(Boolean).length).toBe(5);
  });

  it('hits harder where no lamp lights it', () => {
    const { room, h, e } = lampRoom();
    const base = e.harm ?? 1;
    Object.assign(h, { x: e.x, y: e.y + 6 });
    room.step();
    expect(e.harm).toBeCloseTo(base);
    e.lamps!.lit = e.lamps!.lit.map(() => false);
    room.step();
    expect(e.harm).toBeCloseTo(base * LAMP.dark);
  });

  it('GRAB by a dark lamp lights it; with the Lampman in its light, it`s dazzled: stunned and OPEN', () => {
    const { room, h, e, L } = lampRoom();
    e.lamps!.lit[3] = false;
    Object.assign(e, { x: L[3].x + 1.5, y: L[3].y, alert: true });
    Object.assign(h, { x: L[3].x - 0.6, y: L[3].y });
    room.step();
    room.setIntent('me', { ...NO_INTENT, grabSeq: 1 });
    room.step(), room.step();
    expect(e.lamps!.lit[3]).toBe(true);
    expect(e.act).toBe('stunned');
    expect(e.takes).toBe(INSTANCE.open.mult);
  });

  it('the goal says how: BURN a dark lamp beside it', () => {
    const { run, room } = lampRoom();
    expect(goal(run, room).text).toContain(LAMP_WORDS.goal);
  });
});
