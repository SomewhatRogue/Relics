/**
 * The town hall's two vote boards, one per choice of the council's open decision: its short name, the
 * count and names of whoever voted for it (from the world's own ballots), and across the top of the
 * wall when the vote closes (the end of the week, councilweek.ts). Worked out once here as rows of text and drawn by both views: flat here, placed on the
 * wall's face in the 2.5D overlay (three/overlay3d.ts). Where: the map's `vote` hangs.
 */
import type { GameMap } from '../shared/arena';
import { CHAPTER_1, councilOpen, type WorldState } from '../shared/story';
import { WEEKDAYS, localDay } from '../shared/councilweek';
import { ballot } from '../shared/worldsync';
import { BOARDW } from './councilwords';
import { drawText, textWidth } from './pixfont';
import { OX, OY, PX } from './world';

let world: WorldState | null = null;
/** The world, each frame (main.ts). */
export function setVotes(w: WorldState): void {
  world = w;
}

/** Which night the vote closes at the end of: nights from today, and its weekday (the Pacific calendar the close is counted in). */
export function closeNight(closes: number, now = Date.now()): [number, string] {
  const night = localDay(closes - 1);
  return [night.n - localDay(now).n, WEEKDAYS[night.dow]];
}

/** Rows on the wall: row 0 is its top, screen row 8 in the flat view (as the 3D wall's face). */
export const WALL_TOP = 8, ROWS = OY - WALL_TOP;
const NAMES_SHOWN = 3;

/** One line of words: centred on tile `x`, its top at wall row `row`. */
export interface BoardRow { s: string; x: number; row: number; col: string }

/** What the wall says now; empty where there are no boards. */
export function boardRows(m: GameMap): BoardRow[] {
  const hangs = (m.hangs ?? []).filter((h) => h.kind === 'vote');
  if (!hangs.length || !world) return [];
  const d = CHAPTER_1.decision, done = world.flags[d.id], b = ballot(world);
  const won = d.choices.find((c) => c.id === done);
  const head = won ? BOARDW.chose(won.short) : !councilOpen(world) || !world.councilCloses ? BOARDW.notYet : BOARDW.closes(...closeNight(world.councilCloses));
  const out: BoardRow[] = [{ s: head, x: m.w / 2, row: 1, col: '#ffd27a' }];
  hangs.forEach((h, i) => {
    const c = d.choices[i];
    if (!c) return;
    const x = h.x + h.w / 2, names = b.names[c.id] ?? [], shown = names.length > NAMES_SHOWN ? names.slice(0, NAMES_SHOWN - 1) : names;
    out.push({ s: c.short, x, row: 9, col: c.id === done ? '#fff1b0' : '#ffd27a' });
    out.push(names.length ? { s: BOARDW.votes(names.length), x, row: 17, col: '#ffd27a' } : { s: BOARDW.nobody, x, row: 17, col: '#a89a7c' });
    shown.forEach((n, k) => out.push({ s: n, x, row: 23 + k * 6, col: '#f0e8d8' }));
    if (names.length > shown.length) out.push({ s: BOARDW.more(names.length - shown.length), x, row: 23 + shown.length * 6, col: '#c8bca0' });
  });
  return out;
}

/** The flat view: the words on the glow layer, over the boards painted into the wall (hangs.ts). */
export function drawBoards(g: CanvasRenderingContext2D, m: GameMap, cx: number, cy: number): void {
  for (const r of boardRows(m)) drawText(g, r.s, Math.round(OX + r.x * PX - cx - textWidth(r.s) / 2), Math.round(WALL_TOP + r.row - cy), r.col);
}
