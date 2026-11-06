/**
 * A NETS fork to shoot (scripts/staithe-look.cjs reads what this prints): the job, the road to take, the
 * Staithe's room, and a Barrowfields day that has the Staithe pinned.
 * Usage: npx tsx scripts/staithe/find.ts > scripts/staithe/target.json
 */
import { PLACES, SEWERS, board, type Job } from '../../src/shared/jobs';
import { routeOf } from '../../src/shared/route';
import { expedition } from '../../src/shared/expedjob';
import { expedPlan } from '../../src/shared/expedmap';

const ALL = [...PLACES, SEWERS];
const job = (place: (typeof ALL)[number], seed: number): Job => ({ ...board(1)[1], place, rooms: 5, seed, objective: 'hunt', layout: 4, deep: false });
let nets: object | null = null;
for (let s = 1; s < 200 && !nets; s++) for (const place of ALL) for (const took of ['h', 'l'] as const) {
  if (nets) break;
  const j = job(place, s), r = routeOf(j, took), f = r.findIndex((x) => x.outs!.length === 2);
  if (f < 0) continue;
  const out = r[f].outs!.find((o) => o.road === (took === 'h' ? 'high' : 'low'));
  // (A river across the room, the way in from the south: the jetty reads best on a phone held upright.)
  if (out?.way === 'nets' && r[f + 1].in?.side === 'S') nets = { place, seed: s, took, room: f + 1 };
}
let day = 1;
while (!expedPlan(expedition(day)).goals.some((g) => g.kind === 'staithe')) day++;
console.log(JSON.stringify({ nets, day }, null, 1));
