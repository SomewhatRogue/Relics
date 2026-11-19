/**
 * Sallow Carr as a job (shared/territory.ts; docs/design/territories.md, "3. Sallow Carr"): a burn job over two
 * maps. A sluice is a gate that is wound (hauled) and that will not open while its stretch's den stands
 * (`Stretch.dens`: sim/stretches.ts); the goal says so in the burn job's own words; the last map's goal is the
 * job's: every den on it.
 */
import { describe, expect, it } from 'vitest';
import { LANDS, landJob, mapsOf } from '../src/shared/territory';
import { TICK } from '../src/shared/tuning';
import { goal } from '../src/sim/goal';
import { newRun, runRoom } from '../src/sim/run';
import { gateReady, stepStretches } from '../src/sim/stretches';
import { NO_INTENT } from '../src/sim/types';

const room = (index: number) => {
  const run = newRun(landJob('sallow', 3));
  run.index = index;
  const r = runRoom(run), h = r.join('me');
  r.setIntent(h.id, NO_INTENT);
  const dead = () => { for (const e of r.allEnemies) Object.assign(e, { hp: 0, act: 'dead' }); };
  const secs = (n: number) => { for (let t = 0; t <= Math.round(n / TICK); t++) stepStretches(run, r, []), (r.time += TICK); };
  return { run, r, h, dead, secs };
};

describe('Sallow Carr, the job', () => {
  it('is a laid territory of two maps and a burn job', () => {
    expect(LANDS).toContain('sallow');
    expect([mapsOf('sallow'), landJob('sallow', 3).objective, landJob('sallow', 3).place.name]).toEqual([2, 'burn', 'Sallow Carr']);
  });

  it('the first sluice stays shut while its den stands, and the goal says to burn it', () => {
    const { run, r, h, dead, secs } = room(0), st = r.map.stretches![0], at = st.at!, den = r.map.blocks[st.dens![0]];
    expect([st.haul, den.kind, st.dens!.length]).toEqual([5, 'den', 1]);
    dead();
    Object.assign(h, { x: at.x + at.w / 2, y: at.y + at.h / 2 });
    expect(gateReady(run, r)).toBe(false);
    expect(goal(run, r).text).toContain('Burn out the dens (1 hut left)');
    secs(8);
    expect([run.stretch ?? 0, r.map.blocks[st.gate!].open ?? 0]).toEqual([0, 0]);
    // Burned: now it is wound open, five seconds for one.
    den.ruined = true;
    expect(gateReady(run, r)).toBe(true);
    secs(4);
    expect(run.stretch ?? 0).toBe(0);
    secs(1.5);
    expect([run.stretch, r.map.blocks[st.gate!].ruined]).toEqual([1, true]);
  });

  it('the last map is done when its goblins are dead and its one den is burned', () => {
    const { run, r, dead } = room(1), dens = r.map.blocks.filter((b) => b.kind === 'den');
    expect(dens.length).toBe(1);
    run.stretch = r.map.stretches!.length - 1;
    dead();
    expect(goal(run, r)).toMatchObject({ done: false });
    expect(goal(run, r).text).toContain('Burn out the dens');
    dens[0].ruined = true;
    expect(goal(run, r).done).toBe(true);
  });
});
