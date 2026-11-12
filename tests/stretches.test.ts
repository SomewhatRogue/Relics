/**
 * An instance on one map, in stretches (docs/design/open-cut-map.md step 1; sim/stretches.ts), on the stress map
 * (shared/stressmap.ts: each row a stretch, a gate in its wall, a WARDEN to kill first).
 */
import { describe, expect, it } from 'vitest';
import { stressJob } from '../src/shared/instances';
import { solid } from '../src/shared/arena';
import { HERO, INSTANCE, TICK } from '../src/shared/tuning';
import { newRun, runRoom, tally } from '../src/sim/run';
import { goal } from '../src/sim/goal';
import { gateReady, stretchOf } from '../src/sim/stretches';
import { stepCheckpoint } from '../src/sim/checkpoint';
import { NO_INTENT } from '../src/sim/types';

function map(ids = ['me']) {
  const run = newRun(stressJob());
  run.party = ids.length;
  const room = runRoom(run), hs = ids.map((id) => room.join(id));
  for (const h of hs) room.setIntent(h.id, NO_INTENT), Object.assign(h, { hp: 1e6, maxHp: 1e6 });
  const st = () => stretchOf(run, room.map)!;
  const warden = () => room.allEnemies.find((e) => e.name === st().keep[0])!;
  const at = () => st().at!;
  const into = (h: (typeof hs)[0], dx = 0) => Object.assign(h, { x: at().x + at().w / 2 + dx, y: at().y + at().h / 2, safeT: 99 });
  const tick = () => (room.step(), tally(run, room, room.events, ids[0]));
  return { run, room, hs, st, warden, at, into, tick };
}

describe('one map in stretches', () => {
  it('starts in the first stretch, its gate shut, its WARDEN to kill', () => {
    const { run, room, st, warden } = map();
    expect(run.stretch ?? 0).toBe(0);
    expect(st().keep).toEqual(['WARDEN 1']);
    expect(solid(room.map.blocks[st().gate!])).toBe(true);
    expect(goal(run, room).text).toContain('Kill WARDEN 1');
    expect(warden()).toBeDefined();
  });

  it('keeps the gate shut while the WARDEN lives, even with the party at it', () => {
    const { run, room, hs, into, tick } = map();
    into(hs[0]);
    for (let n = 0; n < 10; n++) tick();
    expect(run.stretch ?? 0).toBe(0);
    expect(gateReady(run, room)).toBe(false);
  });

  it('opens for the whole party at it once the WARDEN is dead: the next stretch, the checkpoint there, the wipes reset', () => {
    const { run, room, hs, st, warden, into, tick } = map(['me', 'pal']);
    const s0 = st();
    Object.assign(warden(), { hp: 0, act: 'dead' });
    expect(gateReady(run, room)).toBe(true);
    expect(goal(run, room).text).toContain('at the gate together');
    run.downs = 2;
    into(hs[0]);
    for (let n = 0; n < 5; n++) tick();
    expect(run.stretch ?? 0).toBe(0);
    into(hs[1], 0.6);
    let seen = false;
    for (let n = 0; n < 5 && !seen; n++) tick(), (seen = room.events.some((e) => e.k === 'gateopen'));
    expect(seen).toBe(true);
    expect(run.stretch).toBe(1);
    expect(run.check).toEqual(s0.check);
    expect(run.downs).toBe(0);
    expect(solid(room.map.blocks[s0.gate!])).toBe(false);
    expect(st().keep).toEqual(['WARDEN 2']);
  });

  it('a wipe past a gate gets the party up at that gate, not at the map`s start', () => {
    const { run, room, hs, warden, into, tick } = map();
    Object.assign(warden(), { hp: 0, act: 'dead' });
    into(hs[0]);
    for (let n = 0; n < 5 && (run.stretch ?? 0) === 0; n++) tick();
    const check = run.check!;
    Object.assign(hs[0], { x: check.x + 20, y: check.y, hp: 0, act: 'down', actT: 0, actDur: HERO.respawn });
    stepCheckpoint(run, room, []);
    for (let n = 0; n < Math.round((INSTANCE.regroup + 0.2) / TICK); n++) room.step(), stepCheckpoint(run, room, []);
    expect(hs[0].act).toBe('idle');
    expect(Math.hypot(hs[0].x - check.x, hs[0].y - check.y)).toBeLessThan(1);
  });
});
