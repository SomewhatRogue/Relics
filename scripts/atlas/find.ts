// Targets for scripts/atlas-look.cjs: a village job whose first room has the most shut houses beside a big one
// that took them in (shared/doors.ts). Usage: npx tsx scripts/atlas/find.ts > scripts/atlas/target.json
import { board } from '../../src/shared/jobs';
import { planRoom } from '../../src/shared/terrain';
import { mergedOf } from '../../src/shared/doors';
let best: { job: unknown; shut: number; big: { x: number; y: number; w: number; h: number } } | null = null;
for (let d = 1; d <= 40; d++) for (const job of board(d)) {
  if (job.place.kind !== 'village' && job.place.kind !== 'farm') continue;
  const bs = planRoom(job, 0).map.blocks, big = bs.find((b) => b.door && mergedOf(b.door).length);
  const shut = bs.filter((b) => b.shut).length;
  if (big && (!best || shut > best.shut)) best = { job, shut, big: { x: big.x, y: big.y, w: big.w, h: big.h } };
}
console.log(JSON.stringify(best));
