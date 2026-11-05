/**
 * Finds layout-4 jobs to shoot (scripts/variety-look.cjs reads what this prints): a fork for each pair
 * of ways worth seeing, each scene, and a few of the new rooms; where to stand for each.
 * Usage: npx tsx scripts/variety/find.ts > scripts/variety/targets.json
 */
import { PLACES, SEWERS, board, type Job } from '../../src/shared/jobs';
import { routeOf } from '../../src/shared/route';
import { planRoom, type RoadId } from '../../src/shared/terrain';

const ALL = [...PLACES, SEWERS];
interface T { name: string; place: (typeof ALL)[number]; seed: number; took: 'h' | 'l'; room: number; x: number; y: number; open?: boolean }
const out: T[] = [], want = new Set(['burning', 'drag', 'prisoners', 'patrol', 'hanging', 'fallen', 'cache', 'wreck', 'drums', 'webs', 'wading']);
const nodes = new Set(['mill', 'orchard', 'churchyard', 'deepwood', 'barrows', 'stackyard', 'cave', 'minehead', 'reedbed', 'flooded']);
const forks = new Set(['smoke+drums', 'crows+quiet', 'cries+ford', 'webs+drums']);
const job = (place: (typeof ALL)[number], seed: number): Job => ({ ...board(1)[1], place, rooms: 5, seed, objective: 'hunt', layout: 4, deep: false });
for (let s = 1; s < 300 && (want.size || nodes.size || forks.size); s++) for (const place of ALL) for (const took of ['h', 'l'] as const) {
  const j = job(place, s), r = routeOf(j, took), f = r.findIndex((x) => x.outs!.length === 2);
  r.forEach((spec, i) => {
    if (spec.heart) return;
    const taken: Record<number, RoadId> = f >= 0 && i > f ? { [f + 1]: took === 'l' ? 'low' : 'high' } : {};
    const at = (x: number, y: number) => ({ place, seed: s, took, room: i, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    if (i === f) {
      const k = spec.outs!.map((o) => o.way).sort().join('+'), k2 = spec.outs!.map((o) => o.way).reverse().sort().join('+');
      const hit = [...forks].find((q) => q.split('+').sort().join('+') === k || q === k2);
      if (hit) forks.delete(hit), out.push({ name: `fork-${hit.replace('+', '-')}`, ...at((spec.w ?? 28) / 2, (spec.h ?? 24) / 2 + 2) });
    }
    if (want.has(spec.piece)) {
      const p = planRoom(j, i, taken[i], taken), m = p.map;
      const held = m.blocks.find((b) => b.held), log = m.blocks.find((b) => b.kind === 'log'), tree = m.rounds.find((q) => q.kind === 'hangtree');
      const well = spec.piece === 'cache' ? m.rounds.find((q) => q.kind === 'well') : undefined, haul = p.foes.find((q) => q.haul), pat = p.foes.find((q) => q.task?.k === 'patrol');
      const drummer = p.foes.find((q) => q.variant === 'drummer'), nest = p.foes.find((q) => q.kind === 'nest'), bow = p.foes.find((q) => q.bow), cart = m.oil?.[0];
      const c = held ? { x: held.x + held.w / 2, y: held.y + held.h + 2.5 } : log ? { x: log.x + log.w / 2, y: log.y + log.h + 3 } : tree ? { x: tree.x + 1, y: tree.y + 3 } : well ? { x: well.x, y: well.y + 3 }
        : haul?.haul ? { x: haul.haul.x, y: haul.haul.y + 3 } : pat ? { x: pat.x, y: pat.y + 3 } : drummer ? { x: drummer.x, y: drummer.y + 4 } : nest ? { x: nest.x, y: nest.y + 3.5 } : bow ? { x: bow.x, y: bow.y + 5 }
        : cart ? { x: cart.x, y: cart.y + 3 } : m.led ? { x: m.led.pts[1][0], y: m.led.pts[1][1] + 4 } : null;
      if (c) want.delete(spec.piece), out.push({ name: `scene-${spec.piece}`, ...at(c.x, c.y) });
    }
    if (nodes.has(String(spec.node)) && spec.in?.side === 'S') nodes.delete(String(spec.node)), out.push({ name: `room-${String(spec.node)}`, ...at((spec.w ?? 28) / 2, (spec.h ?? 24) / 2 + 2), open: true });
  });
}
console.log(JSON.stringify({ targets: out, missing: [...want, ...nodes, ...forks] }, null, 1));
