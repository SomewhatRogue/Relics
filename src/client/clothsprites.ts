/**
 * A look whose cloth is part of its body (the Ranger's and the Rogue's hoods and cloaks, the Mage's robe and hat, the
 * Healer's tabard, the friar's habit) in the cloth a hero has chosen (shared/clothlook.ts, docs/design/cloak-choice.md
 * slices 2 and 3). The look names the colours its cloth is drawn in (lookkit.ts `cloth`): a dye swaps them through
 * every pixel map, front, back and profile, and through what moves (herolife.ts), before the painting, so shading and
 * outline come out as they do now. An edge is the look's own metal where it names it (`edge`: the Healer's tabard
 * edges, hem and Lantern), else a line of metal along the hem: the lowest cloth in each column near the foot. Each
 * dyed look is made once and kept, and is its own object, so the cut body pieces made from it (joints.ts,
 * sidejoints.ts) are its own too. Drawing only.
 */
import type { ClothLook } from '../shared/clothlook';
import { badgeDots, badgeX } from './badgeart';
import { DYE, EDGE, badgeMetal } from './clothlife';
import { HERO_W } from './heroscale';
import type { Cls, Life, LookDef } from './lookkit';
import { heroLook, lookDef, makeSprite, type HeroSprites, type Part } from './sprites';

/** How many rows up from the cloth's lowest row a hem may sit (its foot rises toward the sides). */
const HEM_ROWS = 4;

/** A colour at `k` of its brightness, a little lifted when lighter (a glint on a hood, a sleeve's lit cloth). */
const tone = (c: string, k: number): string => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(c.slice(i, i + 2), 16) * k + (k > 1 ? 14 : 0)))).toString(16).padStart(2, '0')).join('');

/** What each of a look's cloth colours becomes in a dye, by its place in `cloth`: the cloth, its shadow, its lit
 *  side, then a darker cloth and its shadow (a hat, a cowl). */
const dyeTo = (dye: [string, string]): string[] => [dye[0], dye[1], tone(dye[0], 1.35), tone(dye[0], 0.8), tone(dye[1], 0.8)];
/** What each of a look's `edge` colours becomes in a metal: the metal, the metal, its glint. */
const edgeTo = (m: string): string[] => [m, m, tone(m, 1.25)];

/** A table of colour for colour (an empty place in a look's list is skipped). */
function table(from: string[], to: string[], into = new Map<string, string>()): Map<string, string> {
  from.forEach((c, i) => c && to[i] && into.set(c, to[i]));
  return into;
}

/** `parts` (single pixels, as lookkit.ts `art` makes them) with colours swapped; `hem`: the lowest pixels of these
 *  colours, near the cloth's foot, laid in that metal instead. */
function dyed(parts: Part[], swap: Map<string, string>, hem: { of: string[]; trim: string } | null): Part[] {
  const at = new Set<string>();
  let low = -1;
  if (hem) for (const p of parts) if (p[0] === 'p' && hem.of.includes(p[3])) (at.add(p[1] + ',' + p[2]), (low = Math.max(low, p[2])));
  return parts.map((p): Part => {
    if (p[0] !== 'p') return p;
    if (hem && at.has(p[1] + ',' + p[2]) && p[2] >= low - HEM_ROWS && !at.has(p[1] + ',' + (p[2] + 1))) return ['p', p[1], p[2], hem.trim];
    const to = swap.get(p[3]);
    return to ? ['p', p[1], p[2], to] : p;
  });
}

/** Where a badge's top row sits on a look's back, by its class (the rows between the shoulders and the belt). */
const BADGE_ROW = (cls: Cls, i: number, h: number): number => (cls === 'RANGER' ? h - 19 : cls === 'ROGUE' ? h - 22 : cls === 'MAGE' ? h - 14 : i === 1 ? 11 : 8);

/** `up` with a badge laid on its cloth (only on pixels that are cloth, so it never strays onto mail or an arm), in
 *  `metal` with a darker ring of that cloth round it. Looks without a badge row for their class are left alone. */
function badged(up: Part[], cloth: Set<string>, badge: number, metal: string, y0: number): Part[] {
  const at = new Map<string, number>();
  up.forEach((p, n) => p[0] === 'p' && at.set(p[1] + ',' + p[2], n));
  const out = up.slice(), x0 = badgeX(badge), { metal: m, ring } = badgeDots(badge);
  const put = (x: number, y: number, col: (c: string) => string) => {
    const n = at.get(x0 + x + ',' + (y0 + y)), p = n === undefined ? undefined : out[n];
    if (p && p[0] === 'p' && cloth.has(p[3])) out[n!] = ['p', p[1], p[2], col(p[3])];
  };
  for (const [x, y] of ring) put(x, y, (c) => tone(c, 0.6));
  for (const [x, y] of m) put(x, y, () => metal);
  return out;
}

/** What moves, in the same swap (a robe's hem, a hat's tip, a tabard's foot). */
function lifeDyed(life: Life, swap: Map<string, string>): Life {
  const out: Record<string, unknown> = { ...life };
  for (const [k, v] of Object.entries(life)) out[k] = typeof v === 'string' ? swap.get(v) ?? v : Array.isArray(v) ? v.map((c) => swap.get(c) ?? c) : v;
  return out as Life;
}

const defs = new Map<string, LookDef>(), sprites = new Map<string, HeroSprites>();

/** Whether this look in this cloth is anything but the look as drawn. */
const changed = (d: LookDef, c: ClothLook | undefined): c is ClothLook => !!c && !!d.cloth && (c.dye > 0 || c.edge > 0 || !!c.badge);

/** A look's definition in a cloth: the look's own when nothing is chosen or its cloth is not part of its body. */
export function lookDefIn(cls: Cls, i = 0, c?: ClothLook): LookDef {
  const d = lookDef(cls, i);
  if (!changed(d, c)) return d;
  const key = `${cls}${i}:${c.dye}:${c.edge}:${c.badge ?? 0}`;
  let out = defs.get(key);
  if (!out) {
    const dye = DYE[c.dye], trim = EDGE[c.edge], swap = dye ? table(d.cloth!, dyeTo(dye)) : new Map<string, string>();
    if (trim && d.edge) table(d.edge, edgeTo(trim), swap);
    const hem = trim && !d.edge ? { of: d.cloth!.filter(Boolean), trim } : null;
    out = { ...d, down: dyed(d.down, swap, hem), up: dyed(d.up, swap, hem), life: lifeDyed(d.life, swap) };
    if (c.badge) {
      // (Cloth is judged after the dye: a pixel counts if it is one of the colours the cloth has become.)
      const cloth = new Set(d.cloth!.filter(Boolean).map((k) => swap.get(k) ?? k));
      out.up = badged(out.up, cloth, c.badge, trim ?? d.edge?.[0] ?? badgeMetal(0), BADGE_ROW(cls, i, d.h));
    }
    if (d.side) out.side = { ...d.side, body: dyed(d.side.body, swap, hem), arm: dyed(d.side.arm, swap, null) };
    defs.set(key, out);
  }
  return out;
}

/** A look's sprites in a cloth (sprites.ts `heroLook`, dyed). */
export function heroLookIn(cls: Cls, i = 0, c?: ClothLook): HeroSprites {
  const d = lookDefIn(cls, i, c);
  if (d === lookDef(cls, i)) return heroLook(cls, i);
  const key = `${cls}${i}:${c!.dye}:${c!.edge}:${c!.badge ?? 0}`;
  let s = sprites.get(key);
  if (!s) sprites.set(key, (s = { down: makeSprite(HERO_W, d.h, d.down), up: makeSprite(HERO_W, d.h, d.up) }));
  return s;
}
