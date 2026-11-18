// What building the leader's messages costs: CPU ms a send (all friends together), over the parity scenes
// (tests/perfparity.scenes.ts), sent as CoopHost sends them (roomsend.ts for an ordinary room, bigsend.ts for
// a big one, three friends). Bytes are on the wire, the relay's whole envelope, in both wire formats (the second,
// client/wire2.ts, beside the first; its CPU is measured apart from the first's). Usage: npx tsx scripts/perf/sendbench.ts [scene names, comma separated]
import { BigSend } from '../../src/client/bigsend';
import { isBig } from '../../src/client/interest';
import { RoomSend } from '../../src/client/roomsend';
import type { FightEvent } from '../../src/sim/types';
import { IDS, newPress, scenes } from '../../tests/perfparity.scenes';
import { stepScene } from '../../tests/perfparity.scenes';

const want = (process.argv[2] ?? 'village-rescue,deep-dive,swarm60,big300').split(','), GUESTS = IDS.slice(1);
const cpu = () => { const c = process.cpuUsage(); return (c.user + c.system) / 1000; };
for (const s of scenes()) {
  if (!want.includes(s.name)) continue;
  const press = newPress(), big = isBig(s.room), evs: FightEvent[] = [], rs = new RoomSend(), bs = new BigSend(), rs2 = new RoomSend(), bs2 = new BigSend(), ms: number[] = [], ms2: number[] = [];
  let now = 0, sends = 0, bytes = 0, bytes2 = 0;
  const wire = (to: string, d: unknown) => JSON.stringify({ to, d }).length;
  for (let t = 1; t <= 1500; t++) {
    stepScene(s, press);
    evs.push(...s.room.events);
    now += 1 / 30;
    if (t % 3) continue;
    const room = s.room, slow = { hc: [], dm: [], run: s.run ? { ...s.run, board: undefined } : null, goal: 'Free the captives', names: { me: 'A', b2: 'B', b3: 'C', b4: 'D' } };
    const common = { k: 1, t: room.time, w: now, x: 0, in: 0, ...slow, acks: {} }, rest = { k: 1, w: now, slow, ev: evs, acks: {} };
    let t0 = cpu();
    if (big) for (const g of GUESTS) bytes += wire(g, bs.msg(room, g, now, sends === 0, common, evs, 1).d);
    else bytes += wire('*', rs.msg(room, now, sends === 0, rest, 1).d);
    ms.push(cpu() - t0);
    t0 = cpu();
    if (big) for (const g of GUESTS) bytes2 += wire(g, bs2.msg(room, g, now, sends === 0, common, evs, 2).d);
    else bytes2 += wire('*', rs2.msg(room, now, sends === 0, rest, 2).d);
    ms2.push(cpu() - t0);
    evs.length = 0;
    sends++;
  }
  const sorted = [...ms].sort((a, b) => a - b);
  console.log(JSON.stringify({ scene: s.name, big, sends, msPerSend: { mean: +(ms.reduce((a, b) => a + b, 0) / ms.length).toFixed(3), p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(3), max: +sorted[sorted.length - 1].toFixed(2) }, kbPerSec: +(bytes / (1500 / 30) / 1024).toFixed(1), wire2: { msPerSend: +(ms2.reduce((a, b) => a + b, 0) / ms2.length).toFixed(3), kbPerSec: +(bytes2 / (1500 / 30) / 1024).toFixed(1), less: `${Math.round((1 - bytes2 / bytes) * 100)}%` } }));
}
