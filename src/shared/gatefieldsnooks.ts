/**
 * The north fields' nooks (Kyle, 2026-11-25: "little nooks to explore with little scenes or themes. Maybe even mini
 * bosses that drop better loot but you have to find."). Five side pockets off the paths, each closed by a ring of
 * bushes (trees among them in the wood) with one opening turned away from the road, so you find them by looking, not
 * by walking the road. Each holds a small scene of the land's own pieces. Two hold a mini boss with a guard or two and a
 * chained chest (two finds, a tier up: sim/chests.ts); the cairn keeps a plain one. Fixed spots, claimed before the
 * scatter so the cover keeps out. Pure.
 *   THE SHEPHERD'S LEAN-TO, west of the barn between the pasture and the strips: a lean-to, a cold fire, sheep's bones;
 *     an elite wolf-keeper (plated, quick) and two wolves have it now (pack 415).
 *   THE BURIAL CAIRN, the wood's south-west corner: a cairn of stones, a headstone, a mound with flowers (a plain chest).
 *   THE GOBLIN CACHE, the wood's north-east corner: crates, a barrel, sacks and a handcart of stolen things; a BIG ONE
 *     brute and two fodder keep it (pack 414).
 *   THE POACHER'S HIDE, east of the barn by the hedge: snare posts, hares hung, a scorched fire spot, a log to sit on.
 *   THE BOUNDARY STONE, the gate road's east corner: an old marker stone, flowers and pots left at its foot.
 */
import { block, claim, mark, prop, round, type Kit } from './expedkit.js';
import { cast } from './encounter.js';
import { FOE_CLAIM, put } from './gatefieldsfoes.js';
import type { Foe } from './terrain.js';
import { BIG } from './threat.js';
import { VARIANTS } from './tuning.js';

/** A nook: its middle, the ring's radius, the opening's direction (radians, y down), the mini boss's pack if any. */
export interface Nook { name: string; x: number; y: number; r: number; gap: number; wood?: boolean; pack?: number }

export const NOOKS: Nook[] = [
  { name: "THE SHEPHERD'S LEAN-TO", x: 16, y: 81, r: 4.6, gap: (3 * Math.PI) / 4, pack: 415 },
  { name: 'THE BURIAL CAIRN', x: 9.5, y: 30.5, r: 4.2, gap: -Math.PI / 2, wood: true },
  { name: 'THE GOBLIN CACHE', x: 75, y: 22, r: 4.4, gap: -Math.PI / 2, wood: true, pack: 414 },
  { name: "THE POACHER'S HIDE", x: 77, y: 82, r: 3.8, gap: Math.PI / 2 },
  { name: 'THE BOUNDARY STONE', x: 75, y: 136, r: 3.8, gap: (-3 * Math.PI) / 4 },
];
/** The mini bosses' packs (not the bounties': shared/bounties.ts counts 401 to 408). */
export const NOOK_PACKS = NOOKS.flatMap((n) => (n.pack ? [n.pack] : []));

/** The ring round a nook, open a hand's width (about three tiles) at `gap`. */
function ring(k: Kit, n: Nook): void {
  const count = Math.ceil((Math.PI * 2 * n.r) / 0.72);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI, off = Math.abs(Math.atan2(Math.sin(a - n.gap), Math.cos(a - n.gap)));
    if (off < 0.36) continue;
    const tree = n.wood && i % 3 === 1;
    k.rounds.push({ kind: tree ? 'tree' : 'bush', x: n.x + Math.cos(a) * n.r, y: n.y + Math.sin(a) * n.r, r: tree ? 0.6 : 0.45 });
  }
  claim(k, n.x, n.y, n.r + 1.2);
  // (The way in kept clear of the scatter.)
  claim(k, n.x + Math.cos(n.gap) * (n.r + 1.8), n.y + Math.sin(n.gap) * (n.r + 1.8), 1.6);
}

const grim = (k: Kit, kind: 'bones' | 'strewn' | 'hung' | 'tally', x: number, y: number) => k.grim.push({ kind, x, y, k: Math.round(x * 7 + y * 3) % 5 });
const foe = (k: Kit, pack: number, x: number, y: number, f: Partial<Foe>) => (k.foes.push(Object.assign(cast({ kind: 'scrapper', x, y, pack }, 'heavy'), f)), claim(k, x, y, FOE_CLAIM));

function leanTo(k: Kit, n: Nook): void {
  block(k, 'tent', n.x - 2.4, n.y - 2.6, 2.6, 2.2);
  round(k, 'cookfire', n.x + 0.6, n.y + 0.2, 0.4), round(k, 'woodpile', n.x - 3.4, n.y - 0.4, 0.4), round(k, 'sacks', n.x - 2.8, n.y + 1.4, 0.34);
  grim(k, 'bones', n.x + 1.8, n.y + 1.6), mark(k, 'blood', n.x - 1, n.y + 2, 2, 0.8);
  put(k, n.pack!, n.x + 1.4, n.y + 1.8, 'keeper', { elite: ['plated', 'quick'] });
  put(k, n.pack!, n.x - 1.4, n.y + 1.9, 'wolf'), put(k, n.pack!, n.x + 2.9, n.y, 'wolf');
  k.chests.push({ x: n.x + 2.6, y: n.y - 2.2, chained: true, guard: n.pack! });
}

function cairn(k: Kit, n: Nook): void {
  for (const [x, y] of [[0, 0], [0.7, 0.3], [-0.6, 0.4], [0.2, -0.5], [-0.2, 0.9]]) round(k, 'rock', n.x + x, n.y + y, 0.4);
  round(k, 'headstone', n.x + 2.1, n.y + 1.1, 0.35), mark(k, 'mound', n.x - 1.5, n.y + 1.7, 2.6, 1), mark(k, 'flowers', n.x + 1.1, n.y + 2.3, 1.6, 0.6);
  round(k, 'crows', n.x + 1.2, n.y - 2.2, 0.15);
  k.chests.push({ x: n.x - 2.2, y: n.y - 2 });
}

function cache(k: Kit, n: Nook): void {
  prop(k, 'crate', n.x - 2, n.y - 2.2), prop(k, 'barrel', n.x - 0.6, n.y - 2.6);
  round(k, 'sacks', n.x + 2.4, n.y - 1.8, 0.34), round(k, 'crates', n.x + 2.6, n.y + 1.6, 0.45), round(k, 'handcart', n.x - 2.6, n.y + 2.4, 0.5);
  grim(k, 'strewn', n.x, n.y + 2.6), mark(k, 'trample', n.x - 1.4, n.y + 0.4, 3, 1);
  foe(k, n.pack!, n.x + 0.2, n.y, { big: true, hp: Math.round(VARIANTS.heavy.hp * BIG.hp), harm: BIG.harm });
  put(k, n.pack!, n.x - 2.2, n.y + 0.4, 'fodder'), put(k, n.pack!, n.x + 2.4, n.y, 'fodder');
  k.chests.push({ x: n.x, y: n.y + 3.1, chained: true, guard: n.pack! });
}

function hide(k: Kit, n: Nook): void {
  round(k, 'post', n.x - 1.6, n.y - 1.8, 0.2), round(k, 'post', n.x + 1.6, n.y - 1.6, 0.2);
  grim(k, 'hung', n.x, n.y - 2), grim(k, 'tally', n.x + 2, n.y + 0.4);
  mark(k, 'scorch', n.x - 1.4, n.y + 1, 1.4, 0.8), block(k, 'log', n.x + 0.6, n.y + 1.4, 2.2, 0.5);
  mark(k, 'trample', n.x - 1.6, n.y + 2, 2.4, 0.7);
}

function boundary(k: Kit, n: Nook): void {
  round(k, 'waymark', n.x, n.y, 0.4), round(k, 'pots', n.x + 1.4, n.y + 1, 0.3);
  mark(k, 'flowers', n.x - 1.2, n.y + 1, 2.4, 0.7), round(k, 'crows', n.x + 2.2, n.y - 1.4, 0.15);
}

const SCENES = [leanTo, cairn, cache, hide, boundary];

export function layNooks(k: Kit): void {
  NOOKS.forEach((n, i) => (ring(k, n), SCENES[i](k, n)));
}
