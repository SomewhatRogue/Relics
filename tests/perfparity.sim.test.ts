/**
 * The fight decides the same thing after the performance sweep as before it (docs/design/perf-sweep.md).
 * Seeded jobs of every kind are played by seeded bots; every 25 ticks the whole room (everything a takeover
 * would be handed, with where each body stood the tick before and the tick's events) is hashed, and the
 * hashes must be the ones recorded on commit 1dbfcd3, before any change. A different position, roll, drop,
 * order or event anywhere fails it. To record again (only when a rule is changed on purpose):
 * `RECORD_PARITY=1 npx vitest run tests/perfparity.sim.test.ts`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { jobJson, saveRoom } from '../src/client/coop';
import type { ArenaRoom } from '../src/sim/room';
import { fnv, newPress, scenes, stepScene } from './perfparity.scenes';

const GOLDEN = new URL('./perfparity.sim.golden.json', import.meta.url);
const EVERY = 25;

/** The room as text: its save, the bodies' last places (in id order), and this tick's events. */
function text(room: ArenaRoom): string {
  const prev = [...room.prev].map(([k, v]) => [k, v[0], v[1]] as const).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return jobJson({ room: saveRoom(room), prev, events: room.events });
}

function play(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const s of scenes()) {
    const press = newPress(), hashes: string[] = [];
    let evs = '';
    for (let t = 1; t <= s.ticks; t++) {
      stepScene(s, press);
      evs = fnv(evs + JSON.stringify(s.room.events));
      if (t % EVERY === 0 || t === s.ticks) hashes.push(fnv(text(s.room)) + evs);
    }
    out[s.name] = hashes;
  }
  return out;
}

describe('the performance sweep changes no outcome', () => {
  it('every seeded fight plays out hash for hash as it did before', () => {
    const got = play();
    if (process.env.RECORD_PARITY || !existsSync(GOLDEN)) writeFileSync(GOLDEN, JSON.stringify(got, null, 1) + '\n');
    const want = JSON.parse(readFileSync(GOLDEN, 'utf8')) as Record<string, string[]>;
    expect(Object.keys(got)).toEqual(Object.keys(want));
    for (const [name, hashes] of Object.entries(want)) {
      // (Named, with the first tick that differs, so a failure says where to look.)
      const at = hashes.findIndex((h, i) => h !== got[name][i]);
      expect(at < 0 ? `${name}: same` : `${name}: differs by tick ${(at + 1) * EVERY}`).toBe(`${name}: same`);
    }
  });
});
