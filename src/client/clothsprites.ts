/**
 * A look whose cloth is part of its body (the Ranger's hood and cloak, the Rogue's hood and long cloak) in the
 * cloth a hero has chosen (shared/clothlook.ts, docs/design/cloak-choice.md slice 2). The look names the colours
 * its cloth is drawn in (lookkit.ts `cloth`): a dye swaps them through every pixel map, front, back and profile,
 * before the painting, so shading and outline come out as they do now; an edge is a line of metal along the hem,
 * the lowest cloth in each column near the cloak's foot. Each dyed look is made once and kept, and is its own
 * object, so the cut body pieces made from it (joints.ts, sidejoints.ts) are its own too. Drawing only.
 */
import type { ClothLook } from '../shared/clothlook';
import { DYE, EDGE } from './clothlife';
import { HERO_W } from './heroscale';
import type { Cls, LookDef } from './lookkit';
import { heroLook, lookDef, makeSprite, type HeroSprites, type Part } from './sprites';

/** How many rows up from the cloak's lowest row a hem may sit (its foot rises toward the sides). */
const HEM_ROWS = 4;

/** A colour a step lighter: the glint on a dyed hood. */
const lift = (c: string): string => '#' + [1, 3, 5].map((i) => Math.min(255, Math.round(parseInt(c.slice(i, i + 2), 16) * 1.35 + 14)).toString(16).padStart(2, '0')).join('');

/** `parts` (single pixels, as lookkit.ts `art` makes them) with the cloth's colours swapped and its hem edged. */
function dyed(parts: Part[], from: string[], to: (string | undefined)[], trim: string | null): Part[] {
  const at = new Map<string, number>();
  let low = -1;
  parts.forEach((p, i) => {
    if (p[0] !== 'p' || !from.includes(p[3])) return;
    at.set(p[1] + ',' + p[2], i);
    low = Math.max(low, p[2]);
  });
  return parts.map((p, i): Part => {
    if (p[0] !== 'p' || at.get(p[1] + ',' + p[2]) !== i) return p;
    if (trim && p[2] >= low - HEM_ROWS && !at.has(p[1] + ',' + (p[2] + 1))) return ['p', p[1], p[2], trim];
    return ['p', p[1], p[2], to[from.indexOf(p[3])] ?? p[3]];
  });
}

const defs = new Map<string, LookDef>(), sprites = new Map<string, HeroSprites>();

/** Whether this look in this cloth is anything but the look as drawn. */
const changed = (d: LookDef, c: ClothLook | undefined): c is ClothLook => !!c && !!d.cloth && (c.dye > 0 || c.edge > 0);

/** A look's definition in a cloth: the look's own when nothing is chosen or its cloth is not part of its body. */
export function lookDefIn(cls: Cls, i = 0, c?: ClothLook): LookDef {
  const d = lookDef(cls, i);
  if (!changed(d, c)) return d;
  const key = `${cls}${i}:${c.dye}:${c.edge}`;
  let out = defs.get(key);
  if (!out) {
    const dye = DYE[c.dye], to = dye ? [dye[0], dye[1], lift(dye[0])] : [], trim = EDGE[c.edge], from = d.cloth!;
    out = { ...d, down: dyed(d.down, from, to, trim), up: dyed(d.up, from, to, trim) };
    if (d.side) out.side = { ...d.side, body: dyed(d.side.body, from, to, trim), arm: dyed(d.side.arm, from, to, null) };
    defs.set(key, out);
  }
  return out;
}

/** A look's sprites in a cloth (sprites.ts `heroLook`, dyed). */
export function heroLookIn(cls: Cls, i = 0, c?: ClothLook): HeroSprites {
  const d = lookDefIn(cls, i, c);
  if (d === lookDef(cls, i)) return heroLook(cls, i);
  const key = `${cls}${i}:${c!.dye}:${c!.edge}`;
  let s = sprites.get(key);
  if (!s) sprites.set(key, (s = { down: makeSprite(HERO_W, d.h, d.down), up: makeSprite(HERO_W, d.h, d.up) }));
  return s;
}
