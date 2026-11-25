/** Old Merren (docs/design/element-augments.md): where he stands, who his errand finds, and the charcoal at the hut. */
import { afterAll, describe, expect, it } from 'vitest';
import { MERREN_WAITS, LAYOUT, townMap } from '../src/shared/town';
import { newProfile } from '../src/shared/progress';
import { giveMerren, merrenDue, merrenSeen, openErrands, told } from '../src/shared/errands';
import { COAL_STATION, SHELTER } from '../src/shared/shelter';
import { landJob } from '../src/shared/territory';
import { GEAR } from '../src/sim/pack';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT, type FightEvent } from '../src/sim/types';
import { newWorld } from '../src/shared/story';
import { collide, useMap } from '../src/shared/arena';

afterAll(() => void (LAYOUT.town = false));

/** A hero (radius 0.3) can walk from `a` to `b` on the map: a flood over a quarter-unit grid, by the room's own collide. */
function walk(m: ReturnType<typeof townMap>, a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  const C = 0.25, W = Math.ceil(m.w / C), H = Math.ceil(m.h / C), seen = new Uint8Array(W * H), ok = (i: number, j: number) => {
    const p = { x: (i + 0.5) * C, y: (j + 0.5) * C };
    collide(p, 0.3);
    return Math.hypot(p.x - (i + 0.5) * C, p.y - (j + 0.5) * C) < 0.01;
  };
  const [ei, ej] = [Math.floor(b.x / C), Math.floor(b.y / C)], q = [Math.floor(a.x / C) + Math.floor(a.y / C) * W];
  seen[q[0]] = 1;
  for (let h = 0; h < q.length; h++) {
    const i = q[h] % W, j = (q[h] / W) | 0;
    if (i === ei && j === ej) return true;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj, k = ni + nj * W;
      if (ni < 0 || nj < 0 || ni >= W || nj >= H || seen[k] || !ok(ni, nj)) continue;
      seen[k] = 1, q.push(k);
    }
  }
  return false;
}

describe('where Old Merren stands', () => {
  for (const town of [false, true]) {
    it(`${town ? 'new' : 'old'} town: street side of the rubble before, past the wall after, never inside a block`, () => {
      LAYOUT.town = town;
      const before = townMap(newWorld()), after = townMap({ ...newWorld(), works: { oldquarter: 600 } } as any);
      const at = (m: ReturnType<typeof townMap>) => m.npcs!.find((n) => n.name === 'OLD MERREN')!;
      const a = at(before), b = at(after);
      expect(a.talk).toBe('merren');
      expect(a.x).toBeLessThan(54);
      expect(b.x).toBeGreaterThan(55);
      for (const [full, n] of [[before, a], [after, b]] as const) {
        // (A standing person is solid: the map without him, to ask about the ground he stands on.)
        const m = { ...full, npcs: full.npcs!.filter((x) => x !== n) };
        useMap(m);
        const p = { x: n.x, y: n.y };
        collide(p, 0.3);
        expect(Math.hypot(p.x - n.x, p.y - n.y)).toBeLessThan(0.01);
        expect(walk(m, m.hero, n), JSON.stringify([town, full === before, m.hero, n.x, n.y])).toBe(true);
      }
      if (!town) expect([a.x, a.y]).toEqual(MERREN_WAITS);
    });
  }
});

describe('the errand to Old Merren', () => {
  const hero = (cls: Parameters<typeof newProfile>[0], level: number) => {
    const p = { ...newProfile(cls, 'T'), prologue: true, level };
    told(p);
    return p;
  };
  it('is given at level 5 to a Warrior, once, and ticked by his panel', () => {
    const p = hero('WARRIOR', 5);
    expect(merrenDue(p)).toBe(true);
    expect(giveMerren(p)).toBe(true);
    expect(openErrands(p)).toContain('merren');
    expect(giveMerren(p)).toBe(false);
    expect(merrenSeen(p)).toBe(true);
    expect(openErrands(p)).not.toContain('merren');
    expect(merrenDue(p)).toBe(false);
  });
  it('never to a Mage, nor below level 5, nor before the runner has been', () => {
    expect(giveMerren(hero('MAGE', 9))).toBe(false);
    expect(giveMerren(hero('WARRIOR', 4))).toBe(false);
    expect(giveMerren({ ...newProfile('WARRIOR', 'T'), prologue: true, level: 5 })).toBe(false);
  });
});

describe('charcoal at the Charcoal Hut', () => {
  function hut(station = COAL_STATION) {
    const run = { ...newRun(landJob('gatefields', 3)), index: 0 }, room = runRoom(run), h = room.join('me');
    for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false });
    const s = room.map.stations!.find((x) => x.name === station)!;
    Object.assign(h, { purse: 100, x: s.x, y: s.y });
    let seq = 0;
    const ask = () => {
      room.setIntent('me', { ...NO_INTENT, gearOp: GEAR.coal, gearArg: 0, gearSeq: ++seq });
      const before = room.events.length;
      room.step();
      return room.events.slice(before).filter((e: FightEvent) => e.k === 'bought');
    };
    return { room, h, ask };
  }
  it('sells a sack for 40 inside the hut ring', () => {
    const { h, ask } = hut();
    expect(ask()).toEqual([expect.objectContaining({ k: 'bought', id: 'me', n: SHELTER.charcoal, what: 'charcoal' })]);
    expect(h.purse).toBe(100 - 40);
  });
  it('not at the Field Barn, not off a roaming land, not when short', () => {
    const barn = hut('THE FIELD BARN');
    expect(barn.ask()).toEqual([]);
    expect(barn.h.purse).toBe(100);
    const flat = hut();
    flat.room.roam = false;
    expect(flat.ask()).toEqual([]);
    const poor = hut();
    poor.h.purse = 39;
    expect(poor.ask()).toEqual([]);
  });
});
