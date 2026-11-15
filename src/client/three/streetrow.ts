/**
 * The new look's building variety (docs/decisions/new-look-buildings.md, `?hd&street`): what a block's row of fronts
 * is. The landmarks (the church, the town hall, the Drowned Rat, the forge) stand grand and tall at their door,
 * turned a little toward the middle of town so you come upon them; homes are single-storey cottages; the rest a
 * mix of cottages, two-storey shops and tall town houses either side, never two of a kind running. Each front knows
 * its eave and ridge (as shares of its height) so its roof and side walls meet its picture. Drawing only.
 */
import { doorAt, type Block } from '../../shared/arena';
import SIZES from './kit/kit.json';

export const PX = 32;
const SZ = SIZES as Record<string, number[]>;
export const size = (name: string): number[] => SZ[name] ?? [64, 64];
const takes = (prefix: string) => Object.keys(SZ).filter((k) => k.startsWith(prefix));

export type Kind = 'cottage' | 'shop' | 'house' | 'forge' | 'tavern' | 'chapel' | 'church' | 'hall' | 'inn' | 'smithy';
/** Side-wall art by what the building is built of. */
export type Side = 'timber' | 'stone' | 'shop' | 'nave';

export interface Front {
  name: string;
  kind: Kind;
  /** Width and height in tiles. */
  w: number;
  H: number;
  /** Eave and ridge heights as shares of H. */
  eave: number;
  ridge: number;
  side: Side;
  /** A box rising from the roof (a bell tower, a chimney): its middle and width as shares of w, its top of H. */
  stack?: [number, number, number];
  /** The block's own front (where its sign hangs), not a house beside it. */
  main?: boolean;
  /** Turned toward the middle of town (radians about the front's foot), for the landmarks. */
  turn?: number;
}

interface Look { prefix: string; eave: number; ridge: number; side: Side; stack?: [number, number, number]; max?: number }
const LOOKS: Record<Kind, Look> = {
  cottage: { prefix: 'cottage-', eave: 0.48, ridge: 0.95, side: 'stone' },
  shop: { prefix: 'shop-', eave: 0.62, ridge: 0.97, side: 'shop' },
  house: { prefix: 'facade-house-', eave: 0.58, ridge: 0.98, side: 'timber' },
  forge: { prefix: 'facade-forge-', eave: 0.6, ridge: 0.95, side: 'stone' },
  tavern: { prefix: 'facade-tavern-', eave: 0.6, ridge: 0.97, side: 'shop' },
  chapel: { prefix: 'facade-chapel-', eave: 0.5, ridge: 0.9, side: 'nave' },
  church: { prefix: 'land-church-', eave: 0.38, ridge: 0.6, side: 'nave', stack: [0.5, 0.34, 1], max: 14 },
  hall: { prefix: 'land-hall-', eave: 0.6, ridge: 0.9, side: 'timber', max: 10.5 },
  inn: { prefix: 'land-tavern-', eave: 0.64, ridge: 0.93, side: 'shop', max: 10.5 },
  smithy: { prefix: 'land-forge-', eave: 0.5, ridge: 0.78, side: 'stone', stack: [0.82, 0.16, 0.97], max: 9.5 },
};
const LANDMARK = new Set<Kind>(['church', 'hall', 'inn', 'smithy']);
/** The middle of town (the Lantern's square), that landmarks turn toward. */
const MID_X = 28;

/** A block's own front: a landmark, or the kind it is. */
export function mainOf(b: Block): Kind {
  const l = (b.label ?? '').toUpperCase();
  if (b.kind === 'church') return 'church';
  if (/TOWN HALL/.test(l)) return 'hall';
  if (/DROWNED RAT/.test(l)) return 'inn';
  if (/^FORGE$/.test(l)) return 'smithy';
  if (b.door?.startsWith('home:')) return 'cottage';
  if (b.kind === 'forge' || /SMITH/.test(l)) return 'forge';
  if (b.kind === 'tavern' || /INN|TAVERN|LODGE/.test(l)) return 'tavern';
  if (/CHAPEL/.test(l) || b.kind === 'tower') return 'chapel';
  if (/INFIRM|HEAL|APOTH/.test(l)) return 'shop';
  return 'house';
}

/** A seeded picker for one block, the same every build. */
export function seeded(b: Block): () => number {
  let n = (Math.round(b.x * 7 + b.y * 13) >>> 0) || 1;
  return () => ((n = (Math.imul(n, 1103515245) + 12345) >>> 0) / 4294967296);
}

export function front(kind: Kind, rnd: () => number): Front {
  const L = LOOKS[kind], all = takes(L.prefix), name = all[Math.floor(rnd() * all.length)] ?? 'facade-house-0';
  const [pw, ph] = size(name);
  return { name, kind, w: pw / PX, H: ph / PX, eave: L.eave, ridge: L.ridge, side: L.side, stack: L.stack };
}

/** The row of fronts along a block's south side, left to right, exactly its width (the fillers squeezed to fit). */
export function rowOf(b: Block): Front[] {
  const rnd = seeded(b), kind = mainOf(b), main: Front = { ...front(kind, rnd), main: true };
  // A landmark keeps its proportions: as tall as its kind may go, as wide as most of the block allows.
  if (LANDMARK.has(kind)) {
    const ar = main.w / main.H, H = Math.min(LOOKS[kind].max!, Math.max(main.H, (b.w * 0.8) / ar));
    main.H = H;
    main.w = Math.min(H * ar, b.w + 1.2);
    main.H = main.w / ar;
    const lean = (MID_X - (b.x + b.w / 2)) / 10;
    main.turn = Math.max(-0.26, Math.min(0.26, lean * 0.26));
  }
  // Single-storey homes: just the cottage, fitted to its plot.
  if (kind === 'cottage') return [{ ...main, w: b.w, H: main.H * Math.min(1.15, Math.max(0.85, b.w / main.w)) }];
  const dx = b.door ? doorAt(b).x : b.x + b.w / 2;
  let left = Math.max(0, dx - main.w / 2 - b.x), right = Math.max(0, b.x + b.w - dx - main.w / 2);
  if (left + right + main.w > b.w + 0.01) {
    const over = left + right + main.w - b.w;
    left = Math.max(0, left - over / 2), right = Math.max(0, right - over / 2);
  }
  const fill = (room: number): Front[] => {
    const out: Front[] = [];
    let last: Kind | null = null;
    while (room > 0.9 && out.reduce((s, f) => s + f.w, 0) < room - 0.7) {
      const r = rnd(), k: Kind = r < 0.3 ? 'cottage' : r < 0.7 ? 'shop' : 'house';
      if (k === last && rnd() < 0.8) continue;
      out.push(front(k, rnd));
      last = k;
    }
    const sum = out.reduce((s, f) => s + f.w, 0), k = sum ? room / sum : 1;
    return out.map((f) => ({ ...f, w: f.w * k }));
  };
  let L = fill(left);
  const R = fill(b.w - L.reduce((s, f) => s + f.w, 0) - main.w);
  // Whatever's left over (too narrow for a house) goes to the other side's houses, or to the front itself.
  const slop = b.w - [...L, main, ...R].reduce((s, f) => s + f.w, 0);
  if (slop > 0.02 && !R.length && L.length) L = fill(b.w - main.w);
  else if (slop > 0.02 && !L.length && !R.length && !LANDMARK.has(kind)) main.w = b.w;
  return [...L, main, ...R];
}

/** The town's blocks, set before its buildings are built (buildings3d.ts), so a row can see its neighbours. */
let around: Block[] = [];
export const streetAround = (blocks: Block[]) => void (around = blocks);
const ROOFED = new Set<Block['kind']>(['house', 'hall', 'church', 'forge', 'tavern', 'tower', 'granary', 'barn']);

/** Whether a block's west (-1) or east (1) end looks out on open street: no roofed building within `gap` tiles. */
export function openEnd(b: Block, dir: -1 | 1, gap = 2.5): boolean {
  const x0 = dir < 0 ? b.x - gap : b.x + b.w, x1 = dir < 0 ? b.x : b.x + b.w + gap;
  return !around.some((o) => o !== b && ROOFED.has(o.kind) && o.x < x1 && o.x + o.w > x0 && o.y < b.y + b.h && o.y + o.h > b.y);
}
