/**
 * Step 0 of docs/design/open-cut-map.md: what one big instance map costs, in Node. Run on its own with
 * `STRESS=1 npx vitest run tests/stress.test.ts`; skipped in the suite. Writes its numbers to stress.json in the
 * scratchpad named by STRESS_OUT (or prints nothing).
 */
import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { stressJob } from '../src/shared/instances';
import { STRESS } from '../src/shared/stressmap';
import { INSTANCES } from '../src/shared/instances';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const ms = (f: () => void) => {
  const t = performance.now();
  f();
  return performance.now() - t;
};
const stats = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return { avg: +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(3), p95: +s[Math.floor(s.length * 0.95)].toFixed(3), max: +s[s.length - 1].toFixed(3) };
};

describe.skipIf(!process.env.STRESS)('a big instance map', () => {
  it('measures', { timeout: 600000 }, () => {
    const out: Record<string, unknown> = { map: STRESS };
    const job = stressJob();
    out.planMs = +ms(() => INSTANCES.stress.areas[0].plan!(job)).toFixed(1);
    const run = newRun(job);
    run.party = 3;
    let room!: ReturnType<typeof runRoom>;
    out.roomMs = +ms(() => (room = runRoom(run))).toFixed(1);
    const hs = ['a', 'b', 'c'].map((id) => room.join(id));
    for (const h of hs) room.setIntent(h.id, NO_INTENT), Object.assign(h, { hp: 1e6, maxHp: 1e6 });
    out.goblins = room.allEnemies.length;
    out.rounds = room.map.rounds.length;
    const band = STRESS.h / STRESS.rows;
    // Together, walking the first row's path end to end (packs wake and doze as they pass).
    const first: number[] = [];
    out.firstTickMs = +ms(() => room.step()).toFixed(1);
    for (let n = 0; n < 900; n++) {
      const x = 6 + (n / 900) * (STRESS.w - 12), y = STRESS.h - band / 2;
      hs.forEach((h, i) => Object.assign(h, { x: x + i * 0.8, y }));
      first.push(ms(() => room.step()));
    }
    out.together = { ...stats(first), awake: room.allEnemies.filter((e) => !e.dozing).length };
    // Split three ways, each in a different row (the worst case the gates prevent).
    const split: number[] = [];
    for (let n = 0; n < 600; n++) {
      hs.forEach((h, i) => Object.assign(h, { x: 20 + ((n / 600) * 100), y: STRESS.h - band / 2 - i * 3 * band }));
      split.push(ms(() => room.step()));
    }
    out.split = { ...stats(split), awake: room.allEnemies.filter((e) => !e.dozing).length };
    if (process.env.STRESS_OUT) writeFileSync(process.env.STRESS_OUT, JSON.stringify(out, null, 1));
  });
});
