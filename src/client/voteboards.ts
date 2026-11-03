/**
 * The town hall's two vote boards, one per choice of the council's open decision: its short name, the
 * names of whoever voted for it (from the world's own ballots), and across the top of the wall when the
 * vote closes. Drawn into one canvas the width of the wall, redrawn only when what it says changes, and
 * used by both views (flat here, 2.5D in three/voteboards3d.ts). Where: the map's `vote` hangs.
 */
import type { GameMap } from '../shared/arena';
import { CHAPTER_1, QUORUM, councilOpen, type WorldState } from '../shared/story';
import { ballot } from '../shared/worldsync';
import { BOARDW } from './councilwords';
import { drawText, textWidth } from './pixfont';
import { OX, OY, PX } from './world';

let world: WorldState | null = null, online = false;
/** The world and whether it's shared, each frame (main.ts). */
export function setVotes(w: WorldState, isOnline: boolean): void {
  world = w;
  online = isOnline;
}

/** Rows of the canvas: row 0 is the wall's top, screen row 8 in the flat view (as the 3D wall face). */
export const WALL_TOP = 8, ROWS = OY - WALL_TOP;
const NAMES_SHOWN = 4;

let cache: { key: string; canvas: HTMLCanvasElement } | null = null;

/** The words for the wall now, as a canvas and a key that changes when they do; null: no boards here. */
export function boardCanvas(m: GameMap): { key: string; canvas: HTMLCanvasElement } | null {
  const hangs = (m.hangs ?? []).filter((h) => h.kind === 'vote');
  if (!hangs.length || !world) return null;
  const d = CHAPTER_1.decision, done = world.flags[d.id], b = ballot(world), need = online ? QUORUM : 1;
  const won = d.choices.find((c) => c.id === done);
  const head = won ? BOARDW.chose(won.short) : !councilOpen(world) && !b.voters ? BOARDW.notYet : need > 1 ? BOARDW.closes(need, Math.max(0, need - b.voters)) : BOARDW.alone;
  const boards = hangs.map((h, i) => ({ h, c: d.choices[i], names: d.choices[i] ? b.names[d.choices[i].id] ?? [] : [] }));
  const key = JSON.stringify([m.w, head, boards.map((x) => [x.h.x, x.names])]);
  if (cache?.key === key) return cache;
  const canvas = document.createElement('canvas'), g = canvas.getContext('2d')!;
  canvas.width = OX * 2 + Math.round(m.w * PX);
  canvas.height = ROWS;
  const mid = OX + (m.w * PX) / 2;
  drawText(g, head, Math.round(mid - textWidth(head) / 2), 1, '#ffd27a');
  for (const { h, c, names } of boards) {
    if (!c) continue;
    const x0 = OX + h.x * PX, cx = x0 + (h.w * PX) / 2, row = (s: string, y: number, col: string) => drawText(g, s, Math.round(cx - textWidth(s) / 2), y, col);
    row(c.short, 9, c.id === done ? '#fff1b0' : '#ffd27a');
    g.fillStyle = '#c8a860';
    g.fillRect(Math.round(x0 + 4), 15, Math.round(h.w * PX - 8), 1);
    const shown = names.length > NAMES_SHOWN ? names.slice(0, NAMES_SHOWN - 1) : names;
    if (!names.length) row(BOARDW.nobody, 17, '#a89a7c');
    shown.forEach((n, k) => row(n, 17 + k * 6, '#f0e8d8'));
    if (names.length > shown.length) row(BOARDW.more(names.length - shown.length), 17 + shown.length * 6, '#c8bca0');
  }
  return (cache = { key, canvas });
}

/** The flat view: the words on the glow layer, over the boards painted into the wall (hangs.ts). */
export function drawBoards(g: CanvasRenderingContext2D, m: GameMap, cx: number, cy: number): void {
  const b = boardCanvas(m);
  if (b) g.drawImage(b.canvas, Math.round(-cx), Math.round(WALL_TOP - cy));
}
