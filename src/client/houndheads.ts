/**
 * Each breed's head as a small drawing, facing right (Kyle, 2026-11-13: the hounds didn't read as dogs;
 * a box with a muzzle on it was the worst of it). houndgrid.ts lays one on at the skull's top left and
 * puts its ears on by the pose. Letters: B coat, Z the line a blaze runs (white with one, else coat),
 * M muzzle (a hill hound's tan), P points, R rough hair, L light, N nose and lips, E eye.
 * `open`: the rows from the mouth down when its jaws are open. Ears are [x, y] pixels, dark,
 * as the breed wears them at rest, laid back running, and pricked up.
 */
import type { BreedId } from '../shared/houndlook';

export interface HeadArt {
  rows: string[]; open: string[]; mouth: number; eye: [number, number];
  ears: { rest: [number, number][]; back: [number, number][]; up: [number, number][] };
}

export const HEADS: Record<BreedId, HeadArt> = {
  // A long head, wiry brows, a beard under the muzzle, small rose ears folded back.
  wolfhound: {
    rows: ['.BBBB....', 'BBBBBRZ..', 'BBBBERZZZ', 'BBBBBMMMN', '.BBBRRRR.', '..BB.RR..'],
    open: ['BBBBBMMMN', '.BBBRNN..', '..BBRRRR.', '....RR...'], mouth: 3, eye: [4, 2],
    ears: { rest: [[0, 1], [1, 1], [-1, 2]], back: [[-1, 1], [0, 1], [-2, 2]], up: [[1, -1], [2, -1], [1, 0], [2, 0]] },
  },
  // Long, narrow and fine, a flat skull running straight into the muzzle, little rose ears.
  lurcher: {
    rows: ['.BBB......', 'BBBBBZ....', 'BBBEBZZZZ.', 'BBBBBMMMMN', '.BBBBLLL..'],
    open: ['BBBBBMMMMN', '.BBBBNNN..', '..BBBLLLL.'], mouth: 3, eye: [3, 2],
    ears: { rest: [[0, 0], [1, 0], [-1, 1]], back: [[-1, 1], [0, 0], [-2, 1]], up: [[1, -1], [2, -1], [1, 0]] },
  },
  // A domed skull, tan brows and muzzle, deep flews; long ears hang to the jaw.
  hillhound: {
    rows: ['.BBBB...', 'BBBBPZ..', 'BBBBEZZB', 'BBBBBMMN', '.BBBMMMM', '..BBMMM.'],
    open: ['BBBBMMMN', '.BBBMNN.', '..BBMMMM', '....MM..'], mouth: 3, eye: [4, 2],
    ears: { rest: [[1, 1], [2, 1], [1, 2], [2, 2], [1, 3], [2, 3], [1, 4], [2, 4], [2, 5]], back: [[0, 1], [-1, 1], [-1, 2], [-2, 2], [-2, 3]], up: [[1, 0], [2, 0], [1, 1], [2, 1], [1, 2], [2, 2], [2, 3]] },
  },
  // A rounded skull, a tapering muzzle, a white ruff under the jaw, ears up with the tips tipped over.
  collie: {
    rows: ['.BBBB...', 'BBBBBZ..', 'BBBBEZMM', 'BBBBBMMN', '.PBBBMM.', '..PP....'],
    open: ['BBBBBMMN', '.PBBBNN.', '..PPBMM.'], mouth: 3, eye: [4, 2],
    ears: { rest: [[1, -1], [2, -1], [1, -2], [2, -2], [3, -3]], back: [[0, 0], [-1, 0], [-2, 1], [0, -1]], up: [[1, -1], [2, -1], [1, -2], [2, -2], [2, -3]] },
  },
};

/** A breed's head drawing, open-jawed or not. */
export function headRows(b: BreedId, open: boolean): string[] {
  const h = HEADS[b];
  return open ? [...h.rows.slice(0, h.mouth), ...h.open] : h.rows;
}
