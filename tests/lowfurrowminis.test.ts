/**
 * Lowfurrow's two mini quests on its two maps (shared/lowfurrowminis.ts): the sister in THE FIELDS, the rope in
 * THE RISE. Each can be reached, taken and finished in a real land room, and has its checked words.
 */
import { describe, expect, it } from 'vitest';
import { inArea, levelAt, solid, type GameMap } from '../src/shared/arena';
import { miniWords } from '../src/shared/miniwords';
import { landJob, mapsOf, territoryPlan } from '../src/shared/territory';
import { canTalk } from '../src/sim/minis';
import { newRun, runRoom, tally } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

/** Nothing solid within `r` of (x, y): no block, no tree, rock or stook. */
function clear(m: GameMap, x: number, y: number, r = 0.3): boolean {
  const stops = [...m.blocks.filter((b) => solid(b)), ...m.rounds.map((o) => ({ x: o.x - o.r, y: o.y - o.r, w: o.r * 2, h: o.r * 2 }))];
  return !stops.some((a) => inArea({ x: a.x - r, y: a.y - r, w: a.w + r * 2, h: a.h + r * 2 }, x, y));
}

function land(index: number) {
  const run = newRun(landJob('lowfurrow', 3));
  run.index = index;
  const room = runRoom(run), h = room.join('me'), mini = room.map.minis![0];
  room.setIntent(h.id, NO_INTENT), Object.assign(h, { hp: 1e6, maxHp: 1e6 });
  for (let n = 0; n < 60; n++) room.step();
  const tick = () => (room.step(), tally(run, room, room.events, 'me'));
  const kill = (pack: number) => { for (const e of room.allEnemies) if (e.pack === pack) Object.assign(e, { hp: 0, act: 'dead' }); };
  const by = () => Object.assign(h, { x: mini.giver.x, y: mini.giver.y + 0.9, z: levelAt(room.map, mini.giver.x, mini.giver.y + 0.9), safeT: 99, act: 'idle' });
  let seq = 0;
  const grab = () => {
    room.setIntent(h.id, { ...NO_INTENT, grabSeq: ++seq });
    const ev: string[] = [];
    for (let n = 0; n < 4; n++) tick(), ev.push(...room.events.filter((e) => e.k === 'mini').map((e) => (e as { what: string }).what));
    room.setIntent(h.id, NO_INTENT);
    return ev;
  };
  return { run, room, h, mini, tick, kill, by, grab, state: () => room.minis[0] };
}

describe("Lowfurrow's mini quests", () => {
  it('two maps, one mini quest on each, each with its words and a giver who stands on open ground', () => {
    expect(mapsOf('lowfurrow')).toBe(2);
    const ids = ['low-sister', 'low-rope'];
    for (let i = 0; i < 2; i++) {
      const plan = territoryPlan(landJob('lowfurrow', 3), i), m = plan.map.minis![0];
      expect(m.id).toBe(ids[i]);
      const w = miniWords(m.id);
      expect(w.offer.length).toBeGreaterThan(10), expect(w.goal.length).toBeGreaterThan(5);
      expect(plan.map.npcs!.some((n) => n.talk === `mini:${m.id}`)).toBe(true);
      // Open ground: beside the giver, where its goblins are made, where anyone is freed and where its chest stands.
      // (Beside the giver: a step east, or a step south of one who is up a tree.)
      const open = [m.giver.up ? { x: m.giver.x, y: m.giver.y + 0.9 } : { x: m.giver.x + 0.9, y: m.giver.y }, ...m.foes, ...(m.frees ?? []), ...(m.chest ? [m.chest] : [])];
      for (const p of open) expect(clear(plan.map, p.x, p.y), `${m.id} at ${p.x},${p.y}`).toBe(true);
      // Its goblins belong to no pack the gates keep.
      const kept = new Set(plan.map.stretches!.flatMap((s) => s.packs ?? []));
      for (const f of m.foes) expect(kept.has(f.pack!)).toBe(false);
      expect(plan.foes.some((f) => f.pack === m.foes[0].pack)).toBe(false);
    }
  });

  it('the sister: the woman under the cart speaks once the two at the dinner are dead, and her sister comes out', () => {
    const { room, h, mini, by, grab, kill, tick, state } = land(0);
    by();
    expect(canTalk(room, h)).toBeUndefined();
    kill(101), tick();
    expect(grab()).toContain('taken');
    expect(state().state).toBe('taken');
    expect(room.allEnemies.filter((e) => e.pack === 201 && e.act !== 'dead').length).toBe(3);
    const before = room.survivors.length;
    kill(201);
    for (let n = 0; n < 5; n++) tick();
    expect(state().state).toBe('done');
    // Her sister out of the willows, and the woman herself out from under the cart.
    expect(room.survivors.length).toBe(before + mini.frees!.length + 1);
    expect(room.map.npcs!.some((n) => n.talk === 'mini:low-sister')).toBe(false);
  });

  it('the rope: the man up the tree speaks once the archers are dead; the big one falls and a chest stands by the carts', () => {
    const { room, h, mini, by, grab, kill, tick, state } = land(1);
    by();
    expect(canTalk(room, h)).toBeUndefined();
    kill(120), tick();
    expect(grab()).toContain('taken');
    const big = room.allEnemies.filter((e) => e.pack === 202);
    expect(big.length).toBe(3);
    const chests = room.chests.length;
    kill(202);
    for (let n = 0; n < 5; n++) tick();
    expect(state().state).toBe('done');
    expect(room.chests.length).toBe(chests + 1);
    expect(room.chests.some((c) => Math.hypot(c.x - mini.chest!.x, c.y - mini.chest!.y) < 0.5)).toBe(true);
  });
});
