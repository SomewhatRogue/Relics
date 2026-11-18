// Sim tick CPU: an ordinary job room and a swarm on a big map. Usage: tsx simprof.ts [village|big|swarm] [ticks]
import { bigRoom, addBots } from '../../src/sim/bigroom';
import { drive, newBot } from '../../src/sim/bots';
import { board, PLACES } from '../../src/shared/jobs';
import { newRun, runRoom } from '../../src/sim/run';
import { expedition } from '../../src/shared/expedjob';
import { EXPED } from '../../src/shared/tuning';
const MODE = process.argv[2] ?? 'village', N = Number(process.argv[3]) || 3000, IDS = ['me', 'b2', 'b3', 'b4'];
let room: any, bots: any[];
if (MODE === 'big') {
  room = bigRoom(3, 300, true); bots = addBots(room, IDS);
  bots.forEach((b, i) => { const h = room.heroes.find((x: any) => x.id === b.id), home = { x: 18 + i * 1.2, y: 18 }; Object.assign(h, home), Object.assign(b, newBot(b.id, home, 1000 + i)), (b.home = { x: 30, y: 30 }); });
} else if (MODE === 'swarm') {
  const n = 60; Object.assign(EXPED, { goblins: Math.max(150, n + 40), cap: n + 200 });
  const r = newRun(expedition(4)); r.party = 4; room = runRoom(r);
  const ins = room.map.hero, c = { x: ins.x, y: ins.y - 6 };
  bots = IDS.map((id, i) => { const h = room.join(id); Object.assign(h, { x: c.x + (i % 2) * 1.5, y: c.y + Math.floor(i / 2) * 1.5, safeT: 1e9 }); const b = newBot(id, { x: h.x, y: h.y }, 300 + i * 17); b.home = { x: c.x, y: c.y }; return b; });
  const swarm = room.allEnemies.filter((e: any) => e.act !== 'dead').slice(0, n);
  swarm.forEach((e: any, i: number) => { const a = (i / n) * Math.PI * 2, d = 5 + (i % 5) * 2; Object.assign(e, { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, dozing: false }); });
  (room as any).__swarm = swarm;
} else {
  const run = newRun({ ...board(1)[0], rooms: 3, place: PLACES.find((p) => p.kind === MODE)!, objective: 'rescue', seed: 77 }); run.party = 4; room = runRoom(run);
  bots = IDS.map((id, i) => { const h = room.join(id), home = { x: 10 + i * 3, y: 16 }; Object.assign(h, home); const b = newBot(id, home, 1000 + i); b.home = { x: room.map.w / 2, y: room.map.h / 2 }; return b; });
}
const times: number[] = [];
for (let i = 0; i < N; i++) {
  for (const h of room.heroes) if (h.hp < h.maxHp / 2) h.hp = h.maxHp;
  for (const e of (room.__swarm ?? room.enemies)) if (e.hp < e.maxHp / 3 || (room.__swarm && e.act === 'dead')) Object.assign(e, { hp: e.maxHp, act: e.act === 'dead' && room.__swarm ? 'idle' : e.act });
  for (const b of bots) room.setIntent(b.id, drive(b, room, 12));
  const t0 = process.cpuUsage(); room.step(); const c = process.cpuUsage(t0);
  if (i > 60) times.push((c.user + c.system) / 1000);
}
const s = [...times].sort((a, b) => a - b);
console.log(JSON.stringify({ mode: MODE, map: `${room.map.w}x${room.map.h}`, blocks: room.map.blocks.length, enemies: room.allEnemies.length, awake: room.enemies.filter((e: any) => !e.dozing && e.act !== 'dead').length, tickMs: { mean: +(times.reduce((a, b) => a + b, 0) / times.length).toFixed(3), p95: +s[Math.floor(s.length * 0.95)].toFixed(3), max: +s[s.length - 1].toFixed(2) } }));
