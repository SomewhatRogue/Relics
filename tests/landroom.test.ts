/**
 * A territory in the fight (sim/landroom.ts; docs/design/territories.md and elevation.md), on the proving hill
 * (shared/hillmap.ts): its gates keep till the zone's pack is dead and the whole party stands at them, each
 * gate is the checkpoint, the last stretch's goal is the job's own, a party makes the goblins tougher and never
 * more, and its hill is walked: up a slope anywhere along it, never up a face.
 */
import { describe, expect, it } from 'vitest';
import { levelAt, solid } from '../src/shared/arena';
import { LAND_WORDS } from '../src/shared/landwords';
import { GATE_WORDS } from '../src/shared/opencutwords';
import { landJob, TERR, territoryPlan } from '../src/shared/territory';
import { HERO, INSTANCE, TICK } from '../src/shared/tuning';
import { stepCheckpoint } from '../src/sim/checkpoint';
import { goal } from '../src/sim/goal';
import { freeSurvivor } from '../src/sim/survivors';
import { newRun, runRoom, tally } from '../src/sim/run';
import { gateReady, lastStretch, stretchOf } from '../src/sim/stretches';
import { NO_INTENT } from '../src/sim/types';

function land(ids = ['me']) {
  const run = newRun(landJob('hill', 3));
  run.party = ids.length;
  const room = runRoom(run), hs = ids.map((id) => room.join(id));
  for (const h of hs) room.setIntent(h.id, NO_INTENT), Object.assign(h, { hp: 1e6, maxHp: 1e6 });
  const st = () => stretchOf(run, room.map)!;
  const kill = () => { for (const e of room.allEnemies) if (st().packs?.includes(e.pack!)) Object.assign(e, { hp: 0, act: 'dead' }); };
  /** Set down in the stretch's gate, at the height of the ground there. */
  const into = (h: (typeof hs)[0], dx = 0) => {
    const x = st().at!.x + st().at!.w / 2 + dx, y = st().at!.y + st().at!.h / 2;
    return Object.assign(h, { x, y, z: levelAt(room.map, x, y), safeT: 99 });
  };
  const tick = () => (room.step(), tally(run, room, room.events, ids[0]));
  /** Through the stretch's gate: its pack dead, everyone at it. */
  const pass = () => {
    const from = run.stretch ?? 0;
    kill();
    hs.forEach((h, i) => into(h, i * 0.6));
    for (let n = 0; n < 8 && (run.stretch ?? 0) === from; n++) tick();
  };
  return { run, room, hs, st, kill, into, tick, pass };
}

describe('a territory in the fight', () => {
  it('starts at the way in, in the first stretch, its gate shut and kept by the zone`s pack', () => {
    const { run, room, hs, st } = land();
    expect(room.map.name).toBe('THE PROVING HILL');
    expect(Math.hypot(hs[0].x - room.map.hero.x, hs[0].y - room.map.hero.y)).toBeLessThan(1.5);
    expect(run.stretch ?? 0).toBe(0);
    expect(solid(room.map.blocks[st().gate!])).toBe(true);
    expect(gateReady(run, room)).toBe(false);
    expect(goal(run, room).text).toContain(LAND_WORDS.guards);
    expect(goal(run, room).done).toBe(false);
  });

  it('keeps the gate shut with the party at it while the pack lives', () => {
    const { run, hs, into, tick } = land();
    into(hs[0]);
    for (let n = 0; n < 10; n++) tick();
    expect(run.stretch ?? 0).toBe(0);
  });

  it('opens for the whole party once the pack is dead, and the gate is the checkpoint', () => {
    const { run, room, hs, st, kill, into, tick } = land(['me', 'pal']);
    const s0 = st();
    kill();
    expect(gateReady(run, room)).toBe(true);
    expect(goal(run, room).text).toContain(GATE_WORDS.on);
    run.downs = 2;
    into(hs[0]);
    for (let n = 0; n < 5; n++) tick();
    expect(run.stretch ?? 0).toBe(0);
    into(hs[1], 0.6);
    for (let n = 0; n < 5 && (run.stretch ?? 0) === 0; n++) tick();
    expect(run.stretch).toBe(1);
    expect(run.check).toEqual(s0.check);
    expect(run.downs).toBe(0);
    expect(solid(room.map.blocks[s0.gate!])).toBe(false);
  });

  it('a wipe past a gate gets the party up at that gate, and the run goes on', () => {
    const { run, room, hs, pass } = land();
    pass();
    const check = run.check!;
    Object.assign(hs[0], { x: check.x, y: check.y - 10, hp: 0, act: 'down', actT: 0, actDur: HERO.respawn });
    stepCheckpoint(run, room, []);
    expect(run.downs).toBe(1);
    for (let n = 0; n < Math.round((INSTANCE.regroup + 0.2) / TICK); n++) room.step(), stepCheckpoint(run, room, []);
    expect(run.failed).toBe(false);
    expect(hs[0].act).toBe('idle');
    expect(Math.hypot(hs[0].x - check.x, hs[0].y - check.y)).toBeLessThan(1);
  });

  it('alone, three downs between gates do not end it early: only the third wipe does', () => {
    const { run, room, hs, tick } = land();
    for (let i = 0; i < 2; i++) {
      Object.assign(hs[0], { hp: 0, act: 'down', actT: 0, actDur: HERO.respawn });
      tick();
      for (let n = 0; n < Math.round((INSTANCE.regroup + 0.3) / TICK); n++) tick();
      expect(run.failed).toBe(false);
    }
    Object.assign(hs[0], { hp: 0, act: 'down', actT: 0, actDur: HERO.respawn });
    tick();
    expect(run.downs).toBe(INSTANCE.wipes);
    expect(run.failed).toBe(true);
    expect(room.map.stretches!.length).toBe(3);
  });

  it('in the last stretch the goal is the job`s own: everyone out of the cages, then the way home', () => {
    const { run, room, pass } = land();
    pass(), pass();
    expect(run.stretch).toBe(2);
    expect(lastStretch(run, room.map)).toBe(true);
    const g = goal(run, room);
    expect(g.done).toBe(false);
    expect(g.text).not.toContain(LAND_WORDS.guards);
    expect(g.text).toContain('to free');
  });

  it('a party makes each goblin tougher and harder hitting, never more of them', () => {
    const one = land(['a']).room, three = land(['a', 'b', 'c']).room;
    expect(three.allEnemies.length).toBe(one.allEnemies.length);
    const a = one.allEnemies.find((e) => !e.name)!, b = three.allEnemies.find((e) => e.id === a.id)!;
    expect(b.maxHp).toBe(Math.round(a.maxHp * (1 + TERR.more.hp * 2)));
    expect(b.harm ?? 1).toBeCloseTo((a.harm ?? 1) * (1 + TERR.more.harm * 2), 2);
  });

  it('its far goblins doze: nobody past the first gate is stepped from the way in', () => {
    const { room, tick } = land();
    for (let n = 0; n < 5; n++) tick();
    const far = room.allEnemies.filter((e) => e.y < 70);
    expect(far.length).toBeGreaterThan(4);
    expect(far.every((e) => e.dozing)).toBe(true);
    expect(room.allEnemies.filter((e) => e.y > 78).every((e) => !e.dozing)).toBe(true);
  });
});

describe('the proving hill (docs/design/elevation.md)', () => {
  /** Walk a hero from (x, y) by (mx, my) for `secs`. */
  function walk(x: number, y: number, mx: number, my: number, secs: number, z = 0) {
    const { room, hs } = land();
    for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead' });
    // (A moment for the hero to be standing in the room before being set down.)
    for (let n = 0; n < 60; n++) room.step();
    Object.assign(hs[0], { x, y, z, safeT: 99 });
    room.setIntent(hs[0].id, { ...NO_INTENT, mx, my });
    for (let n = 0; n < Math.round(secs / TICK); n++) room.step();
    return { h: hs[0], map: room.map };
  }

  it('a slope is walked up anywhere along it: off the road, up the first lynchet, onto level 1', () => {
    for (const x of [8, 15, 34, 37]) {
      const { h, map } = walk(x, 73, 0, -1, 3);
      expect(h.y).toBeLessThan(68);
      expect(h.z ?? 0).toBe(1);
      expect(levelAt(map, h.x, h.y)).toBe(1);
    }
  });

  it('and walked down again', () => {
    const { h } = walk(34, 66, 0, 1, 3, 1);
    expect(h.y).toBeGreaterThan(71.5);
    expect(h.z ?? 0).toBe(0);
  });

  it('a face stops you: from the hollow lane you cannot walk onto a bank', () => {
    // (Clear of the sheep tracks, which climb both banks between y 30 and 33.)
    const west = walk(20, 27, -1, 0, 3, 1).h, east = walk(24, 28, 1, 0, 3, 1).h;
    expect(west.x).toBeGreaterThan(17.5);
    expect(west.z ?? 0).toBe(1);
    expect(east.x).toBeLessThan(26.5);
    expect(east.z ?? 0).toBe(1);
  });

  it('but the bank`s own slope takes you up it, and the lane climbs onto the top', () => {
    const bank = walk(10, 42, 0, -1, 4, 1).h;
    expect(bank.z ?? 0).toBe(2);
    const lane = walk(22, 27, 0, -1, 3, 1).h;
    expect(lane.y).toBeLessThan(23);
    expect(lane.z ?? 0).toBe(2);
  });

  it('what is set down on raised ground stands on it: the cages stay where they were put', () => {
    const { room, tick } = land(), plan = territoryPlan(landJob('hill', 3));
    for (let n = 0; n < 30; n++) tick();
    const cages = room.props.filter((p) => p.kind === 'cage'), put = plan.props.filter((p) => p.kind === 'cage');
    expect(cages.length).toBe(5);
    for (const c of put) {
      const at = cages.find((p) => Math.hypot(p.x - c.x, p.y - c.y) < 0.2);
      expect(at, `the cage at ${c.x}, ${c.y}`).toBeDefined();
      expect(at!.z ?? 0).toBe(levelAt(room.map, c.x, c.y));
    }
  });

  it('someone freed in the fold yard stands on the rise, and a hero gets up at the second gate on its level', () => {
    const { run, room, hs, pass } = land();
    pass(), pass();
    const s = freeSurvivor(room.survivors, 20, 16, room.time);
    for (let n = 0; n < 5; n++) room.step();
    expect(s.z).toBe(2);
    expect(Math.hypot(s.x - 20, s.y - 16)).toBeLessThan(1.5);
    const check = run.check!;
    Object.assign(hs[0], { x: check.x, y: check.y - 12, z: 2, hp: 0, act: 'down', actT: 0, actDur: HERO.respawn });
    stepCheckpoint(run, room, []);
    for (let n = 0; n < Math.round((INSTANCE.regroup + 0.3) / TICK); n++) room.step(), stepCheckpoint(run, room, []);
    expect(hs[0].act).toBe('idle');
    expect(Math.hypot(hs[0].x - check.x, hs[0].y - check.y)).toBeLessThan(1);
    expect(hs[0].z).toBe(levelAt(room.map, check.x, check.y));
  });

  it('the freed make for the nearest gate or way out, not the whole map back to the way in (Kyle, 2026-11-17)', () => {
    const { room, kill } = land();
    for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead' });
    void kill;
    const inStooks = freeSurvivor(room.survivors, 15, 50, room.time), inYard = freeSurvivor(room.survivors, 20, 16, room.time);
    for (let n = 0; n < Math.round(12 / TICK) && !(inStooks.home >= 0 && inYard.home >= 0); n++) room.step();
    // The drain's bridge is 9 tiles from the stooks' cage; the way in is 43.
    expect(inStooks.home).toBeGreaterThanOrEqual(0);
    expect(Math.hypot(inStooks.x - 22, inStooks.y - 45)).toBeLessThan(3);
    // From the fold yard, the stile on the rise.
    expect(inYard.home).toBeGreaterThanOrEqual(0);
    expect(inYard.y).toBeLessThan(4);
  });

  it('a run never changes the kept plan: the same job again starts with its gates shut', () => {
    const first = land();
    first.pass(), first.pass();
    const again = land(), plan = territoryPlan(landJob('hill', 3));
    for (const s of plan.map.stretches!) if (s.gate !== undefined) expect(plan.map.blocks[s.gate].ruined ?? false).toBe(false);
    expect(solid(again.room.map.blocks[again.st().gate!])).toBe(true);
    expect(again.run.stretch ?? 0).toBe(0);
  });
});
