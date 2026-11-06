/**
 * What layout 4 adds to a room as it's planned (shared/terrain.ts calls these): the way at the fork
 * that led here (its goblins more or fewer, its chest, crows on its dead), each new room's own light,
 * the fork's ways named by what you can tell from where you stand, and what the scene left (prisoners
 * on their rope, oil spilled by a wrecked cart). A layout-3 room never comes here.
 */
import type { Area, Block, GameMap, Npc, Road, Round, Theme, Water } from './arena.js';
import type { Rng } from './rng.js';
import type { Spot } from './sitekit.js';
import { along, boxOff, type Pt } from './spine.js';
import { NODE_LIGHT, isNode4 } from './nodes4.js';
import type { RoomSpec } from './route.js';
import { WAYS } from './ways.js';
import type { Lay } from './vignettes.js';

type P = { x: number; y: number };

/** Goblins more or fewer for the way that led here. */
export const wayMore = (spec: RoomSpec | null) => (spec?.way ? WAYS[spec.way].more : 0);

/** A new room's light: its ambient and moon scaled (the deep wood dark, the cave darker, the churchyard moonlit). */
export function light4(theme: Theme, spec: RoomSpec | null): Theme {
  if (!spec || !isNode4(spec.node as string)) return theme;
  const k = NODE_LIGHT[spec.node as keyof typeof NODE_LIGHT];
  return { ...theme, ambient: theme.ambient.map((a) => a * k.amb) as Theme['ambient'], moon: theme.moon * k.moon };
}
/** Whether a room has torches on its back wall: a new room's own say, else its country's. */
export const torches4 = (spec: RoomSpec | null, dflt: boolean) => (spec && isNode4(spec.node as string) ? NODE_LIGHT[spec.node as keyof typeof NODE_LIGHT].torches ?? dflt : dflt);

/** A fork's ways named by what you can tell from here (the word over the gap; its cue: client/waycues.ts). */
export const name4 = (r: Road): Road => (r.way ? { ...r, label: WAYS[r.way].word } : r);

/**
 * After the scene: the way's chest for certain, crows on the dead down the CROWS way, a wrecked cart's
 * oil spilled under it with two of them at it, and the prisoners' rope on the map.
 */
export function finish4(l: Lay, spec: RoomSpec, map: GameMap, chests: P[], dead: Npc[], spot: (r: number, y0?: number, y1?: number) => P | null): void {
  chests.push(...(l.chests ?? []));
  const way = spec.way && WAYS[spec.way];
  if (way?.chest && !chests.length) {
    const c = dead[0] ? { x: dead[0].x + 1.2, y: dead[0].y + 0.6 } : spot(0.6, 2.5, l.H - 5);
    if (c) chests.push(c);
  }
  if (spec.way === 'crows' && dead.length && !l.flocks?.length) l.flocks?.push({ x: dead[0].x, y: dead[0].y - 0.2 });
  if (spec.piece === 'wreck') {
    const cart = [...l.blocks].reverse().find((b) => b.kind === 'cart' && b.worn);
    if (cart) {
      const x = cart.x + cart.w / 2, y = cart.y + cart.h + 0.6;
      (l.oil ??= []).push({ x, y, r: 1.7 });
      for (const dx of [-1.3, 1.3]) l.foes.push({ kind: 'scrapper', x: x + dx, y: y + 0.4, feeding: true });
    }
  }
  if (l.led) map.led = l.led;
  if (l.staithe) map.staithe = l.staithe;
  if (l.oil?.length) map.oil = l.oil;
}

/** Clear growth and small things (never a landmark or a building) off box `a` and `pad` round it, from each list. */
export function clearGrowth(lists: Round[][], a: Area, pad = 0.6): void {
  for (const list of lists) for (let i = list.length - 1; i >= 0; i--) {
    const q = list[i];
    if (CLEARABLE.has(q.kind) && q.x + q.r > a.x - pad && q.x - q.r < a.x + a.w + pad && q.y + q.r > a.y - pad && q.y - q.r < a.y + a.h + pad) list.splice(i, 1);
  }
}

/** What a scene can clear to make room for itself: growth and small things, never a landmark or a building. */
const CLEARABLE = new Set(['tree', 'pine', 'bush', 'hay', 'reed', 'stump', 'apple', 'headstone', 'rock', 'support', 'post']);
export interface PlotIn { rng: Rng; W: number; H: number; spine: Pt[][]; keepOff: P[]; blocks: Block[]; rounds: Round[][]; water: Water[]; spots: Spot[] }
/**
 * A finder for a scene's ground (a cottage, the hanging tree, a war band's ring): a `w` by `h` box beside
 * the track a third to two thirds along, clear of buildings, water, the ways and the room's spots; the
 * growth on it is cleared. Null if there's nowhere.
 */
export function plotter(o: PlotIn): (w: number, h: number, near?: number) => Area | null {
  return (w, h, near = 2.2) => {
    const cands = o.rng.shuffle(along(o.spine[0], 0.5).filter((p) => p.t > 0.2 && p.t < 0.8));
    for (const extra of [0, 1.5, 3.5]) for (const p of cands) for (const sd of [-1, 1]) {
      const d = near + extra + Math.max(w, h) / 2, cx = p.x - p.dy * d * sd, cy = p.y + p.dx * d * sd, a = { x: cx - w / 2, y: cy - h / 2, w, h };
      if (a.x < 1 || a.y < 1.5 || a.x + a.w > o.W - 1 || a.y + a.h > o.H - 3 || boxOff(o.spine, a) < near - 0.4) continue;
      const hit = (q: Area, pad: number) => q.x < a.x + a.w + pad && q.x + q.w > a.x - pad && q.y < a.y + a.h + pad && q.y + q.h > a.y - pad;
      if (o.blocks.some((b) => hit(b, 0.8)) || o.water.some((q) => hit(q, 0.6)) || o.keepOff.some((k) => Math.hypot(k.x - cx, k.y - cy) < Math.max(w, h) / 2 + 3.2)) continue;
      if (o.spots.some((s) => hit({ x: s.x - s.r, y: s.y - s.r, w: s.r * 2, h: s.r * 2 }, 0.2))) continue;
      if (o.rounds[0].some((q) => !CLEARABLE.has(q.kind) && hit({ x: q.x - q.r, y: q.y - q.r, w: q.r * 2, h: q.r * 2 }, 0.8))) continue;
      for (const list of o.rounds) for (let i = list.length - 1; i >= 0; i--) {
        const q = list[i];
        if (CLEARABLE.has(q.kind) && hit({ x: q.x - q.r, y: q.y - q.r, w: q.r * 2, h: q.r * 2 }, 0.8)) list.splice(i, 1);
      }
      o.spots.push({ x: cx, y: cy, r: Math.max(w, h) / 2 });
      return a;
    }
    return null;
  };
}

/** What a new room must show, whatever its plan managed beside its water and track: the mill, the church, the headframe. */
const MUST: Record<string, [Block['kind'], number, number]> = { mill: ['mill', 4.4, 3], churchyard: ['church', 4.8, 3.2], minehead: ['headframe', 2.6, 2.6] };
export function ensure4(spec: RoomSpec, blocks: Block[], plot: ((w: number, h: number, near?: number) => Area | null) | undefined): void {
  const m = MUST[spec.node as string];
  if (!m || !plot || blocks.some((b) => b.kind === m[0])) return;
  const a = plot(m[1], m[2], 2);
  if (a) blocks.push({ kind: m[0], ...a, ...(m[0] === 'mill' ? { look: spec.layout === 'wheelleft' ? 1 : 0 } : {}) });
}
