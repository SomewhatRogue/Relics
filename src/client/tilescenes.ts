/**
 * Small scenes that make a map a place (docs/design/forest-redraw.md, "Small scenes"; Kyle, 2026-11-23: "a beautiful
 * but dark world"). One or two a job's outdoor map, chosen and placed from the map alone (every screen the same), off
 * the paths and near a tree: a shallow grave with a leaning marker and pale flowers; a cairn with a skull on it and a
 * candle stub; a dead campfire; a ring of bones round an old bloodstain, candles guttering. Mostly laid in the floor,
 * with one low thing standing, so walking over one reads right: they are paint only, never collided (as the scatter's
 * standing things: shared/scatter.ts). Drawn the tile way, a pixel to a pixel; a candle is the only light.
 */
import type { GameMap } from '../shared/arena';
import { Rng } from '../shared/rng';
import { partsOf, pavedAt, type Part as Ground, type SceneKind } from './looks';
import { blocked } from './ratspots';
import { soilAt } from './soil';
import { KX, KZ, type Rect } from './tilekit';
import type { Cut } from './three/propcards';

export interface Scene { kind: SceneKind; x: number; y: number }

const cache = new WeakMap<GameMap, Scene[]>();

/** The map's scenes: wherever the pattern book has a look for the map (looks.ts `countryOf`). */
export function scenesOf(m: GameMap): Scene[] {
  const hit = cache.get(m);
  if (hit) return hit;
  const out: Scene[] = [];
  cache.set(m, out);
  // (A part of the map at a time: the whole of it, or each stretch of the land under its own look: looks.ts partsOf.)
  for (const part of partsOf(m, 2, 2.5)) place(m, part, out);
  return out;
}

function place(m: GameMap, part: Ground, out: Scene[]): void {
  const { x0, y0, x1, y1 } = part, n0 = out.length;
  const rng = new Rng([...m.name].reduce((s, ch) => (s * 33 + ch.charCodeAt(0)) % 1000003, m.w * 131 + m.h * 977 + 17 + part.i * 29));
  // Which scenes: the look says (looks.ts), each once before any comes round again.
  const pool = part.look.scenes, town = part.look.country === 'town';
  if (!pool.length) return;
  let kinds: SceneKind[] = [];
  const want = Math.min(4, Math.max(1, Math.round(((x1 - x0 + 4) * (y1 - y0 + 5)) / 400)));
  const wet = (x: number, y: number) => !!m.water?.some((w) => x > w.x - 1 && x < w.x + w.w + 1 && y > w.y - 1 && y < w.y + w.h + 1);
  const bare = (x: number, y: number) => {
    const s = m.soil?.length ? soilAt(m, x, y) : 'cobble';
    return s !== 'cobble' && s !== 'grass' && s !== 'shade';
  };
  for (let i = 0; i < 240 && out.length - n0 < want; i++) {
    const x = x0 + rng.next() * (x1 - x0), y = y0 + rng.next() * (y1 - y0);
    // Open ground a step wide, off every path and patch, not at a door or where anyone starts.
    if (!kinds.length) kinds = [...pool];
    const ki = rng.int(kinds.length), wide = kinds[ki] === 'graves' ? 1.9 : kinds[ki] === 'log' ? 1.4 : 0.9;
    if ([[0, 0], [-wide, 0], [wide, 0], [0, -0.6], [0, 0.6]].some(([dx, dy]) => blocked(m, x + dx, y + dy) || bare(x + dx, y + dy)) || wet(x, y)) continue;
    if (Math.hypot(m.hero.x - x, m.hero.y - y) < 4 || (m.exit && Math.hypot(m.exit.x + m.exit.w / 2 - x, m.exit.y + m.exit.h / 2 - y) < 3)) continue;
    // By a tree or a rock (company), never on top of one; apart from the other scenes.
    const d = Math.min(...m.rounds.map((r) => Math.hypot(r.x - x, r.y - y) - r.r), 99);
    if (d < 0.7 || (!town && d > 3.2) || (town && !pavedAt(m, x, y)) || out.some((s) => Math.hypot(s.x - x, s.y - y) < 9)) continue;
    out.push({ kind: kinds.splice(ki, 1)[0], x, y });
  }
}

const C: Record<string, string> = {
  // earth turned, ash, stone, bone, wood, wax, rag and old blood, a ghost-pale flower
  E: '#1a140f', e: '#2a2019', f: '#3a2d22', A: '#17161a', a: '#26252a', h: '#35333a',
  K: '#15141a', s: '#34323c', p: '#4a4753', W: '#8b8982', w: '#5f5d5a', o: '#0d0c0b',
  B: '#1c130c', b: '#33241a', t: '#4a3626', x: '#8a8474', R: '#4a1616', r: '#2c0e10', F: '#8a8894', g: '#243322',
  m: '#2a3d25', c: '#64201b', y: '#6a5238', Y: '#8a6e4a',
};
const put = (rect: Rect, x0: number, y0: number, rows: string[]) => rows.forEach((row, j) => [...row].forEach((ch, i) => C[ch] && rect(x0 + i, y0 + j, 1, 1, C[ch])));

const FLOOR: Record<Exclude<SceneKind, 'graves'>, string[]> = {
  // A mound of turned earth, lit along its upper left, flowers at its head.
  grave: ['..F.....ffff......', '.FgF.ffeeeeeeff...', '..g.feeeeeeeeeee..', '...feeeeEeeeeeeEE.', '...eeeEeeeeeEeeEE.', '....EEeeeeeEEEEE..', '......EEEEEEE.....'],
  // Bare trodden earth round the pile's foot.
  cairn: ['....eeeeeeee....', '..eeeeeeeeeeee..', '.eeeEeeeeeeEeee.', '..EEeeeeeeeeEE..', '....EEEEEEEE....'],
  // A ring of stones round cold ash, charred ends in it.
  campfire: ['....ps.ps.ps....', '..ps.aaaaaa.ps..', '.sK.aaBaahaaa.pK', '.ps.aAaabBaAa.sK', '..sK.aaAaaa.sK..', '....sK.sK.sK....'],
  // Bare ground at the stake's foot, bones dropped by it.
  stake: ['...eeeeee...', '.eeWeeeeeee.', '.eeeeeewEee.', '..EEeeeeEE..', '....EEEE....'],
  // The dark it lies in, moss creeping out from under it.
  log: ['...EEEEEEEEEEEEEEEEEEEEE....', '.EEEgEEEEEEEEEEEEEEEgEEEEE..', '...EEEEEEEEEEEEEEEEEEEEE....'],
  // An iron grate set in a kerb of dressed stone, black under the bars.
  drain: ['.KKKKKKKKKKKKK.', 'KpspspspspspspK', 'KsohohohohohosK', 'KsohohohohohosK', 'KsohohohohohosK', 'KsKKKKKKKKKKKsK', '.KKKKKKKKKKKKK.'],
  // Bones laid in a ring round an old stain.
  circle: ['.....W..w..W.....', '..w....rrrr....W.', '.W...rrRRRRrr...w', '....rRRrRRRRRr...', '.w...rrRRRrrr...W', '..W....rrr.....w.', '.....w..W..w.....'],
};

/** A scene's parts: a row of graves is three graves, a little out of line; anything else is itself. */
type Part = Exclude<SceneKind, 'graves'>;
const parts = (s: Scene): { kind: Part; x: number; y: number }[] =>
  s.kind === 'graves' ? [-1.2, 0, 1.2].map((dx, i) => ({ kind: 'grave' as const, x: s.x + dx, y: s.y + [0.08, -0.1, 0.05][i] })) : [{ kind: s.kind, x: s.x, y: s.y }];

/** Each scene's part in the floor. */
export function paintScenes(m: GameMap, rect: Rect): void {
  for (const s of scenesOf(m)) for (const q of parts(s)) {
    const rows = FLOOR[q.kind];
    put(rect, Math.round(q.x * KX) - (rows[0].length >> 1), Math.round(q.y * KZ) - (rows.length >> 1), rows);
  }
}

const UP: Record<Exclude<SceneKind, 'graves'>, { rows: string[]; glow?: [number, number][]; dx: number; dy: number }[]> = {
  // A marker of two planks, leaning, a rag tied to it.
  grave: [{ dx: -0.42, dy: -0.05, rows: ['..ot...', '.obt...', 'obbbbto', 'ottbtRo', '..obRRo', '..obtRo', '..obt.o', '..obt..', '..obt..', '.oEbtE.'] }],
  // Stones heaped, a skull on top; a candle stub at its foot.
  cairn: [
    { dx: 0, dy: 0.02, rows: ['....oWWo....', '...oWoWWo...', '...oWWwwo...', '..oppoWwoo..', '.opsspoopso.', '.osssKpsssKo', 'oppsKpssKpso', 'ossKKssKKssK', '.KKKKKKKKKK.'] },
    { dx: 0.44, dy: 0.12, rows: ['.o.', '.o.', 'oxo', 'oxo', 'KxK'], glow: [[1, 0], [1, 1]] },
  ],
  // Two forked sticks and a spit, nothing on it.
  campfire: [{ dx: 0, dy: -0.05, rows: ['t.t.........t.t', '.b...........b.', 'obtttttttttttbo', '.b...........b.', '.b...........b.', '.b...........b.', '.B...........B.'] }],
  // A skull set on a stake, a rag tied under it: a goblin's warning, or someone's to them.
  stake: [{ dx: 0, dy: 0, rows: ['.oWWo.', 'oWoWoo', 'oWWWwo', '.owwo.', '.RbtR.', '.RbtRR', '..bt.R', '..bt..', '..bt..', '..bt..', '..bt..', '..bt..', '.Ebte.'] }],
  // A fallen trunk: its cut end pale, its top lit, moss along it and a red cap grown on it.
  log: [{ dx: 0, dy: 0.05, rows: ['..........mm......c.......', '...oooommmmmmooooccoooo...', '..oYyottttmmttttttttttto..', '.oYyYobbbbbbbbbbbbbbbbbbo.', '.oyYyobbbbbBbbbbbbbBbbbbo.', '.oYyYoBBBBBBBBBBBBBBBBBBo.', '..oyyoBBBBBBBBBBBBBBBBBo..', '...ooooooooooooooooooooo..'] }],
  // (A drain is all in the floor.)
  drain: [],
  // Three candle stubs among the bones.
  circle: [
    { dx: -0.3, dy: -0.12, rows: ['.o.', '.o.', 'oxo', 'KxK'], glow: [[1, 0], [1, 1]] },
    { dx: 0.34, dy: -0.04, rows: ['.o.', '.o.', 'oxo', 'oxo', 'KxK'], glow: [[1, 0], [1, 1]] },
    { dx: 0.02, dy: 0.2, rows: ['.o.', '.o.', 'KxK'], glow: [[1, 0], [1, 1]] },
  ],
};
const FLAME = ['#ffd27a', '#e8862e'];

/** A scene's standing things: each a card, where it stands (tiles), and whether it burns. */
export function sceneCards(s: Scene): { cut: Cut; x: number; y: number; lit: boolean }[] {
  return parts(s).flatMap((q) => UP[q.kind].map((u) => ({ u, q }))).map(({ u, q }) => {
    const w = u.rows[0].length, h = u.rows.length, mk = () => Object.assign(document.createElement('canvas'), { width: w, height: h });
    const lit = mk(), glow = mk(), lg = lit.getContext('2d')!, gg = glow.getContext('2d')!;
    put((x, y, ww, hh, col) => ((lg.fillStyle = col), lg.fillRect(x, y, ww, hh)), 0, 0, u.rows);
    (u.glow ?? []).forEach(([x, y], i) => ((gg.fillStyle = FLAME[i % 2]), gg.fillRect(x, y, 1, 1), lg.clearRect(x, y, 1, 1), (lg.fillStyle = FLAME[i % 2]), lg.fillRect(x, y, 1, 1)));
    return { cut: { lit, glow, w, h, ax: w >> 1, ay: h - 1 }, x: q.x + u.dx, y: q.y + u.dy, lit: !!u.glow };
  });
}

// A test hook (scripts and screenshots find a map's scenes): window.__scenesOf(map).
if (typeof window !== 'undefined') (window as unknown as { __scenesOf: typeof scenesOf }).__scenesOf = scenesOf;
