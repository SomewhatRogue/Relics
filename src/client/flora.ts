/**
 * Plants that are not copies (docs/design/flora.md, slice 2). Every tree, pine and bush was one drawing in one
 * green, so a wood read as a row of stamps. A plant's look is now chosen by where it stands, the same in both
 * views: one of three outlines, one of four greens (the old green, an olive, a blue-green, a deep shaded one),
 * mirrored or not, one of three sizes by its own radius, and for a bush whether it shows berries, blossom or
 * neither. Few shapes, many placements: nothing new is drawn by hand.
 *
 * Pure: no canvas here. The flat view builds its sprites from this in florasprites.ts; the 2.5D view shapes its
 * lumps from it in three/rounds3d.ts and three/nature3d.ts.
 */
export type FloraKind = 'tree' | 'pine' | 'bush' | 'willow';
export interface FloraLook {
  /** 0 as it always was; 1 taller and narrower; 2 broader and lower. */
  shape: 0 | 1 | 2;
  /** Which of `TINTS`. */
  green: number;
  flip: boolean;
  /** 0 small, 1 middling, 2 big: from the plant's radius. */
  size: 0 | 1 | 2;
  /** A bush only: 0 plain, 1 berries, 2 blossom. */
  fruit: 0 | 1 | 2;
}

/** How each green moves a leaf colour's red, green and blue: the old green, olive, blue-green, deep shade. */
export const TINTS: [number, number, number][] = [[1, 1, 1], [1.3, 1.07, 0.78], [0.8, 1, 1.2], [0.85, 0.86, 0.9]];
/** A crown's width and height against the first shape's, for each shape. */
export const CROWN: [number, number][] = [[1, 1], [0.82, 1.24], [1.22, 0.82]];
/** How big each size is drawn against the middling one. */
export const SIZES = [0.8, 1, 1.22];

/** A whole number from a place, well mixed, the same on every screen. */
export const placeHash = (x: number, y: number): number => Math.floor(Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453));

export function floraLook(kind: FloraKind, x: number, y: number, r: number): FloraLook {
  const h = placeHash(x, y), cut = kind === 'bush' ? [0.36, 0.55] : kind === 'pine' ? [0.42, 0.62] : [0.4, 0.65];
  // Half keep the old green, so a wood is still one wood; a pine is its own green or the blue one only.
  // A willow (a tree round with `look: 1`) is grey-green: its own or the deep shade. (The blue one turned it teal.)
  const pick = h % 10, green = kind === 'pine' ? (pick < 6 ? 0 : 2) : kind === 'willow' ? (pick < 6 ? 0 : 3) : pick < 4 ? 0 : pick < 6 ? 1 : pick < 8 ? 2 : 3;
  const fruit = kind !== 'bush' ? 0 : (h >> 5) % 9 < 3 ? 1 : (h >> 5) % 9 === 3 ? 2 : 0;
  return {
    shape: kind === 'pine' ? 0 : (((h >> 3) % 3) as 0 | 1 | 2), green, flip: ((h >> 7) & 1) === 1,
    size: r < cut[0] ? 0 : r < cut[1] ? 1 : 2, fruit: fruit as 0 | 1 | 2,
  };
}

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
/** A leaf colour in one of the greens (`0xrrggbb`). Anything that is not a green (bark, a berry) is left alone. */
export function tintHex(c: number, green: number): number {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, t = TINTS[green] ?? TINTS[0];
  if (g <= r || g <= b) return c;
  return (clamp(r * t[0]) << 16) | (clamp(g * t[1]) << 8) | clamp(b * t[2]);
}
/** The same for a `#rrggbb` string. */
export const tintCss = (s: string, green: number): string => '#' + tintHex(parseInt(s.slice(1), 16), green).toString(16).padStart(6, '0');
