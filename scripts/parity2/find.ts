/**
 * Finds a layout-4 job room for every room kind and every staged scene (scripts/parity-look.cjs reads
 * what this prints): where to stand so the room's own pieces are in view.
 * Usage: npx tsx scripts/parity2/find.ts > scripts/parity2/targets.json
 */
import { PLACES, SEWERS, board, type Job } from '../../src/shared/jobs';
import { routeOf } from '../../src/shared/route';
import { planRoom, type RoadId } from '../../src/shared/terrain';
import type { GameMap } from '../../src/shared/arena';

const ALL = [...PLACES, SEWERS];
interface T { name: string; place: (typeof ALL)[number]; seed: number; took: 'h' | 'l'; room: number; x: number; y: number; open?: boolean }
const out: T[] = [];
const scenes = new Set(['burning', 'drag', 'prisoners', 'hanging', 'fallen', 'cache', 'wreck', 'drums', 'wading']);
const nodes = new Set(['deepwood', 'glade', 'reedbed', 'flooded', 'collapse', 'orechamber', 'cave', 'stackyard', 'mill', 'orchard', 'churchyard', 'barrows', 'minehead']);
const job = (place: (typeof ALL)[number], seed: number): Job => ({ ...board(1)[1], place, rooms: 5, seed, objective: 'hunt', layout: 4, deep: false });

/** The room's signature: the first of these found, else its middle. */
function spot(m: GameMap, what: string): [number, number] {
  const bk = (k: string) => m.blocks.find((b) => b.kind === k), rk = (k: string) => m.rounds.find((q) => q.kind === k);
  const b = what === 'mill' ? bk('mill') : what === 'minehead' ? bk('headframe') : what === 'drums' ? bk('stakes') : what === 'wading' ? bk('hurdle') : what === 'fallen' ? bk('log') : what === 'wreck' ? m.blocks.find((q) => q.kind === 'cart') : what === 'burning' ? m.blocks.find((q) => q.held) : undefined;
  if (b) return [b.x + b.w / 2, b.y + b.h + 2.5];
  const r = what === 'orchard' ? rk('apple') : what === 'churchyard' ? rk('headstone') : what === 'hanging' ? rk('hangtree') : what === 'cache' ? rk('well') : what === 'stackyard' ? rk('hay') : what === 'reedbed' ? rk('reed') : undefined;
  if (r) return [r.x, r.y + 2.5];
  const mk = what === 'barrows' ? (m.marks ?? []).find((q) => q.kind === 'mound') : undefined;
  if (mk) return [mk.x + mk.w / 2, mk.y + mk.h + 2];
  if (what === 'drag') { const t = (m.grim ?? []).find((q) => q.kind === 'trail'); if (t) return [t.x, t.y + 2.5]; }
  return [m.w / 2, m.h / 2 + 2];
}

for (let s = 1; s < 400 && (scenes.size || nodes.size); s++) for (const place of ALL) for (const took of ['h', 'l'] as const) {
  const j = job(place, s), r = routeOf(j, took), f = r.findIndex((x) => x.outs!.length === 2);
  r.forEach((spec, i) => {
    if (spec.heart) return;
    const node = String(spec.node), sc = scenes.has(spec.piece), nd = nodes.has(node) && spec.in?.side === 'S';
    if (!sc && !nd) return;
    const taken: Record<number, RoadId> = f >= 0 && i > f ? { [f + 1]: took === 'l' ? 'low' : 'high' } : {};
    const m = planRoom(j, i, taken[i], taken).map;
    const at = (name: string, what: string, open?: boolean) => {
      const [x, y] = spot(m, what);
      out.push({ name, place, seed: s, took, room: i, x: Math.round(x * 10) / 10, y: Math.round(Math.min(m.h - 1.5, y) * 10) / 10, ...(open ? { open } : {}) });
    };
    if (sc) scenes.delete(spec.piece), at(`scene-${spec.piece}`, spec.piece);
    if (nd && nodes.has(node)) nodes.delete(node), at(`room-${node}`, node, true);
  });
}
console.log(JSON.stringify({ targets: out, missing: [...scenes, ...nodes] }, null, 1));
