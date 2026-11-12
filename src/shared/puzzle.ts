/**
 * Instance puzzles (docs/design/instance-puzzles.md): pushing tubs. A grid on the floor (`x`, `y` its top-left
 * corner, `cell` tiles a square), its walls, its plates, and where the tubs start; the lever that puts them back,
 * and where the waves come from when two or more are in (sim/tubs.ts). The tubs themselves are props ('tub'),
 * so a friend's screen has where they stand; the rest is the map's, the same on every screen.
 * Pure: shared by the room (sim/tubs.ts, stretches.ts) and the screen (client/tubdraw.ts).
 */
export type Cell = [number, number];

export interface TubPuzzle {
  x: number; y: number; cols: number; rows: number; cell: number;
  walls: Cell[]; plates: Cell[]; tubs: Cell[];
  lever: { x: number; y: number };
  from: { x: number; y: number };
}

/** A layout as rows of text: `#` a wall, `.` a plate, `$` a tub, `*` a tub on a plate. */
export function fromRows(rows: string[]): Pick<TubPuzzle, 'cols' | 'rows' | 'walls' | 'plates' | 'tubs'> {
  const walls: Cell[] = [], plates: Cell[] = [], tubs: Cell[] = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '#') walls.push([c, r]);
    if (ch === '.' || ch === '*') plates.push([c, r]);
    if (ch === '$' || ch === '*') tubs.push([c, r]);
  }));
  return { cols: rows[0].length, rows: rows.length, walls, plates, tubs };
}

/** A cell's middle on the map. */
export const centre = (p: TubPuzzle, [c, r]: Cell) => ({ x: p.x + (c + 0.5) * p.cell, y: p.y + (r + 0.5) * p.cell });
/** The cell under (x, y), whether or not it's on the grid. */
export const cellAt = (p: TubPuzzle, x: number, y: number): Cell => [Math.floor((x - p.x) / p.cell), Math.floor((y - p.y) / p.cell)];
export const onGrid = (p: TubPuzzle, [c, r]: Cell) => c >= 0 && r >= 0 && c < p.cols && r < p.rows;
export const isWall = (p: TubPuzzle, [c, r]: Cell) => p.walls.some(([a, b]) => a === c && b === r);
/** The grid's area on the map, and round it by `m` tiles. */
export const gridArea = (p: TubPuzzle, m = 0) => ({ x: p.x - m, y: p.y - m, w: p.cols * p.cell + 2 * m, h: p.rows * p.cell + 2 * m });

/** The cells the tubs stand on (the props of kind 'tub' on this grid). */
export function tubCells(p: TubPuzzle, props: { kind: string; x: number; y: number; broken?: boolean }[]): Cell[] {
  return props.filter((q) => q.kind === 'tub' && !q.broken && onGrid(p, cellAt(p, q.x, q.y))).map((q) => cellAt(p, q.x, q.y));
}

/** Every plate has a tub on it. */
export function solved(p: TubPuzzle, props: { kind: string; x: number; y: number; broken?: boolean }[]): boolean {
  const on = tubCells(p, props);
  return p.plates.every(([c, r]) => on.some(([a, b]) => a === c && b === r));
}
