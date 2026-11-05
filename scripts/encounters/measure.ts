// How a job's rooms are composed, measured: goblins in a room, how many come at you at once (the
// biggest group that wakes together: goblins within a shout of each other, of one pack where packs
// are kept), how many in a screen's worth of ground, and how the special goblins stack (any with a
// kind past the plain small one, an archer, a butcher). Over 60 days of the board, every room, for a
// party of 1, 2 and 4. Usage: npx tsx scripts/encounters/measure.ts [days, default 60]
import { board } from '../../src/shared/jobs';
import { planRoom, type Foe } from '../../src/shared/terrain';
import { scaleFoes } from '../../src/sim/party';
import { ALERT } from '../../src/shared/tuning';
import { isSpecial } from '../../src/shared/encounter';

const DAYS = Number(process.argv[2]) || 60, VIEW = { w: 23, h: 13 };
const fighter = (f: Foe) => f.kind === 'scrapper' || f.kind === 'butcher';
const special = (f: Foe) => fighter(f) && !f.name && (f.role ? isSpecial(f) : f.kind === 'butcher' || !!f.bow || (!!f.variant && f.variant !== 'looter'));
const kindOf = (f: Foe) => (f.kind === 'butcher' ? (f.name ? 'named' : 'butcher') : f.bow ? (f.variant ?? 'archer') : f.variant ?? 'plain');

/** Groups that wake together: within a shout of each other (and of one pack, where a room keeps packs). */
function groups(foes: Foe[]): Foe[][] {
  const fs = foes.filter((f) => fighter(f) || f.kind === 'spider'), seen = new Set<number>(), out: Foe[][] = [];
  for (let i = 0; i < fs.length; i++) {
    if (seen.has(i)) continue;
    const g: Foe[] = [], q = [i];
    seen.add(i);
    while (q.length) {
      const a = fs[q.pop()!];
      g.push(a);
      fs.forEach((b, j) => {
        if (seen.has(j)) return;
        const same = a.pack === undefined || b.pack === undefined || a.pack === b.pack;
        if (same && Math.hypot(a.x - b.x, a.y - b.y) < ALERT.shout) seen.add(j), q.push(j);
      });
    }
    out.push(g);
  }
  return out;
}

/** The most goblins in any screen's worth of ground (a laptop's view of the room). */
function inView(foes: Foe[]): number {
  let best = 0;
  for (const a of foes) for (const b of foes) {
    const x0 = a.x - 1, y0 = b.y - 1;
    best = Math.max(best, foes.filter((f) => f.x >= x0 && f.x <= x0 + VIEW.w && f.y >= y0 && f.y <= y0 + VIEW.h).length);
  }
  return best;
}

type Row = { goblins: number; specials: number; kinds: number; group: number; groupSpecials: number; groupKinds: number; view: number; packs: number; centre: boolean };
const rows: Record<number, Row[]> = { 1: [], 2: [], 4: [] };
for (let day = 1; day <= DAYS; day++) for (const job of board(day)) for (let i = 0; i < job.rooms; i++) for (const party of [1, 2, 4]) {
  const plan = planRoom(job, i), foes = scaleFoes(plan.foes.map((f) => ({ ...f })), party, job.seed * 17 + i * 5 + 2).filter((f) => fighter(f) || f.kind === 'spider');
  const gs = groups(foes), big = gs.reduce((a, b) => (b.filter(fighter).length > a.filter(fighter).length ? b : a), [] as Foe[]);
  const sp = foes.filter(special);
  rows[party].push({
    goblins: foes.filter(fighter).length, specials: sp.length, kinds: new Set(sp.map(kindOf)).size,
    group: big.filter(fighter).length, groupSpecials: big.filter(special).length, groupKinds: new Set(big.filter(special).map(kindOf)).size,
    view: inView(foes.filter(fighter)), packs: gs.filter((g) => g.some(fighter)).length, centre: big.some((f) => !!f.role && isSpecial(f) && !f.bow),
  });
}
const mean = (a: number[]) => +(a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(1);
const pct = (a: boolean[]) => Math.round((100 * a.filter(Boolean).length) / Math.max(1, a.length)) + '%';
const p90 = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length * 0.9)];
console.log(`${rows[1].length} rooms a party size, ${DAYS} days of the board`);
console.log('party | goblins mean/p90/max | biggest wake group mean/p90/max | in view mean/max | specials mean | special kinds mean | group specials mean/max | rooms w/ 3+ kinds | group w/ 3+ specials | group w/ 3+ kinds | fights a room | group has a centrepiece');
for (const p of [1, 2, 4]) {
  const r = rows[p];
  console.log([p, `${mean(r.map((x) => x.goblins))}/${p90(r.map((x) => x.goblins))}/${Math.max(...r.map((x) => x.goblins))}`,
    `${mean(r.map((x) => x.group))}/${p90(r.map((x) => x.group))}/${Math.max(...r.map((x) => x.group))}`, `${mean(r.map((x) => x.view))}/${Math.max(...r.map((x) => x.view))}`,
    mean(r.map((x) => x.specials)), mean(r.map((x) => x.kinds)), `${mean(r.map((x) => x.groupSpecials))}/${Math.max(...r.map((x) => x.groupSpecials))}`,
    pct(r.map((x) => x.kinds >= 3)), pct(r.map((x) => x.groupSpecials >= 3)), pct(r.map((x) => x.groupKinds >= 3)), mean(r.map((x) => x.packs)), pct(r.map((x) => x.centre))].join(' | '));
}
