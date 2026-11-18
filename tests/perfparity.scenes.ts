/**
 * Seeded fights for the performance sweep's parity tests (docs/design/perf-sweep.md): the same jobs, bots and
 * presses every run, so a change that is meant to cost less and decide nothing can be held to exactly that.
 * Nothing here is random: bots walk and swing by their own seeded Rng (sim/bots.ts), and press the other
 * buttons by the tick count.
 */
import { expedition } from '../src/shared/expedjob';
import { board, deepDive, PLACES, type Job, type PlaceKind } from '../src/shared/jobs';
import { landJob } from '../src/shared/territory';
import { EXPED } from '../src/shared/tuning';
import { addBots, bigRoom } from '../src/sim/bigroom';
import { drive, newBot, type Bot } from '../src/sim/bots';
import type { ArenaRoom } from '../src/sim/room';
import { newRun, runRoom, type Run } from '../src/sim/run';
import type { Enemy, Intent } from '../src/sim/types';

export const IDS = ['me', 'b2', 'b3', 'b4'];
export interface Scene { name: string; room: ArenaRoom; run: Run | null; bots: Bot[]; kept: Enemy[] | null; ticks: number }

const place = (kind: PlaceKind) => PLACES.find((p) => p.kind === kind)!;
const jobAt = (kind: PlaceKind, objective: Job['objective'], seed: number): Job => ({ ...board(1)[0], rooms: 3, place: place(kind), objective, seed });

function party(room: ArenaRoom, at: (i: number) => { x: number; y: number }, home: { x: number; y: number }, seed: number): Bot[] {
  return IDS.map((id, i) => {
    const h = room.join(id), p = at(i);
    Object.assign(h, p);
    room.prev.set('h:' + id, [h.x, h.y]);
    const b = newBot(id, p, seed + i * 17);
    b.home = home;
    return b;
  });
}

function jobScene(name: string, job: Job, ticks = 600): Scene {
  const run = newRun(job);
  run.party = IDS.length;
  const room = runRoom(run), s = room.map.hero;
  const bots = party(room, (i) => ({ x: s.x + (i % 2) * 0.9, y: s.y - Math.floor(i / 2) * 0.9 }), { x: room.map.w / 2, y: room.map.h / 2 }, 1000);
  return { name, room, run, bots, kept: null, ticks };
}

/** An expedition with `n` goblins awake and on the party, kept up (scripts/bigmap/swarm.ts). */
function swarmScene(n: number, ticks: number): Scene {
  const was = { goblins: EXPED.goblins, cap: EXPED.cap };
  Object.assign(EXPED, { goblins: Math.max(150, n + 40), cap: n + 200 });
  const run = newRun(expedition(4));
  run.party = IDS.length;
  const room = runRoom(run), ins = room.map.hero, c = { x: ins.x, y: ins.y - 6 };
  const bots = party(room, (i) => ({ x: c.x + (i % 2) * 1.5, y: c.y + Math.floor(i / 2) * 1.5 }), c, 300);
  const kept = room.allEnemies.filter((e) => e.act !== 'dead').slice(0, n);
  kept.forEach((e, i) => {
    const a = (i / n) * Math.PI * 2, d = 5 + (i % 5) * 2;
    Object.assign(e, { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, dozing: false });
  });
  Object.assign(EXPED, was);
  return { name: `swarm${n}`, room, run, bots, kept, ticks };
}

function bigScene(ticks: number): Scene {
  const room = bigRoom(3, 300, true), bots = addBots(room, IDS);
  bots.forEach((b, i) => {
    const h = room.heroes.find((x) => x.id === b.id)!, home = { x: 18 + i * 1.2, y: 18 };
    Object.assign(h, home), Object.assign(b, newBot(b.id, home, 1000 + i)), (b.home = { x: 30, y: 30 });
  });
  return { name: 'big300', room, run: null, bots, kept: null, ticks };
}

/** Every scene, built fresh, in a fixed order (ids are counted out as rooms are made, so the order is part of the record). */
export function scenes(): Scene[] {
  return [
    jobScene('village-rescue', jobAt('village', 'rescue', 77)),
    jobScene('farm-larder', jobAt('farm', 'larder', 78)),
    jobScene('field-hunt', jobAt('field', 'hunt', 79)),
    jobScene('forest-burn', jobAt('forest', 'burn', 80)),
    jobScene('mine-hunt', jobAt('mine', 'hunt', 81)),
    jobScene('river-rescue', jobAt('river', 'rescue', 82)),
    jobScene('marsh-hunt', jobAt('marsh', 'hunt', 83)),
    jobScene('ruins-burn', jobAt('ruins', 'burn', 84)),
    jobScene('board-day2', board(2)[1]),
    jobScene('deep-dive', deepDive(1), 500),
    jobScene('hill-land', landJob('hill', 3), 700),
    swarmScene(60, 600),
    bigScene(400),
  ];
}

/** A bot's Intent this tick: its walk and swing (sim/bots.ts), and the other buttons by the clock. */
function intentOf(b: Bot, i: number, room: ArenaRoom, press: Record<string, number>[]): Intent {
  const t = room.tick + i * 13, p = press[i];
  if (t % 47 === 0) p.rollSeq++;
  if (t % 120 === 60) p.classSeq++;
  if (t % 150 === 75) p.relicSeq++;
  if (t % 90 === 45) p.grabSeq++;
  if (t % 200 === 100) p.weaponSeq++;
  if (t % 300 === 150) p.potionSeq++;
  if (t % 80 === 40) p.blockSeq++;
  return { ...drive(b, room, 12), ...p, block: t % 80 >= 40 && t % 80 < 52 };
}

/** One tick of a scene; nobody goes down for good, so the fight lasts the whole run. */
export function stepScene(s: Scene, press: Record<string, number>[]): void {
  const { room, bots, kept } = s;
  for (const h of room.heroes) if (h.hp < h.maxHp / 2) h.hp = h.maxHp;
  for (const e of kept ?? []) if (e.hp < e.maxHp / 2 || e.act === 'dead') Object.assign(e, { hp: e.maxHp, act: e.act === 'dead' ? 'idle' : e.act });
  bots.forEach((b, i) => room.setIntent(b.id, intentOf(b, i, room, press)));
  room.step();
}

export const newPress = () => IDS.map(() => ({ rollSeq: 0, classSeq: 0, relicSeq: 0, grabSeq: 0, weaponSeq: 0, potionSeq: 0, blockSeq: 0 }));

/** FNV-1a over a string, as 8 hex digits. */
export function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) (h ^= s.charCodeAt(i)), (h = Math.imul(h, 0x01000193));
  return (h >>> 0).toString(16).padStart(8, '0');
}
