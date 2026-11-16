/**
 * Named body pieces as their own things on the hero (docs/design/gear-looks.md), over the armour weights'
 * shapes (armourlook.ts): the unique armour (shared/uniques.ts) as its `line` says, and the Hungry apron and
 * coat (shared/hungry.ts). Each says its colour at a pixel of a part, or falls back to its weight's look
 * (`undefined`), or leaves the body as it is (`null`). Drawing only; the Deep chat owns how uniques look.
 */
import type { JointKind } from './joints';

/** Where a pixel is: the part, its row from the part's top and bottom, its column across the part (0 to 1), its shade (0 to 2), a stable hash. */
export interface At { kind: JointKind; r: number; rb: number; cx: number; t: number; n: number }
type Paint = (p: At) => string | null | undefined;

const shoulders = (p: At) => p.kind === 'arm' || p.kind === 'back';
const pick = (cols: string[], t: number) => cols[Math.min(cols.length - 1, t)];

export const NAMED_ARMOUR: Record<string, Paint> = {
  // Riveted iron plate, dented all over: dull iron, a rivet every few pixels, dark dents.
  smeltplate: (p) => {
    const c = pick(['#4e5258', '#6a6e74', '#868a90'], p.t);
    if (p.kind === 'torso' ? p.r < 2 : shoulders(p) && p.r < 3) return p.n % 4 === 0 ? '#b8bcc2' : p.n % 7 === 0 ? '#34373c' : c;
    return undefined;
  },
  // Iron plates off the biggest ones, laced together: dark plates with leather lacing between.
  ironscales: (p) => {
    if (p.kind === 'torso' ? p.r < 2 : shoulders(p) && p.r < 3) return Math.round(p.cx * 6) % 3 === 0 ? '#7a5434' : pick(['#3a3e44', '#545860', '#6e727a'], p.t);
    return undefined;
  },
  // Steel gone dark with cave water, quiet: dark wet mail over the shoulders and chest, a wet glint here and there.
  dampmail: (p) => {
    if (p.kind === 'torso' ? p.r < 4 : shoulders(p) && p.r < 3) return p.n % 9 === 0 ? '#8aa4b4' : (p.n + p.r) % 2 ? '#2e343c' : '#46505a';
    return null;
  },
  // A belt hung with teeth on cords: a belt at the waist, teeth hanging off it.
  mawlbelt: (p) => {
    if (p.kind !== 'torso') return null;
    if (p.rb === 1) return p.cx > 0.45 && p.cx < 0.55 ? '#b08a3a' : '#3a2818';
    if (p.rb === 0 && p.n % 2 === 0) return '#e8dcb8';
    return null;
  },
  // Thick, scarred, never cured: raw hide over the shoulders, pale scars across it.
  skarnhide: (p) => {
    if (p.kind === 'torso' ? p.r < 3 : shoulders(p) && p.r < 3) return p.n % 6 === 0 ? '#c8a890' : pick(['#5a3c30', '#7a5644', '#94705a'], p.t);
    return null;
  },
  // Leather, stiff with old cooking: a smock down the front on shoulder straps, stained dark.
  spoonapron: (p) => {
    if (p.kind !== 'torso') return null;
    if (p.r < 2) return p.cx < 0.3 || p.cx > 0.7 ? '#5a4028' : null;
    if (p.cx > 0.22 && p.cx < 0.78) return p.n % 5 === 0 ? '#3a2818' : pick(['#5e4430', '#7a5a3a', '#8e6c48'], p.t);
    return null;
  },
  // Leather the fen turned black, waxed thick at the seams: a black jerkin, its seams shining.
  fenhide: (p) => {
    if (p.kind === 'torso' ? p.r < 4 : shoulders(p) && p.r < 3) return p.r === 2 || Math.abs(p.cx - 0.5) < 0.06 ? '#5a5048' : pick(['#16141a', '#221e22', '#2e2a2c'], p.t);
    return null;
  },
  // The Butcher's Apron: a pale butcher's apron down the front, blood on it.
  apron: (p) => {
    if (p.kind !== 'torso') return undefined;
    if (p.r < 2) return p.cx < 0.3 || p.cx > 0.7 ? '#8a7c68' : undefined;
    if (p.cx > 0.2 && p.cx < 0.8) return p.n % 4 === 0 ? '#7a1e1e' : p.n % 11 === 0 ? '#4a1010' : pick(['#9a8e7c', '#b8ac98', '#cfc4b0'], p.t);
    return null;
  },
  // The Ransom Coat: a dark coat with coins sewn all over it.
  ransom: (p) => {
    if (p.kind === 'torso' || shoulders(p)) return p.n % 9 === 0 ? '#e8c050' : p.r < 1 ? '#b08a3a' : pick(['#2a1e2a', '#3a2a3a', '#4a3a4a'], p.t);
    return null;
  },
};
