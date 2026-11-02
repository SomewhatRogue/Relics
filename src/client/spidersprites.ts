/**
 * Spider sprites, drawn in code in the same flat, outlined style as the goblins: near-black bodies with
 * a dull sheen, eyes in clusters that glow (two big, two small), thin dark legs. Two leg frames for the
 * skitter. The brood mother is the same thing grown fat, with a pale mark on her back and fangs. The
 * nest is a mound of web with egg sacs in it. Cut into parts (joints.ts) so they pose like everything else.
 */
import type { Cut } from './joints';
import { makeSprite, type Sprite } from './sprites';

type Part = Parameters<typeof makeSprite>[2][number];
const BODY = '#221c26', BACK = '#2c2432', LEG = '#16121a', SHEEN = '#4a3a52', EYE = '#ff8a3a', SMALL = '#ff4a3a';

/** Legs either side of the body: each leg is a few pixels, bent at the knee; `f` swaps the stride. */
function legs(w: number, rows: number[], f: number, col = LEG): Part[] {
  const out: Part[] = [];
  rows.forEach((y, i) => {
    const k = (i + f) % 2, mid = (w - 1) / 2;
    for (const s of [-1, 1]) {
      const x0 = Math.round(mid + s * (mid - 2)), x1 = Math.round(mid + s * (mid - 1)), x2 = Math.round(mid + s * mid);
      out.push(['p', x0, y, col], ['p', x1, y - 1 + k, col], ['p', x2, y + k, col]);
    }
  });
  return out;
}

const small = (f: number, eyes: boolean): Part[] => [
  ...legs(11, [3, 4, 5, 6], f),
  ['e', 5.5, 2.2, 2.6, 2.1, BODY], ['p', 5, 1, SHEEN], ['p', 6, 2, '#3a2a3a'],
  ['e', 5.5, 4.6, 1.8, 1.4, BACK],
  ...(eyes ? ([['p', 4, 4, EYE], ['p', 6, 4, EYE], ['p', 4, 5, SMALL], ['p', 6, 5, SMALL]] as Part[]) : []),
];

const mother = (f: number, eyes: boolean): Part[] => [
  ...legs(19, [5, 7, 9, 11], f),
  ...legs(17, [6, 8, 10], f + 1).map((p) => (p[0] === 'p' ? (['p', p[1] + 1, p[2], p[3]] as Part) : p)),
  ['e', 9.5, 4.5, 5.2, 4.2, BODY], ['e', 9.5, 3.5, 2.5, 1.6, '#3a2e40'], ['p', 9, 3, '#6a5a4a'], ['p', 10, 3, '#6a5a4a'], ['p', 9, 4, '#7a1d1d'], ['p', 10, 5, '#7a1d1d'],
  ['p', 7, 2, SHEEN], ['p', 8, 2, SHEEN],
  ['e', 9.5, 9.2, 3.4, 2.4, BACK],
  ['p', 8, 12, '#c8c0a8'], ['p', 11, 12, '#c8c0a8'],
  ...(eyes ? ([['p', 8, 9, EYE], ['p', 11, 9, EYE], ['p', 9, 9, EYE], ['p', 10, 9, EYE], ['p', 8, 10, SMALL], ['p', 11, 10, SMALL]] as Part[]) : []),
];

/** The nest: a low mound of grey web over dark ground, egg sacs bulging out of it, a hole they come out of. */
const nest: Part[] = [
  ['e', 11, 9, 10.5, 4.6, '#2a2630'], ['e', 11, 8, 9, 4, '#5a5664'], ['e', 11, 7.5, 7, 3.2, '#6e6a78'],
  ['e', 11, 9.2, 2.2, 1.4, '#0d0b10'],
  ['e', 6, 7, 2.2, 1.8, '#b8ae96'], ['e', 15.5, 7.5, 2.4, 1.9, '#a89c84'], ['e', 9, 5, 1.8, 1.5, '#c8bfa8'], ['e', 13.5, 4.6, 1.7, 1.4, '#b8ae96'],
  ['p', 6, 6, '#e0d8c0'], ['p', 9, 4, '#e0d8c0'], ['p', 15, 6, '#d0c6ae'],
  ['p', 2, 6, '#8a8494'], ['p', 3, 5, '#8a8494'], ['p', 19, 6, '#8a8494'], ['p', 18, 5, '#8a8494'], ['p', 11, 2, '#8a8494'], ['p', 11, 3, '#8a8494'],
];
/** What's left of a nest: torn web flat on the ground, the sacs burst. */
const torn: Part[] = [['e', 11, 4, 10, 3, '#1e1a22'], ['e', 11, 3.6, 7, 2, '#3a3640'], ['p', 6, 3, '#6a6050'], ['p', 15, 4, '#6a6050'], ['p', 10, 2, '#4a4652'], ['p', 13, 5, '#2a2018']];

export const SPIDER_SPRITES: Record<string, Sprite> = {
  spiderA: makeSprite(11, 7, small(0, true)),
  spiderB: makeSprite(11, 7, small(1, true)),
  spiderUpA: makeSprite(11, 7, small(0, false)),
  spiderUpB: makeSprite(11, 7, small(1, false)),
  broodA: makeSprite(19, 13, mother(0, true)),
  broodB: makeSprite(19, 13, mother(1, true)),
  broodUp: makeSprite(19, 13, mother(0, false)),
  nest: makeSprite(22, 14, nest),
  nestTorn: makeSprite(22, 7, torn),
};

/** Where they're cut: the abdomen is the "head" (it bobs most), the legs below, the front legs left and right. */
export const SPIDER_CUT: Cut = { headTo: 3, hip: 6, back: [0, 2, 3, 6], arm: [8, 2, 11, 6] };
export const BROOD_CUT: Cut = { headTo: 6, hip: 11, back: [0, 4, 4, 11], arm: [15, 4, 19, 11] };
