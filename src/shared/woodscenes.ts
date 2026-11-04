/**
 * What you see through the trees on the way through Greyhollow, and can never get to: the goblins
 * at what the column left. Two squabbling over a dead ox from the baggage train, two dragging one
 * of the dead off into the trees, a deer run down, a fire with something turning over it, and the
 * last of the column still on his feet in there, not for long. Paint only: no room ever holds them,
 * so nothing can hit, shoot, catch or be caught by them (client/vignettes.ts plays them). Each sits
 * past the thicket (shared/woodedge.ts), with the edge in front of it kept low (`window`) so it can
 * be seen over, and the wood behind it cleared a little (`keep` tiles round it).
 */
import type { Mark, Round, Soil } from './arena.js';

export type VignetteKind = 'squabble' | 'drag' | 'deer' | 'spit' | 'lastman';
export interface Vignette {
  kind: VignetteKind;
  /** Where it happens (tiles); `to`, where it goes (the dragged body's end, the deer's run). */
  x: number;
  y: number;
  to?: [number, number];
  /** The thicket here is brambles and rocks, low enough to see over. */
  window: { x: number; y: number; w: number; h: number };
  keep: number;
}

export const VIGNETTES: Vignette[] = [
  // North of the field, seen over the brambles at its top edge.
  { kind: 'squabble', x: 8, y: 21.4, window: { x: 3, y: 23, w: 11, h: 2 }, keep: 3 },
  { kind: 'drag', x: 19.4, y: 22.4, to: [18.6, 17.6], window: { x: 14, y: 23, w: 8, h: 2 }, keep: 2.5 },
  // South of the road out, seen from the road and from Hew's clearing.
  { kind: 'spit', x: 16.5, y: 11.2, window: { x: 11, y: 8, w: 11, h: 2 }, keep: 3 },
  // South of the stream (and east of the path): the deer comes running from the east.
  { kind: 'deer', x: 47.6, y: 32.4, to: [55, 31.4], window: { x: 41, y: 29, w: 13, h: 2 }, keep: 3 },
  { kind: 'lastman', x: 58.4, y: 32.6, window: { x: 53, y: 29, w: 11, h: 2 }, keep: 3 },
];

/** Paint for the floor under them: the blood, the drag marks behind the body, the fire's stones. */
export const VIGNETTE_MARKS: Mark[] = [
  { kind: 'blood', x: 6.9, y: 21.2, w: 2.4, h: 0.9 },
  { kind: 'drag', x: 18.7, y: 17.8, w: 0.6, h: 5 },
  { kind: 'blood', x: 46.9, y: 32.3, w: 1.6, h: 0.7 },
  { kind: 'blood', x: 57.4, y: 32.6, w: 1.8, h: 0.8 },
];
export const VIGNETTE_ROUNDS: Round[] = [{ x: 16.5, y: 11.5, r: 0.5, kind: 'cookfire' }];

/** The way through, worn into the ground: from where you wake, gate to gate, to the road west. */
const WAY: [number, number][][] = [
  [[8, 34], [15, 33.6], [23, 33]], [[23, 33], [29, 31], [32, 27.5], [32, 24]], [[32, 24], [33, 20], [38, 19], [44.5, 19]],
  [[44.5, 19], [49, 18], [52, 15], [52, 11]], [[52, 11], [49, 7.5], [44, 5], [30, 4.6], [12, 4.4], [1, 4.6]],
];
export const WOOD_PATH: Soil[] = WAY.flatMap((run) => run.slice(1).map(([x, y], i) => ({ mat: 'earth' as const, x: run[i][0], y: run[i][1], w: x - run[i][0], h: y - run[i][1], line: 0.75 })));
