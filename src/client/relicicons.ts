/**
 * A picture for each kind of found relic, 12 by 12 like the pack's (itemicons.ts): what it is at a
 * glance. An elemental one gets a fleck of its colour; a dark one is drawn in dead grey.
 */
import type { RelicItem } from '../shared/relicitems';
import type { RelicId } from '../shared/tuning';
import { draw, relicIcon, type Paint } from './itemicons';

const B = '#e8dcc0', BD = '#a89878', IR = '#8a90a0', ID = '#5a6070', W = '#8a5a30', G = '#ffd27a', GD = '#d9a13a';

const KINDS: Partial<Record<RelicId, Paint>> = {
  javelin: (px, line) => { line(1, 11, 9, 3, W); line(9, 3, 11, 1, IR); px(10, 1, '#fff'), px(8, 2, IR), px(10, 4, IR); },
  hook: (px, line) => { line(6, 0, 6, 6, ID); line(6, 6, 6, 9, IR); line(6, 9, 3, 11, IR); line(3, 11, 1, 9, IR); line(1, 9, 1, 7, IR); px(2, 6, IR); px(6, 0, G); },
  lodestone: (px, line) => { for (let y = 3; y < 10; y++) line(3 + (y % 2), y, 8 + (y > 5 ? 1 : 0), y, y < 6 ? '#5a4a7a' : '#3a2e50'); px(5, 4, '#d8c0ff'); px(2, 2, G), px(10, 2, G), px(1, 10, G); },
  bomb: (px, line) => { for (let y = 4; y < 11; y++) { const h = y === 4 || y === 10 ? 2 : 3; line(5 - h, y, 6 + h, y, y < 7 ? '#6a7a3a' : '#4a5a2a'); } px(4, 5, '#a8c070'); line(6, 3, 8, 1, BD); px(9, 0, G), px(10, 1, '#ff9a3c'); },
  sentry: (px, line) => { line(1, 4, 11, 4, W); line(1, 4, 6, 2, IR); line(11, 4, 6, 2, IR); line(6, 1, 6, 7, ID); line(6, 7, 3, 11, W); line(6, 7, 9, 11, W); line(6, 7, 6, 11, W); px(6, 5, G); },
  bell: (px, line) => { line(5, 1, 6, 1, BD); for (let y = 2; y < 9; y++) { const h = 1 + Math.floor((y - 1) / 2); line(6 - h, y, 5 + h, y, y % 3 ? B : BD); } line(1, 9, 10, 9, BD); px(5, 10, B), px(6, 10, B); },
  knuckle: (px, line) => { for (let x = 1; x < 11; x += 3) { line(x, 3, x + 1, 3, B); line(x, 4, x + 1, 7, BD); } line(1, 8, 10, 8, B); line(2, 9, 9, 10, BD); },
};

const grey = (c: string) => {
  const n = parseInt(c.slice(1, 7), 16), v = Math.round((((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255)) / 3 * 0.45 + 20);
  return `rgb(${v},${v},${v + 4})`;
};
const EL: Record<string, string> = { fire: '#ff6a2a', frost: '#9fe8ff', storm: '#e8e07a' };

/** The picture for this relic (its kind, its element, lit or dark). */
export function relicItemIcon(r: Pick<RelicItem, 'kind' | 'el' | 'charge'>): string {
  const paint = KINDS[r.kind];
  if (!paint) return relicIcon();
  const dark = r.charge <= 0;
  return draw(`relic-${r.kind}-${r.el}-${dark ? 'd' : 'l'}`, (px, line) => {
    const p = dark ? (x: number, y: number, c: string) => px(x, y, grey(c)) : px;
    const l = dark ? (a: number, b: number, c: number, d: number, col: string) => line(a, b, c, d, grey(col)) : line;
    paint(p, l);
    if (r.el && !dark) px(0, 0, EL[r.el]), px(1, 0, EL[r.el]), px(0, 1, EL[r.el]);
  });
}

/** The kind's colour on the floor and in the light: gold for plain, its element's for an elemental one. */
export const relicCol = (r: Pick<RelicItem, 'el' | 'charge'>) => (r.charge <= 0 ? '#6a6872' : r.el ? EL[r.el] : G);
export { GD as RELIC_GOLD_DEEP };
