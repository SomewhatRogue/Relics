/**
 * The pattern book (docs/design/forest-redraw.md, "The pattern book"; Kyle, 2026-11-23: "patterns and aesthetics that
 * we can shuffle and use for real looks that seem intentional"). Three layers:
 * - a MOTIF is one named piece of ground with a shape: a mossy hollow, a worn bare patch, a stand of tall grass, a
 *   burnt patch, a drift of small things along the wind, a mushroom ring (drawn by tilemotifs.ts);
 * - a SCENE is a small set piece (tilescenes.ts);
 * - a LOOK is a named recipe: which motifs and how many, which scenes may appear. Each kind of country has a few.
 * A map draws one look from its own name and lays that look's motifs on its open ground, so a map agrees with
 * itself and differs from the next. Everything here is decided from the map alone (every screen the same), is
 * paint only, and never touches the room. To add a look: a line in LOOKS. To add a motif: a kind here, a painter there.
 */
import type { GameMap } from '../shared/arena';
import { Rng } from '../shared/rng';
import { scattered } from '../shared/scatter';
import { blocked } from './ratspots';
import { soilAt } from './soil';

export type MotifKind = 'hollow' | 'pool' | 'bald' | 'tallgrass' | 'burn' | 'ring' | 'puddle' | 'moss' | 'ridge' | 'drift:leaves' | 'drift:bones' | 'drift:stones' | 'drift:pale' | 'drift:red';
export type SceneKind = 'grave' | 'graves' | 'cairn' | 'campfire' | 'circle' | 'stake' | 'log' | 'drain';
export type Country = 'wood' | 'fen' | 'fields' | 'yard' | 'crop' | 'cave' | 'town';
/** A motif laid on a map: its middle and half sizes (tiles), a drift's heading (radians), a variant. */
export interface Motif { kind: MotifKind; x: number; y: number; rx: number; ry: number; a: number; v: number }
export interface Look { name: string; country: Country; motifs: [MotifKind, number][]; scenes: SceneKind[] }

/** The looks. A count is for a room of 28 by 24 tiles; bigger maps get more in proportion. */
export const LOOKS: Look[] = [
  { name: 'gallows', country: 'wood', motifs: [['drift:leaves', 3], ['drift:bones', 1], ['hollow', 2], ['bald', 1], ['ridge', 1]], scenes: ['grave', 'circle', 'stake', 'log'] },
  { name: 'mossy', country: 'wood', motifs: [['hollow', 2], ['pool', 1], ['ring', 2], ['drift:pale', 2], ['tallgrass', 1], ['ridge', 1]], scenes: ['log', 'cairn', 'campfire', 'grave'] },
  { name: 'charcoal', country: 'wood', motifs: [['burn', 2], ['bald', 2], ['drift:stones', 2], ['drift:leaves', 1]], scenes: ['campfire', 'cairn', 'stake'] },
  { name: 'drowned', country: 'fen', motifs: [['pool', 4], ['drift:stones', 2], ['tallgrass', 2]], scenes: ['cairn', 'circle'] },
  { name: 'reedmoor', country: 'fen', motifs: [['tallgrass', 4], ['pool', 2], ['drift:pale', 2]], scenes: ['grave', 'stake'] },
  { name: 'fallow', country: 'fields', motifs: [['tallgrass', 3], ['drift:pale', 2], ['bald', 1], ['hollow', 1], ['ridge', 1.5]], scenes: ['grave', 'cairn'] },
  { name: 'poppy', country: 'fields', motifs: [['drift:red', 4], ['tallgrass', 2], ['ring', 1], ['ridge', 1]], scenes: ['graves', 'cairn'] },
  { name: 'raided', country: 'fields', motifs: [['burn', 2], ['drift:bones', 2], ['bald', 2], ['drift:leaves', 1], ['ridge', 1]], scenes: ['stake', 'circle', 'campfire'] },
  { name: 'spoil', country: 'yard', motifs: [['drift:stones', 4], ['pool', 2], ['burn', 1]], scenes: ['campfire', 'cairn'] },
  { name: 'warcamp', country: 'yard', motifs: [['burn', 2], ['drift:bones', 2], ['drift:stones', 2], ['pool', 1]], scenes: ['stake', 'campfire', 'circle'] },
  { name: 'harvest', country: 'crop', motifs: [['bald', 3], ['drift:stones', 2], ['drift:pale', 1], ['ridge', 2]], scenes: ['cairn', 'grave'] },
  { name: 'burnt', country: 'crop', motifs: [['burn', 3], ['bald', 1], ['drift:bones', 2], ['ridge', 1]], scenes: ['stake', 'circle'] },
  { name: 'rubble', country: 'cave', motifs: [['drift:stones', 4], ['pool', 2], ['drift:bones', 1]], scenes: ['cairn', 'campfire'] },
  { name: 'lair', country: 'cave', motifs: [['drift:bones', 3], ['burn', 2], ['pool', 1], ['drift:stones', 1]], scenes: ['stake', 'circle', 'campfire'] },
  // (Paved places: Wickhold and a job's stone streets. Rain lying in the low flags, moss in the damp, a drain.)
  { name: 'rainwet', country: 'town', motifs: [['puddle', 3], ['moss', 1], ['drift:leaves', 1]], scenes: ['drain'] },
  { name: 'mossed', country: 'town', motifs: [['moss', 3], ['puddle', 1], ['drift:leaves', 2]], scenes: ['drain'] },
];

/** Half sizes each motif may take (tiles across; `ry` is that times `flat`). */
const SIZE: Record<MotifKind, [number, number, number]> = {
  puddle: [0.7, 1.5, 0.55], moss: [1.1, 2.4, 0.6], ridge: [2.5, 5, 0.15],
  hollow: [1.6, 2.6, 0.6], pool: [1.3, 2.1, 0.55], bald: [1.2, 2.0, 0.6], tallgrass: [2.6, 4.2, 0.7], burn: [1.2, 1.9, 0.6], ring: [0.8, 1.2, 0.85],
  'drift:leaves': [2.2, 3.6, 0.3], 'drift:bones': [1.6, 2.4, 0.3], 'drift:stones': [1.8, 3.0, 0.3], 'drift:pale': [2.2, 3.8, 0.3], 'drift:red': [2.4, 4.0, 0.32],
};

const seedOf = (m: GameMap, k: number) => [...m.name].reduce((s, ch) => (s * 33 + ch.charCodeAt(0)) % 1000003, m.w * 131 + m.h * 977 + k);

/**
 * What country a map's ground is, from its floor and what stands behind it; null where nothing here applies (a room
 * indoors).
 */
export function countryOf(m: GameMap): Country | null {
  const floor = m.theme.floor as string, back = m.theme.back as string;
  if (back === 'plaster') return null;
  // (A village on cobbles lies on trodden earth in the redraw, three/redrawfloor.ts: a yard. Stone behind: a town.)
  if (floor === 'cobble') return back !== 'stone' ? 'yard' : 'town';
  if (!scattered(m)) return null;
  if (floor === 'flagstone') return 'town';
  if (floor === 'rock') return 'cave';
  if (floor === 'wheat') return 'crop';
  if (floor === 'dirt') return 'yard';
  if (floor !== 'grass' && floor !== 'mud') return null;
  const wet = (m.water ?? []).reduce((s, w) => s + w.w * w.h, 0) / (m.w * m.h);
  if (back === 'trees') return floor === 'mud' || wet > 0.06 ? 'fen' : 'wood';
  return 'fields';
}

/** The map's look: one of its country's, drawn from its name. */
export function lookOf(m: GameMap): Look | null {
  const c = countryOf(m);
  if (!c) return null;
  const mine = LOOKS.filter((l) => l.country === c);
  return mine[new Rng(seedOf(m, 5)).int(mine.length)];
}

/**
 * A map's country in parts: the whole map under its one look, or, where the map says its ground by stretch
 * (`grounds`: the land, docs/design/biome-sets.md "Biodiversity"), each box under the look it names. The box is kept
 * a step or two in from the map's edge.
 */
export interface Part { look: Look; x0: number; y0: number; x1: number; y1: number; i: number }
export function partsOf(m: GameMap, inX = 1.5, inY = 2): Part[] {
  if (m.grounds?.length)
    return m.grounds.flatMap((g, i) => {
      const look = LOOKS.find((l) => l.name === g.look);
      return look ? [{ look, x0: Math.max(inX, g.x), y0: Math.max(inY, g.y), x1: Math.min(m.w - inX, g.x + g.w), y1: Math.min(m.h - inY, g.y + g.h), i }] : [];
    });
  const look = lookOf(m);
  return look ? [{ look, x0: inX, y0: inY, x1: m.w - inX, y1: m.h - inY, i: 0 }] : [];
}
/** The look of the ground at a spot. */
export const lookAt = (m: GameMap, x: number, y: number): Look | null =>
  m.grounds?.length ? (partsOf(m, 0, 0).find((p) => x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1)?.look ?? null) : lookOf(m);

const cache = new WeakMap<GameMap, Motif[]>();

/** Is (x, y) open ground: nothing solid, no path or patch, no water near? */
export function openAt(m: GameMap, x: number, y: number): boolean {
  if (blocked(m, x, y)) return false;
  const s = m.soil?.length ? soilAt(m, x, y) : 'cobble';
  if (s !== 'cobble' && s !== 'grass' && s !== 'shade') return false;
  return !m.water?.some((w) => x > w.x - 0.4 && x < w.x + w.w + 0.4 && y > w.y - 0.4 && y < w.y + w.h + 0.4);
}

/** Is (x, y) the paved floor itself (a town's motifs lie on its stones, not on its greens and lanes)? */
export const pavedAt = (m: GameMap, x: number, y: number) => !m.soil?.length || soilAt(m, x, y) === 'cobble';

/** The look's motifs laid on this map. */
export function motifsOf(m: GameMap): Motif[] {
  const hit = cache.get(m);
  if (hit) return hit;
  const out: Motif[] = [];
  cache.set(m, out);
  for (const part of partsOf(m)) lay(m, part, out);
  return out;
}

/** One part's motifs, on its own roll. */
function lay(m: GameMap, part: Part, out: Motif[]): void {
  const { look, x0, y0, x1, y1 } = part, bw = x1 - x0, bh = y1 - y0;
  const rng = new Rng(seedOf(m, 9 + part.i * 7)), scale = Math.min(6, ((bw + 3) * (bh + 4)) / 672), town = look.country === 'town';
  for (const [kind, per] of look.motifs) {
    const want = Math.max(1, Math.round(per * scale)), [lo, hi, flat] = SIZE[kind], drift = kind.startsWith('drift');
    let got = 0;
    for (let i = 0; i < want * 40 && got < want; i++) {
      const rx = lo + rng.next() * (hi - lo), ry = rx * flat, x = x0 + rx + rng.next() * (bw - 2 * rx), y = y0 + ry + rng.next() * (bh - 2 * ry);
      // (The wind lies a little north of east: a drift lies along it.)
      const a = -0.25 + (rng.next() - 0.5) * 0.7, v = rng.int(1000);
      if (!openAt(m, x, y) || Math.hypot(m.hero.x - x, m.hero.y - y) < 2.5 || (town && !pavedAt(m, x, y))) continue;
      // A zone wants most of its ground open; a drift or a stand of grass only its middle (it parts round things).
      const rim = [0, 1, 2, 3, 4, 5].map((q) => openAt(m, x + Math.cos(q * 1.047) * rx * 0.8, y + Math.sin(q * 1.047) * ry * 0.8)).filter(Boolean).length;
      if (rim < (drift || kind === 'tallgrass' ? 3 : 5)) continue;
      // Zones keep apart from each other; drifts may lie anywhere.
      // (A ridge is a line: it keeps clear of other ridges only, and the zones are laid over it.)
      if (kind === 'ridge' ? out.some((o) => o.kind === 'ridge' && Math.hypot(o.x - x, (o.y - y) * 2.5) < o.rx + rx) : !drift && out.some((o) => !o.kind.startsWith('drift') && o.kind !== 'ridge' && Math.hypot(o.x - x, (o.y - y) * 1.4) < o.rx + rx + 0.8)) continue;
      out.push({ kind, x, y, rx, ry, a, v }), got++;
    }
  }
}

// Test hooks (scripts and screenshots): window.__lookOf(map), window.__motifsOf(map).
if (typeof window !== 'undefined') Object.assign(window, { __lookOf: lookOf, __motifsOf: motifsOf });
