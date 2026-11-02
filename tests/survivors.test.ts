/** The freed: a body the party can hurt and kill, brought home out of the house (or back to the way in), tallied. */
import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { blast, shoot } from '../src/sim/bolts';
import { damageProp, newProp } from '../src/sim/props';
import { freeSurvivor, walkOut } from '../src/sim/survivors';
import { ambush } from '../src/sim/ambush';
import { newRun, tally, goal } from '../src/sim/run';
import { AMBUSH, BOUNTY, SURVIVOR, TICK, WEAPONS, type Swing } from '../src/shared/tuning';
import { Rng } from '../src/shared/rng';
import { STAT_NAME, STAT_ORDER, SHAME } from '../src/shared/progress';
import { fromJson } from '../src/client/save';
import { newWorld } from '../src/shared/story';
import { clean } from '../api/_world';
import { COLLS } from '../src/client/snap';
import { NO_INTENT, type FightEvent } from '../src/sim/types';
import type { Job } from '../src/shared/jobs';
import type { World } from '../src/sim/elements';

const ticks = (s: number) => Math.round(s / TICK);
const job = (objective: Job['objective'] = 'hunt') => ({ objective, rooms: 1, seed: 1 }) as unknown as Job;

/** One player in an empty room, a freed survivor standing right in front of them (long since stood up). */
function solo() {
  const room = new ArenaRoom(3, { scrappers: false, props: false });
  room.enemies.length = 0;
  room.indoors = true;
  const h = room.join('kyle-0001');
  Object.assign(h, { x: 9, y: 8, fx: 1, fy: 0 });
  const s = freeSurvivor(room.survivors, 10, 8, -5);
  return { room, h, s };
}
const world = (room: ArenaRoom): World => ({ heroes: room.heroes, enemies: room.enemies, javelins: room.javelins, props: room.props, survivors: room.survivors, now: room.time, ev: room.events });

describe('the freed can be hurt by the party', () => {
  it('a swing that catches a survivor hurts them, at full weight, solo too', () => {
    const { room, h, s } = solo();
    room.setIntent(h.id, { ...NO_INTENT, attackSeq: 1 });
    const ev: FightEvent[] = [];
    for (let i = 0; i < ticks(0.6); i++) room.step(), ev.push(...room.events);
    expect(s.hp).toBe(SURVIVOR.hp - WEAPONS[h.weapon].combo[0].dmg);
    expect(ev).toContainEqual(expect.objectContaining({ k: 'survivorhit', id: s.id, by: h.id }));
  });

  it('enough of them kills them, and it counts against the one who struck', () => {
    const { room, h, s } = solo();
    const run = newRun(job());
    for (let n = 1; n <= 4 && !s.dead; n++) {
      Object.assign(h, { x: s.x - 1, y: s.y, fx: 1, fy: 0 });
      room.setIntent(h.id, { ...NO_INTENT, attackSeq: n });
      for (let i = 0; i < ticks(0.9); i++) room.step(), tally(run, room, room.events, 'me');
    }
    expect(s.dead).toBe(true);
    expect(run.rescueKills).toEqual({ [h.id]: 1 });
    expect(run.rescueHits![h.id]).toBeGreaterThanOrEqual(2);
    // And they stay where they fell.
    const at = { x: s.x, y: s.y };
    for (let i = 0; i < ticks(2); i++) room.step();
    expect(s).toMatchObject({ dead: true, gone: false, ...at });
  });

  it('an arrow in the way stops in them, and a blast catches them', () => {
    const { room, h, s } = solo();
    const arrow = shoot(h, { shot: 'arrow', dmg: 9, range: 8, knock: 2, speed: 20 } as Swing, '');
    room.bolts.push(arrow);
    for (let i = 0; i < ticks(0.3); i++) room.step();
    expect(s.hp).toBe(SURVIVOR.hp - 9);
    expect(room.bolts).not.toContain(arrow);
    const orb = { ...shoot(h, { shot: 'orb', dmg: 8, range: 8, knock: 4, speed: 20, burst: 1.5 } as Swing, 'fire') };
    blast(world(room), orb, s.x + 0.5, s.y);
    expect(s.hp).toBe(SURVIVOR.hp - 17);
    expect(s.burnUntil).toBeGreaterThan(room.time);
  });

  it("the blow that breaks the cage doesn't land on whoever's inside", () => {
    const { room, h } = solo();
    room.survivors.length = 0;
    const cage = newProp('cage', 10, 8, false);
    room.props.push(cage);
    damageProp(cage, 999, world(room));
    const blastHere = shoot(h, { shot: 'orb', dmg: 30, range: 8, knock: 4, speed: 20, burst: 1.5 } as Swing, '');
    blast(world(room), blastHere, 10, 8);
    expect(room.survivors).toHaveLength(1);
    expect(room.survivors[0].hp).toBe(SURVIVOR.hp);
  });
});

describe('bringing them home', () => {
  it('freed is not saved: they count once out of the house, and a killed one never does', () => {
    const { room, h, s } = solo();
    const run = newRun(job());
    // Standing right by the house's way in still isn't out of it.
    Object.assign(s, { x: room.map.hero.x, y: room.map.hero.y });
    for (let i = 0; i < 5; i++) room.step(), tally(run, room, room.events, 'me');
    expect(run.rescued).toBe(0);
    // Out the door with the party: home.
    const street = new ArenaRoom(4, { scrappers: false, props: false });
    street.enemies.length = 0;
    Object.assign(h, { x: s.x + 1, y: s.y });
    walkOut(room.survivors, room.heroes, street.survivors, 9, 9);
    street.step();
    tally(run, street, street.events, 'me');
    expect(run.rescued).toBe(1);
    expect(run.xp).toBe(BOUNTY.rescue);
    // Home, they're out of reach, and walk off.
    expect(street.survivors[0].home).toBeGreaterThan(0);
    for (let i = 0; i < ticks(SURVIVOR.walkOff + 1); i++) street.step();
    expect(street.survivors[0].gone).toBe(true);
    // Killed before they're out: no rescue, no experience.
    const b = solo();
    b.s.hp = 1;
    b.room.setIntent(b.h.id, { ...NO_INTENT, attackSeq: 1 });
    const run2 = newRun(job());
    for (let i = 0; i < ticks(0.6); i++) b.room.step(), tally(run2, b.room, b.room.events, 'me');
    expect(b.s.dead).toBe(true);
    walkOut(b.room.survivors, b.room.heroes, street.survivors, 9, 9);
    expect(street.survivors).toHaveLength(1);
    expect(run2.rescued).toBe(0);
  });

  it('caged out in the open, they are home back where the party came in; the rescue waits on them', () => {
    const room = new ArenaRoom(5, { scrappers: false, props: false });
    room.enemies.length = 0;
    const h = room.join('kyle-0001'), run = newRun(job('rescue'));
    Object.assign(h, { x: 4, y: 3 });
    const s = freeSurvivor(room.survivors, 4, 4.5, -5);
    room.step();
    expect(goal(run, room).done).toBe(false);
    // The party walks back to the way in; they follow.
    for (let i = 0; i < ticks(12); i++) {
      const dx = room.map.hero.x - h.x, dy = room.map.hero.y - h.y, d = Math.hypot(dx, dy);
      room.setIntent(h.id, d > 0.3 ? { ...NO_INTENT, mx: dx / d, my: dy / d } : NO_INTENT);
      room.step();
      tally(run, room, room.events, 'me');
    }
    expect(s.home).toBeGreaterThan(0);
    expect(run.rescued).toBe(1);
    expect(goal(run, room).done).toBe(true);
  });

  it("they follow at a gap and keep out of the hero's way", () => {
    const { room, h, s } = solo();
    Object.assign(s, { x: 4, y: 8 });
    for (let i = 0; i < ticks(4); i++) room.step();
    const d = Math.hypot(s.x - h.x, s.y - h.y);
    expect(d).toBeGreaterThan(SURVIVOR.gap - 0.2);
    expect(d).toBeLessThan(SURVIVOR.gap + 0.3);
    // Walked into, they step aside; the hero isn't pushed.
    Object.assign(s, { x: h.x + 0.1, y: h.y });
    const hx = h.x;
    room.step();
    expect(h.x).toBeCloseTo(hx, 5);
    expect(Math.hypot(s.x - h.x, s.y - h.y)).toBeGreaterThan(0.5);
  });
});

describe('an ambush at the door', () => {
  it('a third of the time or so, a small group, scaled with the party, the same for the same seed', () => {
    let hits = 0, most = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const room = new ArenaRoom(seed, { scrappers: false, props: false });
      room.enemies.length = 0;
      room.join('a-0000001'), room.join('b-0000001'), room.join('c-0000001');
      const n = ambush(room.enemies, room.heroes, new Rng(seed), 9, 8, []);
      if (n) hits++;
      most = Math.max(most, n);
      expect(room.enemies.every((e) => e.alert && !e.respawns)).toBe(true);
    }
    expect(hits / 300).toBeGreaterThan(0.25);
    expect(hits / 300).toBeLessThan(0.42);
    expect(most).toBeLessThanOrEqual(AMBUSH.most);
    const once = (seed: number) => {
      const room = new ArenaRoom(1, { scrappers: false, props: false });
      room.enemies.length = 0;
      ambush(room.enemies, room.heroes, new Rng(seed), 9, 8, []);
      return room.enemies.map((e) => [e.x, e.y, e.variant]);
    };
    expect(once(7)).toEqual(once(7));
  });
  it('the room rolls it when someone is brought out of a door', () => {
    let rooms = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const inside = new ArenaRoom(seed, { scrappers: false, props: false }), street = new ArenaRoom(seed + 100, { scrappers: false, props: false });
      inside.enemies.length = street.enemies.length = 0;
      const h = inside.join('kyle-0001');
      freeSurvivor(inside.survivors, h.x + 1, h.y, -5);
      street.join('kyle-0001');
      walkOut(inside.survivors, inside.heroes, street.survivors, 9, 9);
      street.step();
      if (street.enemies.length) rooms++;
    }
    expect(rooms).toBeGreaterThan(3);
    expect(rooms).toBeLessThan(20);
  });
});

describe('the Roll', () => {
  it('rescues struck and killed take the place of picked up by friends on the unlucky side', () => {
    expect(SHAME).toEqual(['falls', 'rescueHits', 'rescueKills', 'teamkills']);
    expect(STAT_ORDER).not.toContain('carried');
    expect(STAT_NAME.rescueHits).toBe('RESCUES STRUCK');
    expect(STAT_NAME.rescueKills).toBe('RESCUES KILLED');
    expect(clean({ hero: { id: 'hkyle00001', name: 'K', cls: 'WARRIOR' }, stats: { rescueHits: 4, rescueKills: 999, carried: 2 } })!.stats).toEqual({ rescueHits: 4, rescueKills: 16 });
    expect(COLLS).toContain('survivors');
  });
  it('old saves load with the new tallies at nothing', () => {
    const old = { name: 'OLD', cls: 'WARRIOR', stats: { jobs: 3, saved: 2, kills: 9, given: 0, dens: 0, butchers: 0, gold: 5, raised: 0, falls: 1, carried: 2, teamkills: 0 } };
    const s = fromJson({ heroes: [old as never], current: 0, world: newWorld() })!;
    expect(s.heroes[0].stats).toMatchObject({ jobs: 3, carried: 2, rescueHits: 0, rescueKills: 0 });
  });
});
