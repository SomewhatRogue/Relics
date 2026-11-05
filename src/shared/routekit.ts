/**
 * The small sums a layout-3 or layout-4 route is rolled with (shared/routeports.ts): where along a side
 * a way out can sit, where you come into the next room, a palette two steps from its neighbours, and
 * the rule that no third room running leaves by the same side.
 */
import type { Palette } from './nodes.js';
import { LAYOUTS } from './nodes.js';
import { LAYOUTS3, MORE_SOIL, SKIN_OF, VILLAGE_PALETTE, type Country, type RouteNode } from './nodeports.js';
import { PALETTES } from './nodes.js';
import { OPP, portRange, type Port, type Side } from './ports.js';
import type { Rng } from './rng.js';
import type { RoomSpec } from './route.js';

export const layoutsOf = (n: RouteNode): string[] => (LAYOUTS as Record<string, string[]>)[n] ?? (LAYOUTS3 as Record<string, string[]>)[n];
export const steps = (a: Palette, b: Palette) => (['floor', 'back', 'soil', 'light'] as const).filter((k) => a[k] !== b[k]).length;

/** Three places along a side for a way out, by its length. */
export function slots(s: Side, w: number, h: number): number[] {
  const [a, b] = portRange(s, w, h);
  return [a, (a + b) / 2, b].map((v) => Math.round(v * 10) / 10);
}

/** Where you come in, from the way out of the room before (scaled to this room's size). */
export function inFrom(o: Port, from: { w: number; h: number }, w: number, h: number): Port {
  const side = OPP[o.side], [lo, hi] = side === 'N' || side === 'S' ? [4, w - 4] : [5, h - 3.5];
  const scale = side === 'N' || side === 'S' ? w / from.w : h / from.h;
  return { side, at: Math.round(Math.max(lo, Math.min(hi, o.at * scale)) * 10) / 10 };
}

/** A palette two steps from every room it follows or leads into (null if there's none: the route rolls again). */
export function paletteFor(rng: Rng, c: Country, back: Palette['back'] | null, after: Palette[]): Palette | null {
  const o = c === 'village' ? VILLAGE_PALETTE : PALETTES[SKIN_OF[c]], all: Palette[] = [];
  for (const floor of o.floor) for (const bk of back ? [back] : o.back) for (const soil of [...o.soil, ...(MORE_SOIL[c] ?? [])]) for (const light of o.light) all.push({ floor, back: bk, soil, light });
  const ok = all.filter((p) => after.every((a) => steps(a, p) >= 2));
  return ok.length ? rng.pick(ok) : null;
}

/** The last out's side, and how many rooms running have left by it. */
const runOf = (path: RoomSpec[]) => {
  const s = path.map((r) => r.outs?.[0].side);
  let n = 0;
  while (n < s.length && s[s.length - 1 - n] === s[s.length - 1]) n++;
  return { side: s[s.length - 1], n };
};
export const notThird = (path: RoomSpec[]) => (o: Side[]) => { const r = runOf(path); return !(o.length === 1 && r.n >= 2 && o[0] === r.side); };
