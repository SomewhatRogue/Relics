/**
 * Mini quests (sim/minis.ts; docs/design/territories.md, "Mini quests"), on the proving hill's one
 * (shared/hillmap.ts): the giver won't talk while the pack over them lives, GRAB beside them takes it, what it
 * sends you after is made only then, it never keeps a gate, and done it pays in people and a chest.
 */
import { describe, expect, it } from 'vitest';
import { levelAt } from '../src/shared/arena';
import { MINI_WORDS, miniWords } from '../src/shared/miniwords';
import { landJob, TERR } from '../src/shared/territory';
import { TICK } from '../src/shared/tuning';
import { goal } from '../src/sim/goal';
import { canTalk } from '../src/sim/minis';
import { newRun, runRoom, tally } from '../src/sim/run';
import { gateReady } from '../src/sim/stretches';
import { targets } from '../src/sim/targets';
import { NO_INTENT } from '../src/sim/types';

function hill(ids = ['me']) {
  const run = newRun(landJob('hill', 3));
  run.party = ids.length;
  const room = runRoom(run), hs = ids.map((id) => room.join(id)), mini = room.map.minis![0];
  for (const h of hs) room.setIntent(h.id, NO_INTENT), Object.assign(h, { hp: 1e6, maxHp: 1e6 });
  for (let n = 0; n < 60; n++) room.step();
  const tick = () => (room.step(), tally(run, room, room.events, ids[0]));
  const kill = (pack: number) => { for (const e of room.allEnemies) if (e.pack === pack) Object.assign(e, { hp: 0, act: 'dead' }); };
  const by = (h: (typeof hs)[0]) => Object.assign(h, { x: mini.giver.x + 0.9, y: mini.giver.y, z: levelAt(room.map, mini.giver.x, mini.giver.y), safeT: 99, act: 'idle' });
  let seq = 0;
  /** Press GRAB once and step a few ticks. */
  const grab = (h: (typeof hs)[0]) => {
    room.setIntent(h.id, { ...NO_INTENT, grabSeq: ++seq });
    const ev: string[] = [];
    for (let n = 0; n < 4; n++) tick(), ev.push(...room.events.filter((e) => e.k === 'mini').map((e) => (e as { what: string }).what));
    room.setIntent(h.id, NO_INTENT);
    return ev;
  };
  return { run, room, hs, mini, tick, kill, by, grab, state: () => room.minis[0] };
}

describe('a mini quest', () => {
  it('is offered from the start, with nothing of it on the map yet', () => {
    const { room, mini, state } = hill();
    expect(state()).toEqual({ id: 'hill-pond', state: 'offered', ids: [] });
    expect(room.allEnemies.some((e) => e.pack === 201)).toBe(false);
    expect(room.map.npcs!.some((n) => n.talk === 'mini:hill-pond')).toBe(true);
    expect(mini.foes.length).toBe(2);
  });

  it('the giver says nothing while the pack over them lives: no mark, no talk', () => {
    const { run, room, hs, by, grab, state } = hill();
    by(hs[0]);
    expect(canTalk(room, hs[0])).toBeUndefined();
    expect(targets(run, room).some((t) => t.kind === 'folk')).toBe(false);
    expect(grab(hs[0])).toEqual([]);
    expect(state().state).toBe('offered');
  });

  it('once they are dead: a mark when a hero is near, and GRAB beside the giver takes it and makes its goblins', () => {
    const { run, room, hs, mini, by, grab, kill, state, tick } = hill();
    kill(101);
    tick();
    // (From the way in, 8 tiles off: near enough for the mark, too far to talk.)
    expect(targets(run, room).some((t) => t.kind === 'folk' && t.x === mini.giver.x)).toBe(true);
    expect(canTalk(room, hs[0])).toBeUndefined();
    by(hs[0]);
    expect(canTalk(room, hs[0])?.id).toBe('hill-pond');
    const n = room.allEnemies.length;
    expect(grab(hs[0])).toEqual(['taken']);
    expect(state().state).toBe('taken');
    const woke = room.allEnemies.filter((e) => e.pack === 201);
    expect(woke.length).toBe(2);
    expect(room.allEnemies.length).toBe(n + 2);
    expect(state().ids.sort()).toEqual(woke.map((e) => e.id).sort());
    expect(new Set(room.allEnemies.map((e) => e.id)).size).toBe(room.allEnemies.length);
    for (const e of woke) expect(e.z).toBe(levelAt(room.map, e.x, e.y));
    // The goal's second line, and the mark moved to its ground.
    expect(goal(run, room).text).toContain(`${MINI_WORDS.also}: ${miniWords('hill-pond').goal}`);
    const marks = targets(run, room);
    expect(marks.some((t) => t.kind === 'folk')).toBe(false);
    expect(marks.some((t) => t.kind === 'job' && t.x === mini.at.x && t.y === mini.at.y)).toBe(true);
  });

  it('never keeps a gate: the headland`s gate is ready with the mini quest untouched, and with it taken', () => {
    const { run, room, hs, by, grab, kill } = hill();
    kill(101);
    expect(gateReady(run, room)).toBe(true);
    expect(goal(run, room).done).toBe(false);
    by(hs[0]), grab(hs[0]);
    expect(gateReady(run, room)).toBe(true);
  });

  it('done when what it woke is dead: the hidden one and the giver go home, a chest is shown, the line is gone', () => {
    const { run, room, hs, by, grab, kill, tick, state } = hill();
    kill(101), by(hs[0]), grab(hs[0]);
    const chests = room.chests.length, before = run.rescued;
    kill(201);
    let done = false;
    for (let n = 0; n < 5 && !done; n++) tick(), (done = room.events.some((e) => e.k === 'mini' && e.what === 'done'));
    expect(done).toBe(true);
    expect(state().state).toBe('done');
    expect(room.chests.length).toBe(chests + 1);
    expect(room.survivors.length).toBe(2);
    expect(room.map.npcs!.some((n) => n.talk === 'mini:hill-pond')).toBe(false);
    expect(goal(run, room).text).not.toContain(MINI_WORDS.also);
    expect(targets(run, room).some((t) => t.kind === 'job' || t.kind === 'folk')).toBe(false);
    // Both walk off to the nearest gate or way in and are counted home.
    for (let n = 0; n < Math.round(20 / TICK) && room.survivors.some((s) => s.home < 0); n++) tick();
    expect(room.survivors.every((s) => s.home >= 0 && !s.dead)).toBe(true);
    expect(run.rescued).toBe(before + 2);
  });

  it('a giver who waits to be seen goes home only when a hero is back by them, with a last word', () => {
    const { room, hs, mini, by, grab, kill, tick, state } = hill();
    mini.giverLeaves = 'seen';
    kill(101), by(hs[0]), grab(hs[0]);
    Object.assign(hs[0], { x: 12, y: 70, z: 1 });
    kill(201);
    for (let n = 0; n < 5; n++) tick();
    expect(state().state).toBe('done');
    expect(state().left).toBeFalsy();
    expect(room.map.npcs!.some((n) => n.talk === 'mini:hill-pond')).toBe(true);
    expect(room.survivors.length).toBe(1);
    by(hs[0]);
    let home = false;
    for (let n = 0; n < 5 && !home; n++) tick(), (home = room.events.some((e) => e.k === 'mini' && e.what === 'home'));
    expect(home).toBe(true);
    expect(state().left).toBe(true);
    expect(room.survivors.length).toBe(2);
    expect(room.map.npcs!.some((n) => n.talk === 'mini:hill-pond')).toBe(false);
  });

  it('what it wakes is as tough as the rest for the party', () => {
    const one = hill(['a']), three = hill(['a', 'b', 'c']);
    for (const t of [one, three]) t.kill(101), t.by(t.hs[0]), t.grab(t.hs[0]);
    const a = one.room.allEnemies.find((e) => e.pack === 201)!, b = three.room.allEnemies.find((e) => e.pack === 201)!;
    expect(b.maxHp).toBe(Math.round(a.maxHp * (1 + TERR.more.hp * 2)));
  });

  it('a second press, or a press by a friend, takes nothing twice', () => {
    const { room, hs, by, grab, kill } = hill(['me', 'pal']);
    kill(101), by(hs[0]), by(hs[1]);
    expect(grab(hs[0])).toEqual(['taken']);
    const n = room.allEnemies.length;
    expect(grab(hs[1])).toEqual([]);
    expect(room.allEnemies.length).toBe(n);
  });
});
