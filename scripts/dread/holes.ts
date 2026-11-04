/**
 * Hunting the holes: every way a hero can end up out of bounds. For a spread of maps (the town, the
 * yard, the wood, every kind of job place and their houses), first checks the out-of-bounds rule has
 * no false alarms (goblins, chests, doors, ways out and people are all on walkable ground), then stands
 * a hero by every wall, tree and river and tries to get through: a Mage's far blink, a roll, a Warrior's
 * shield charge, a shadowstep with nobody to step behind, a hard knockback. Prints what got out.
 *   npx tsx scripts/dread/holes.ts
 */
import { collide, doorAt, doorOut, inArea, useMap, type GameMap } from '../../src/shared/arena';
import { board, PLACES, type Job } from '../../src/shared/jobs';
import { planRoom } from '../../src/shared/terrain';
import { runInterior } from '../../src/shared/inside';
import { townMap } from '../../src/shared/town';
import { townInterior } from '../../src/shared/interiors';
import { woodMap } from '../../src/shared/wood';
import { ARENA } from '../../src/shared/arena';
import { onWalkedGround, outOfBounds } from '../../src/shared/reach';
import { ArenaRoom } from '../../src/sim/room';
import { shadowstep } from '../../src/sim/relics';
import { NO_INTENT } from '../../src/sim/types';
import { newWorld } from '../../src/shared/story';

type Spot = { x: number; y: number; what: string; z?: number };
const maps: { name: string; map: GameMap; spots: Spot[] }[] = [];
const add = (name: string, map: GameMap, spots: Spot[] = []) => maps.push({ name, map, spots });
const world = newWorld();
add('town', townMap(world), (townMap(world).npcs ?? []).filter((n) => !n.path).map((n) => ({ x: n.x, y: n.y + 0.5, what: 'npc ' + n.name })));
for (const d of townMap(world).blocks.filter((b) => b.door)) {
  try { add('town:' + d.door, townInterior(d.door!, world)); } catch { /* not every door has a room */ }
}
add('yard', ARENA as unknown as GameMap);
add('wood', woodMap());
for (const p of PLACES) for (const seed of [3, 41]) {
  const job: Job = { ...board(2)[1], rooms: 3, place: p, objective: 'rescue', seed };
  for (let i = 0; i < 3; i++) {
    const plan = planRoom(job, i);
    const spots: Spot[] = [
      ...plan.foes.filter((f) => f.kind !== 'nest').map((f) => ({ x: f.x, y: f.y, z: f.z, what: 'foe ' + f.kind })),
      ...(plan.chests ?? []).map((c) => ({ x: c.x, y: c.y + 0.7, what: 'chest' })),
      ...plan.map.blocks.filter((b) => b.door && b.fate !== 'blocked').map((b) => ({ ...doorOut(b, 0.5), what: 'door' })),
      ...(plan.map.exit ? [{ x: plan.map.exit.x + plan.map.exit.w / 2, y: plan.map.exit.y + plan.map.exit.h / 2, what: 'exit' }] : []),
      ...(plan.map.roads ?? []).map((r) => ({ x: r.area.x + r.area.w / 2, y: r.area.y + r.area.h / 2, what: 'road' })),
    ];
    add(`${p.name}#${seed}/${i}`, plan.map, spots);
    plan.map.blocks.forEach((b, bi) => {
      if (!b.door || i) return;
      try { add(`${p.name}#${seed}/${i} in ${b.door}`, runInterior(job, i, bi, b.door).map); } catch { /* */ }
    });
  }
}

const tries = ['blink', 'roll', 'bash', 'shadow', 'knock', 'walk'] as const;
const report: Record<string, number> = {}, examples: string[] = [];
let falseAlarms = 0;
for (const { name, map, spots } of maps) {
  useMap(map);
  for (const s of spots) if (outOfBounds(map, s.x, s.y, s.z) && !inArea(map.exit, s.x, s.y)) (falseAlarms++, console.log(`FALSE ALARM? ${name}: ${s.what} at ${s.x.toFixed(1)},${s.y.toFixed(1)}`));
  if (outOfBounds(map, map.hero.x, map.hero.y)) console.log(`FALSE ALARM? ${name}: the way in`);
  // Spots on walkable ground near something solid, spread out.
  const near: Spot[] = [];
  for (let y = 0.5; y < map.h; y += 1.1) for (let x = 0.5; x < map.w; x += 1.1) {
    if (!onWalkedGround(map, x, y) || outOfBounds(map, x, y)) continue;
    { const q = { x, y }; useMap(map); collide(q, 0.32); if (Math.hypot(q.x - x, q.y - y) > 1e-6) continue; }
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => outOfBounds(map, x + dx * 1.2, y + dy * 1.2))) near.push({ x, y, what: '' });
  }
  const sample = near.filter((_, i) => i % Math.max(1, Math.floor(near.length / 120)) === 0);
  const room = new ArenaRoom(1, { map, foes: [] });
  room.enemies = [];
  const h = room.join('me');
  for (const s of sample) for (let a = 0; a < 8; a++) for (const t of tries) {
    const dx = Math.cos((a * Math.PI) / 4), dy = Math.sin((a * Math.PI) / 4);
    Object.assign(h, { x: s.x, y: s.y, z: 0, act: 'idle', actT: 0, kvx: 0, kvy: 0, stamina: 100, winded: false, lastRollAt: -99, fx: dx, fy: dy, hp: 100, hitstop: 0, perks: t === 'blink' ? ['m_leap'] : [] });
    h.weapon = t === 'blink' ? 'wand' : t === 'bash' ? 'sword' : 'daggers';
    room.setIntent('me', { ...NO_INTENT, mx: dx, my: dy, rollSeq: (h.seen.roll + 1) % 1000 });
    if (t === 'bash') Object.assign(h, { act: 'bash', actT: 0, rollDx: dx, rollDy: dy }), room.setIntent('me', { ...NO_INTENT, rollSeq: h.seen.roll });
    if (t === 'shadow') shadowstep(h, [], [], room.time), room.setIntent('me', { ...NO_INTENT, rollSeq: h.seen.roll });
    if (t === 'knock') Object.assign(h, { kvx: dx * 18, kvy: dy * 18, act: 'hurt', actT: 0, actDur: 0.5 }), room.setIntent('me', { ...NO_INTENT, rollSeq: h.seen.roll });
    if (t === 'walk') room.setIntent('me', { ...NO_INTENT, mx: dx, my: dy, rollSeq: h.seen.roll });
    for (let i = 0; i < (t === 'walk' ? 45 : 12); i++) room.step();
    if (outOfBounds(map, h.x, h.y, h.z)) {
      const k = `${t}`;
      report[k] = (report[k] ?? 0) + 1;
      if (examples.length < 25) examples.push(`${t} in ${name} from ${s.x.toFixed(1)},${s.y.toFixed(1)} dir ${a} -> ${h.x.toFixed(2)},${h.y.toFixed(2)}`);
    }
  }
}
console.log(`maps ${maps.length}, false alarms ${falseAlarms}`);
console.log('got out:', report);
for (const e of examples) console.log('  ' + e);
