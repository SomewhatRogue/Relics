// Which goblin fields fill the patches: bytes per field per second over 20 s of the big map (300
// goblins, four bots spread, dozing on). Usage: npx tsx scripts/bigmap/fields.ts [goblins]
import { bigRoom, addBots } from '../../src/sim/bigroom';
import { drive } from '../../src/sim/bots';
import { Encoder, stateOf } from '../../src/client/snap';

const n = Number(process.argv[2]) || 300, room = bigRoom(3, n, true), bots = addBots(room, ['b1', 'b2', 'b3', 'b4']), enc = new Encoder();
const by = new Map<string, number>();
let sentAt = -9, now = 0, total = 0;
for (let f = 0; f < 60 * 20; f++) {
  now += 1 / 60;
  for (const b of bots) room.setIntent(b.id, drive(b, room));
  room.advance(1 / 60);
  if (now - sentAt < 0.05) continue;
  sentAt = now;
  const p = enc.encode(stateOf(room), false);
  total += JSON.stringify(p).length;
  for (const [c, q] of Object.entries(p)) for (const [, d] of q!.u) for (const [k, v] of Object.entries(d)) by.set(c + '.' + k, (by.get(c + '.' + k) ?? 0) + k.length + 3 + (JSON.stringify(v) ?? "null").length);
}
console.log(`patches ${(total / 20 / 1024).toFixed(1)} KB/s (no envelope, no fulls)`);
for (const [k, v] of [...by].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`${k.padEnd(24)} ${(v / 20 / 1024).toFixed(1)} KB/s  ${((100 * v) / total).toFixed(0)}%`);
