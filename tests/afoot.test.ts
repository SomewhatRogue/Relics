/**
 * Standing on the ground (sim/afoot.ts; docs/design/elevation.md, "The rethink"): where the levels are the ground
 * (the proving hill, the town), a body at level 1 or 2 is on the ground, and fire, storm, bursts, snares and the
 * shoving apart of bodies treat it so; the high ground is relative. Elsewhere nothing changed.
 */
import { describe, expect, it } from 'vitest';
import { useMap, type GameMap } from '../src/shared/arena';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { Rng } from '../src/shared/rng';
import { planRoom } from '../src/shared/terrain';
import { landJob } from '../src/shared/territory';
import { HEIGHT, LIGHTNING, OIL, TICK } from '../src/shared/tuning';
import { afoot, landed } from '../src/sim/afoot';
import { stepBlasts } from '../src/sim/blast';
import { blastSpec } from '../src/sim/blastshape';
import { separate } from '../src/sim/bodies';
import type { World } from '../src/sim/elements';
import { newEnemy } from '../src/sim/enemies';
import { newHero } from '../src/sim/hero';
import { slickId, stepSlicks } from '../src/sim/oil';
import { laySnare, stepSnare } from '../src/sim/ranger';
import { ArenaRoom } from '../src/sim/room';
import { newRun, runRoom } from '../src/sim/run';
import { stepStorm } from '../src/sim/storm';
import { NO_INTENT, type Bolt, type Enemy, type FightEvent, type Hero, type Snare } from '../src/sim/types';

/** The proving hill's room, its goblins cleared away. */
function land() {
  const room = runRoom(newRun(landJob('hill', 3)));
  for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false });
  return room;
}
const LOW = land().map;
const world = (heroes: Hero[], enemies: Enemy[], now = 0): World => ({ heroes, enemies, javelins: [], props: [], now, ev: [] });
const goblin = (id: number, x: number, y: number, z: number) => Object.assign(newEnemy(id, 'scrapper', x, y), { z, hp: 999, maxHp: 999, respawns: false, alert: false, cooldown: 99 });
const hero = (x: number, y: number, z: number) => Object.assign(newHero('me', x, y), { z, safeT: 0, hp: 500, maxHp: 500 });

describe('afoot on a landed map', () => {
  it('is the level under you, or a slope; never a goblin above its ground, never dug under', () => {
    useMap(LOW);
    expect(landed(LOW)).toBe(true);
    expect(afoot({ x: 24, y: 14, z: 2 })).toBe(true);
    expect(afoot({ x: 22, y: 51, z: 1 })).toBe(true);
    expect(afoot({ x: 22, y: 84, z: 0 })).toBe(true);
    expect(afoot({ x: 20, y: 70, z: 0 })).toBe(true);
    expect(afoot({ x: 20, y: 70, z: 1 })).toBe(true);
    expect(afoot({ x: 22, y: 32, z: 2 })).toBe(false);
    for (const [x, y] of [[24, 14], [22, 51], [22, 84]]) expect(afoot({ x, y, z: -1 })).toBe(false);
  });
});

describe('the ground at level 2 is ground', () => {
  it('lit oil burns a goblin and a hero standing in it up on level 2', () => {
    useMap(LOW);
    const g = goblin(1, 24, 14, 2), h = hero(24.2, 14, 2), w = world([h], [g], 0.5);
    stepSlicks([{ id: slickId(), x: 24, y: 14, r: OIL.radius, until: 99, lit: 0 }], w, TICK);
    expect(g.burnUntil).toBeGreaterThan(w.now);
    expect(h.hp).toBeLessThan(500);
  });

  it('the storm strikes a goblin on level 2', () => {
    useMap(LOW);
    const g = goblin(1, 24, 14, 2);
    const r = { map: LOW, heroes: [], enemies: [g], survivors: [], time: 1, events: [] as FightEvent[], indoors: false, strikes: [{ id: 1, x: 24, y: 14, r: LIGHTNING.r, at: 0.5, on: 'goblin' as const }], nextStrike: -1 };
    stepStorm(r, new Rng(3));
    expect(g.hp).toBeLessThan(g.maxHp);
  });

  it('a burst on level 2 hurts a hero beside it on level 2, not one in its reach down in the lane', () => {
    useMap(LOW);
    const r = blastSpec('keg').r, bx = 17.4, y = 27;
    const up = hero(bx - Math.min(0.4, r / 2), y, 2), down = Object.assign(hero(18.5, y, 1), { id: 'pal' });
    expect(Math.hypot(down.x - bx, 0)).toBeLessThan(r);
    const k = Object.assign(goblin(1, bx, y, 2), { variant: 'kegman' as const });
    k.blast = { k: 'keg', x: bx, y, r, at: 0 };
    stepBlasts(world([up, down], [k], 0.01));
    expect(up.hp).toBeLessThan(500);
    expect(down.hp).toBe(500);
  });

  it('two goblins overlapping on level 2 are pushed apart', () => {
    useMap(LOW);
    const a = goblin(1, 24, 14, 2), b = goblin(2, 24.1, 14, 2);
    separate([], [a, b]);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(0.11);
  });

  it("a Ranger's snare catches a goblin on level 1", () => {
    useMap(LOW);
    const h = Object.assign(newHero('me', 22, 51), { z: 1, weapon: 'longbow', rollX: 22, rollY: 51 }), snares: Snare[] = [], ev: FightEvent[] = [];
    laySnare(h, snares, 1, ev);
    const g = goblin(1, 22.2, 51, 1);
    expect(stepSnare(snares[0], [g], 3, ev)).toBe(false);
    expect(g.act).toBe('stunned');
  });
});

/** The Ranger at (x, y, z) draws a longbow fully and lets go facing (fx, fy): the arrow as loosed, and what `e` lost. */
function loose(room: ArenaRoom, h: Hero, fx: number, fy: number, e?: Enemy) {
  Object.assign(h, { weapon: 'longbow', fx, fy, hp: 1e6, maxHp: 1e6 });
  if (e) room.enemies.push(e);
  for (let i = 0; i < 1 / TICK; i++) room.setIntent(h.id, { ...NO_INTENT, attack: true, attackSeq: 1, ax: fx, ay: fy }), room.step();
  let shot: Bolt | undefined;
  for (let i = 0; i < 2 / TICK; i++) {
    room.setIntent(h.id, { ...NO_INTENT, attack: false, attackSeq: 1 }), room.step();
    const b = room.bolts.find((o) => o.kind === 'arrow' && o.owner === h.id);
    if (b && !shot) shot = { ...b };
  }
  return { shot: shot!, lost: e ? e.maxHp - e.hp : 0 };
}
const placed = (room: ArenaRoom, x: number, y: number, z: number) => Object.assign(room.join('me'), { x, y, z, safeT: 99 });

describe('the high ground is relative where the levels are the ground', () => {
  it('from level 2 down at level 1 it lands a quarter harder; at level 2, or up from level 1, it does not', () => {
    let room = land();
    const down = loose(room, placed(room, 22, 20, 2), 0, 1, goblin(901, 22, 27, 1));
    room = land();
    const level = loose(room, placed(room, 22, 16, 2), 0, 1, goblin(902, 22, 22.5, 2));
    room = land();
    const upward = loose(room, placed(room, 22, 28, 1), 0, -1, goblin(903, 22, 22.5, 2));
    expect(down.shot.hz).toBe(2);
    expect(upward.shot.hz).toBe(1);
    for (const s of [down, level, upward]) expect(s.shot.dmg).toBe(level.shot.dmg);
    expect(level.lost).toBe(level.shot.dmg);
    expect(upward.lost).toBe(level.lost);
    expect(down.lost).toBe(Math.round(level.shot.dmg * HEIGHT.shot));
  });
});

const job = (kind: Job['place']['kind']): Job => ({ ...board(1)[0], layout: undefined, place: PLACES.find((p) => p.kind === kind)!, objective: 'hunt', boss: 'SKARN', seed: 31, rooms: 3 });
describe('off a landed map nothing changed', () => {
  it('a built shelf (a deck, a gantry: a ledge with no level) is as it was: an archer on it is not afoot, and a shot from it is a quarter harder as it leaves', () => {
    // (A job room's own raised ground is a raised area under the land's rules since 2026-11-18: earth outdoors, rock in
    // a mine, its level ground. The old shelf is still what a built thing is, the Open Cut's gantry for one, so the
    // same room is taken here with its ledge made a wooden deck again.)
    expect(planRoom(job('mine'), 2, 'high').map.ledges![0]).toMatchObject({ kind: 'crag', lv: 1 });
    expect(landed(planRoom(job('mine'), 2, 'high').map)).toBe(true);
    const high = (): { room: ArenaRoom; map: GameMap } => {
      const plan = planRoom(job('mine'), 2, 'high'), map: GameMap = { ...plan.map, ledges: plan.map.ledges!.map(({ lv: _lv, ...l }) => ({ ...l, kind: 'wood' as const })) };
      return { room: new ArenaRoom(3, { map, foes: [], furniture: [] }), map };
    };
    let { room, map } = high();
    const l = map.ledges![0], x = l.x + l.w / 2, y = l.y + l.h / 2;
    expect(landed(map)).toBe(false);
    expect(afoot({ x, y, z: 1 }, map)).toBe(false);
    expect(afoot({ x, y, z: 0 }, map)).toBe(true);
    const shelf = loose(room, placed(room, x, y, 1), 0, 1);
    ({ room } = high());
    const ground = loose(room, placed(room, x, l.y + l.h + 1.5, 0), 0, 1);
    expect(shelf.shot.hz).toBeUndefined();
    expect(Math.abs(shelf.shot.dmg - ground.shot.dmg * HEIGHT.shot)).toBeLessThanOrEqual(1);
    expect(shelf.shot.dmg).toBeGreaterThan(ground.shot.dmg);
  });
});
