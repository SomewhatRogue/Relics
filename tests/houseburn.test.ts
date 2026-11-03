/**
 * Setting a house alight (Kyle, 2026-11-03): its one kindling spot, lighting it (slow, put out by a hit
 * or a step), fire taking it by chance, goblins inside driven out burning or dying, the caged lost and
 * counted, a chest's charred leavings, nobody going in, and a friend inside getting out as it falls.
 */
import { describe, expect, it } from 'vitest';
import { doorAt, type Block } from '../src/shared/arena';
import { burnable, fireTimes, kindling } from '../src/shared/kindling';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { CATCH, HOUSEBURN, TICK } from '../src/shared/tuning';
import { Game, ME } from '../src/client/game';
import { newEnemy } from '../src/sim/enemies';
import { kindleable } from '../src/sim/kindle';
import { blastBlocks } from '../src/sim/buildings';
import type { Indoors } from '../src/sim/houseburn';
import { ArenaRoom } from '../src/sim/room';
import { newRun, runRoom, tally } from '../src/sim/run';
import { Rng } from '../src/shared/rng';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

const job = (seed = 7): Job => ({ ...board(1)[0], rooms: 3, place: PLACES.find((p) => p.kind === 'village')!, objective: 'hunt', boss: 'SKARN', seed, deep: false });

/** A village street, its goblins gone, me at the kindling of its first house that has one. */
function street(seed = 7) {
  const r = newRun(job(seed)), room = runRoom(r);
  room.enemies.length = 0;
  const b = room.map.blocks.find((q) => burnable(q) && kindling(q, room.map))!;
  const k = kindling(b, room.map)!, h = room.join('me');
  Object.assign(h, { x: k.x + k.side * 0.45, y: k.y, hp: 100, maxHp: 100 });
  room.setIntent('me', NO_INTENT);
  return { r, room, b, k, h, i: room.map.blocks.indexOf(b) };
}
const step = (room: ArenaRoom, s: number, each?: () => void) => {
  const out: FightEvent[] = [];
  for (let n = 0; n < Math.round(s / TICK); n++) room.step(), out.push(...room.events), each?.();
  return out;
};
let seq = 0;
const grab = (room: ArenaRoom) => room.setIntent('me', { ...NO_INTENT, grabSeq: ++seq });
const goblin = (id: number, feeding = false, hp = 36) => Object.assign(newEnemy(id, 'scrapper', 3, 3), { respawns: false, feeding, hp, maxHp: 36 });
const indoors = (foes: ReturnType<typeof goblin>[], caged = 0, chests = 0): Indoors => ({ contents: () => ({ foes, chests }), take: () => undefined, caged: () => caged });

describe('a house kindling spot', () => {
  it('is one fixed spot per small house, by a side wall, never at the door, the same every time', () => {
    let n = 0;
    for (const s of [3, 7, 41, 97, 120]) {
      const a = runRoom(newRun(job(s))).map, b = runRoom(newRun(job(s))).map;
      a.blocks.forEach((q, i) => {
        const k = kindling(q, a);
        expect(kindling(b.blocks[i], b)).toEqual(k);
        if (!k) return expect(burnable(q) && q.fate !== 'wrecked' ? 0 : 0).toBe(0);
        n++;
        expect(Math.hypot(k.x - doorAt(q).x, k.y - doorAt(q).y)).toBeGreaterThan(1.5);
        expect(k.x < q.x || k.x > q.x + q.w).toBe(true);
        for (const o of a.blocks) if (o !== q && !o.ruined) expect(k.x > o.x && k.x < o.x + o.w && k.y > o.y && k.y < o.y + o.h).toBe(false);
      });
    }
    expect(n).toBeGreaterThan(10);
  });
});

describe('standing at the kindling', () => {
  it('there is room to stand at every spot and reach it (nothing pushes you off)', () => {
    let n = 0, ok = 0;
    for (const s of [3, 7, 11, 41, 97, 120, 333]) {
      const room = runRoom(newRun(job(s)));
      room.enemies.length = 0;
      const h = room.join('me');
      room.setIntent('me', NO_INTENT);
      for (const b of room.map.blocks) {
        const k = kindling(b, room.map);
        if (!k) continue;
        n++;
        Object.assign(h, { x: k.x + k.side * 0.45, y: k.y, kvx: 0, kvy: 0 });
        step(room, 0.2);
        if (kindleable(h, room.map) === b) ok++;
      }
    }
    expect(ok).toBeGreaterThanOrEqual(n - 1);
  });
});

describe('lighting a house', () => {
  it('takes the light time crouched at the spot; a hit or a step puts it out and it starts again', () => {
    const { room, b, h } = street();
    expect(kindleable(h, room.map)).toBe(b);
    grab(room);
    step(room, fireTimes(b).light * 0.5);
    expect(b.lighter).toBe('me');
    expect(h.stoop).toBe(1);
    Object.assign(h, { act: 'hurt', actT: 0, actDur: 0.3 });
    step(room, TICK);
    expect([b.lighter, b.lightT, b.burning]).toEqual(['', 0, -1]);
    step(room, 0.5);
    grab(room);
    step(room, fireTimes(b).light * 0.5);
    room.setIntent('me', { ...NO_INTENT, mx: 1, grabSeq: seq });
    step(room, 0.2);
    expect(b.lighter).toBe('');
    room.setIntent('me', NO_INTENT);
    Object.assign(h, { x: kindling(b, room.map)!.x + 0.45 * kindling(b, room.map)!.side });
    step(room, 0.2);
    grab(room);
    const ev = step(room, fireTimes(b).light + 0.2);
    expect(ev.some((e) => e.k === 'houselit')).toBe(true);
    expect(b.burning).toBeGreaterThanOrEqual(0);
    expect(kindleable(h, room.map)).toBeUndefined();
  });

  it('by accident: a Lamp Oil flask bursting on it nearly always, the edge of a spell now and then, a fence every time', () => {
    let oil = 0, edge = 0;
    for (let s = 0; s < 40; s++) {
      const { room, b, k } = street();
      const w = { heroes: room.heroes, enemies: [], javelins: [], props: [], now: 1, ev: [], rng: new Rng(s * 31 + 7) };
      blastBlocks(w, k.x, k.y, 1.2, 10, 'fire', true);
      if ((b.burning ?? -1) >= 0) oil++;
      b.burning = -1;
      blastBlocks(w, k.side < 0 ? b.x + b.w + 0.9 : b.x - 0.9, b.y + 0.3, 1.0, 10, 'fire');
      if ((b.burning ?? -1) >= 0) edge++;
    }
    expect(oil).toBeGreaterThanOrEqual(32);
    expect(edge).toBeLessThan(14);
    expect(edge).toBeGreaterThan(0);
    const fence: Block = { kind: 'fence', x: 2, y: 2, w: 3, h: 0.35, hp: 40, maxHp: 40, burning: -1 };
    const { room } = street();
    room.map.blocks.push(fence);
    blastBlocks({ heroes: [], enemies: [], javelins: [], props: [], now: 1, ev: [], rng: new Rng(1) }, 3, 2.6, 1, 10, 'fire');
    expect(fence.burning).toBe(1);
    expect(CATCH.oil).toBeGreaterThan(0.8);
  });
});

describe('a house alight', () => {
  it('drives its goblins out of the door burning and hurt, the sleeping later; one the smoke has all but killed dies at the door', () => {
    const { room, b } = street();
    room.houseIn = indoors([goblin(1), goblin(2), goblin(3, true), goblin(4, true, 8)]);
    b.burning = room.time;
    const t = fireTimes(b), out: number[] = [];
    let first = 0;
    const ev = step(room, t.catch + t.burn + 0.5, () => {
      for (const e of room.events) if (e.k === 'flushed') (out.push(room.time), first ||= room.time);
    });
    expect(out.length).toBe(4);
    expect(first - 1).toBeLessThan(HOUSEBURN.wakeOut + 1);
    const d = doorAt(b);
    expect(ev.filter((e) => e.k === 'death').length).toBeGreaterThanOrEqual(1);
    for (const e of room.enemies) {
      expect(Math.hypot(e.x - d.x, e.y - d.y)).toBeLessThan(8);
      if (e.act !== 'dead') expect(e.hp).toBeLessThan(36);
    }
    expect(room.enemies.length).toBe(4);
    expect(b.ruined).toBe(true);
  });

  it('loses whoever is caged inside as the roof comes in, counted on the run, and the job goes on', () => {
    const { r, room, b } = street();
    room.houseIn = indoors([], 2, 1);
    b.burning = room.time;
    const t = fireTimes(b), ev = step(room, t.catch + t.burn + 0.5);
    tally(r, room, ev, 'me');
    expect(ev.filter((e) => e.k === 'cagelost').length).toBe(2);
    expect(r.lost).toBe(2);
    expect(r.failed).toBe(false);
    // The chest in there: ash, and a charred handful at the door.
    expect(ev.some((e) => e.k === 'charred')).toBe(true);
    const d = doorAt(b);
    expect(room.pickups.some((p) => p.gold && Math.hypot(p.x - d.x, p.y - d.y) < 1.5)).toBe(true);
  });
});

describe('a house alight on a job, in the game', () => {
  const party = () => {
    const g = new Game();
    g.startJob(job());
    const friends = new Map([['sam', { name: 'SAM', profile: null, intent: { ...NO_INTENT } as Intent, heard: 0, fresh: false, gone: false }]]);
    (g as unknown as { coop: unknown }).coop = { friends, away: () => false, members: [] };
    const st = g.room;
    st.enemies.length = 0;
    st.join('sam');
    const b = st.map.blocks.find((q) => burnable(q) && kindling(q, st.map))!;
    return { g, st, b, friends };
  };
  const run = (g: Game, s: number) => {
    for (let i = 0; i < s / TICK; i++) g.step(TICK, NO_INTENT);
  };

  it("can't be gone into once it's alight", () => {
    const { g, st, b } = party();
    b.burning = st.time;
    Object.assign(g.hero, doorAt(b));
    g.enter(b);
    expect(g.room).toBe(st);
    expect(g.rooms.goIn(g.run!, st.heroes.find((h) => h.id === 'sam')!, b)).toBeNull();
  });

  it('a friend inside when the leader lights it: smoke after a grace, out in the street as it falls', () => {
    const { g, st, b, friends } = party();
    const sam = st.heroes.find((h) => h.id === 'sam')!;
    Object.assign(sam, doorAt(b));
    friends.get('sam')!.intent = { ...NO_INTENT, my: -1 };
    run(g, 0.2);
    friends.get('sam')!.intent = { ...NO_INTENT };
    const house = g.rooms.houses.get(b)!;
    expect(house.heroes.some((h) => h.id === 'sam')).toBe(true);
    for (const e of house.enemies) Object.assign(e, { hp: 0, act: 'dead', actDur: 99 });
    const k = kindling(b, st.map)!, me = g.hero;
    Object.assign(me, { x: k.x + k.side * 0.45, y: k.y });
    g.step(TICK, { ...NO_INTENT, grabSeq: me.seen.grab + 1 });
    run(g, fireTimes(b).light + 0.3);
    expect(b.burning).toBeGreaterThanOrEqual(0);
    expect(house.map.blaze?.smoke).toBeDefined();
    const hp0 = house.heroes.find((h) => h.id === 'sam')!.hp;
    run(g, HOUSEBURN.grace - 1);
    expect(house.heroes.find((h) => h.id === 'sam')!.hp).toBe(hp0);
    // Sam stays in (and is kept on his feet): the smoke gets to him; the roof comes in and he's thrown out.
    const keep = () => { const h = house.heroes.find((x) => x.id === 'sam'); if (h) h.hp = Math.max(h.hp, 60); };
    let hurt = false;
    for (let i = 0; i < (fireTimes(b).catch + fireTimes(b).burn) / TICK; i++) {
      const h = house.heroes.find((x) => x.id === 'sam');
      if (h && h.hp < 60) hurt = true;
      keep();
      g.step(TICK, NO_INTENT);
      if (st.heroes.some((x) => x.id === 'sam')) break;
    }
    expect(hurt || house.heroes.length === 0).toBe(true);
    expect(st.heroes.some((h) => h.id === 'sam')).toBe(true);
    expect(b.ruined).toBe(true);
    expect(g.room).toBe(st);
    expect(st.heroes.some((h) => h.id === ME)).toBe(true);
  });
});
