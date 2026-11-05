// How often packs rush (sim/packrush.ts), measured in real job rooms: bot heroes (a sword each, who
// can't be hurt) walk at the nearest goblin that could be in a rush (awake first), face it and swing
// every `SWING` seconds while within 2 tiles; the room does the rest. A second counts as fighting while
// such a goblin is awake within RUSH.fight of a hero. Each room runs until those are dead or `MAX` s.
// Usage: npx tsx scripts/encounters/rushes.ts [rooms, default 40] [swing seconds, default 0.6]
import { board } from '../../src/shared/jobs';
import { RUSH, TICK } from '../../src/shared/tuning';
import { newRun, runRoom } from '../../src/sim/run';
import { isDead } from '../../src/sim/damage';
import { melee } from '../../src/sim/packrush';
import { NO_INTENT } from '../../src/sim/types';

const ROOMS = Number(process.argv[2]) || 40, SWING = Number(process.argv[3]) || 0.6, MAX = 120;
const jobs = Array.from({ length: 30 }, (_, d) => board(d + 1)).flat();
const picks = jobs.flatMap((j) => Array.from({ length: j.rooms }, (_, i) => ({ j, i }))).filter((_, k) => k % 3 === 0).slice(0, ROOMS);

for (const party of [1, 4]) {
  let fight = 0, rushes = 0, parts = 0, perHero = new Map<string, number>(), live = 0, gaps: number[] = [];
  for (const { j, i } of picks) {
    const run = { ...newRun(j), index: i, party };
    const room = runRoom(run);
    const ids = Array.from({ length: party }, (_, k) => 'p' + k);
    for (const id of ids) Object.assign(room.join(id), { weapon: 'sword', safeT: 0 });
    const last = new Map<string, number>();
    for (let t = 0; t < MAX / TICK; t++) {
      const awake = room.enemies.filter((e) => !isDead(e) && e.pack !== undefined && (e.kind === 'scrapper' || e.kind === 'butcher'));
      if (!awake.some(melee)) break;
      for (const h of room.heroes) {
        h.hp = h.maxHp;
        const by = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y);
        const near = awake.filter((e) => melee(e) && e.alert !== false).sort(by)[0] ?? awake.filter(melee).sort(by)[0];
        const dx = near.x - h.x, dy = near.y - h.y, d = Math.hypot(dx, dy) || 1;
        room.setIntent(h.id, { ...NO_INTENT, ax: dx / d, ay: dy / d, mx: d > 1.4 ? dx / d : 0, my: d > 1.4 ? dy / d : 0, attackSeq: d < 2 ? Math.floor(room.time / SWING) : 0 });
      }
      room.step();
      const fighting = awake.some((e) => melee(e) && !isDead(e) && e.alert !== false && room.heroes.some((h) => h.act !== 'down' && Math.hypot(h.x - e.x, h.y - e.y) < RUSH.fight));
      if (fighting) fight += TICK;
      live = Math.max(live, room.rushes.live.length);
      for (const ev of room.events) if (ev.k === 'rush') {
        rushes++, parts += ev.n;
        perHero.set(ev.id, (perHero.get(ev.id) ?? 0) + 1);
        if (last.has(ev.id)) gaps.push(room.time - last.get(ev.id)!);
        last.set(ev.id, room.time);
      }
    }
  }
  gaps = gaps.sort((a, b) => a - b);
  const mins = fight / 60;
  console.log(`party ${party}: ${picks.length} rooms, ${mins.toFixed(1)} min of fighting, ${rushes} rushes (${(rushes / mins).toFixed(1)} a minute; ${(rushes / mins / party).toFixed(1)} a hero a minute), ${(parts / Math.max(1, rushes)).toFixed(1)} goblins a rush, most at once ${live}, seconds between rushes on one hero median ${gaps[Math.floor(gaps.length / 2)]?.toFixed(1) ?? '-'}, by hero ${[...perHero.values()].join('/')}`);
}
