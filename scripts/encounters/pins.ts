// The layout pins (tests/layout3pin.test.ts, tests/variety.test.ts) computed here with the switches as asked, and
// which rooms moved between switched off and on: the pins' switch-off check before re-pinning.
// Usage: npx tsx scripts/encounters/pins.ts [off2: the second wave off] [off: every new thing off]
import { PLACES, SEWERS, board, type Job } from '../../src/shared/jobs';
import { routeOf } from '../../src/shared/route';
import { planRoom, type RoadId } from '../../src/shared/terrain';
import { AFFIX2_ON, ELITE, MEATY2_ON, MEATY_ON } from '../../src/shared/tuning';

const fnv = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};
const strip = (p: ReturnType<typeof planRoom>) => JSON.stringify({ ...p, foes: [] });
function plans(layout: 3 | 4): { key: string; plan: ReturnType<typeof planRoom> }[] {
  const out: { key: string; plan: ReturnType<typeof planRoom> }[] = [];
  const one = (j: Job, tag: string) => {
    for (const took of ['h', 'l'] as const) {
      const r = routeOf(j, took), f = r.findIndex((x) => (x.outs?.length ?? 0) === 2), road: RoadId = took === 'l' ? 'low' : 'high';
      for (let i = 0; i < (layout === 3 ? j.rooms : r.length); i++) {
        const taken: Record<number, RoadId> = f >= 0 && i > f ? { [f + 1]: road } : {};
        out.push({ key: `${tag} ${took} ${i}`, plan: planRoom(j, i, taken[i], taken) });
      }
    }
  };
  if (layout === 3) {
    for (const day of [1, 2, 3]) for (const j0 of board(day)) one({ ...j0, layout: 3 }, `d${day} ${j0.id}`);
    for (const p of [...PLACES, SEWERS]) for (const seed of [7, 707]) one({ ...board(1)[2], place: p, rooms: 5, seed, layout: 3 }, `${p.name} ${seed}`);
  } else for (const p of [...PLACES, SEWERS]) for (const seed of [7, 707]) one({ ...board(1)[1], place: p, rooms: 5, seed, objective: 'hunt', layout: 4 }, `${p.name} ${seed}`);
  return out;
}
const hash = (ps: { plan: ReturnType<typeof planRoom> }[]) => ps.reduce((all, { plan }) => fnv(all + ':' + fnv(JSON.stringify(plan))), 0);
const set = (on2: boolean, on1: boolean) => ((AFFIX2_ON.on = MEATY2_ON.on = on2), (ELITE.on = MEATY_ON.on = on1));
for (const layout of [3, 4] as const) {
  set(false, true);
  const off = plans(layout);
  set(false, false);
  const allOff = plans(layout);
  set(true, true);
  const on = plans(layout);
  const moved = on.filter((x, i) => JSON.stringify(x.plan) !== JSON.stringify(off[i].plan));
  const beyond = moved.filter((x, i) => strip(x.plan) !== strip(off[on.indexOf(x)].plan));
  console.log(`layout ${layout}: second wave off ${hash(off)}, all new off ${hash(allOff)}, on ${hash(on)}; ${moved.length} of ${on.length} rooms moved, ${beyond.length} beyond their goblins`);
  for (const x of beyond) {
    const o = off[on.indexOf(x)].plan;
    console.log('  beyond goblins:', x.key, JSON.stringify(x.plan.chests) !== JSON.stringify(o.chests) ? 'chests' : '', JSON.stringify(x.plan.map) !== JSON.stringify(o.map) ? 'map' : '', JSON.stringify(x.plan.props) !== JSON.stringify(o.props) ? 'props' : '');
  }
}
