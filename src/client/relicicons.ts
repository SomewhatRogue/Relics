/**
 * A picture for each kind of found relic, 12 by 12 like the pack's (itemicons.ts): what it is at a
 * glance. An elemental one gets a fleck of its colour; each use dims it a stage toward grey (relicStage),
 * and a dark one is drawn in dead grey.
 */
import { relicStage, type RelicItem } from '../shared/relicitems';
import type { RelicId } from '../shared/tuning';
import { draw, relicIcon, type Paint } from './itemicons';

const B = '#e8dcc0', BD = '#a89878', IR = '#8a90a0', ID = '#5a6070', W = '#8a5a30', G = '#ffd27a', GD = '#d9a13a';

const KINDS: Partial<Record<RelicId, Paint>> = {
  javelin: (px, line) => { line(1, 11, 9, 3, W); line(9, 3, 11, 1, IR); px(10, 1, '#fff'), px(8, 2, IR), px(10, 4, IR); },
  hook: (px, line) => { line(6, 0, 6, 6, ID); line(6, 6, 6, 9, IR); line(6, 9, 3, 11, IR); line(3, 11, 1, 9, IR); line(1, 9, 1, 7, IR); px(2, 6, IR); px(6, 0, G); },
  lodestone: (px, line) => { for (let y = 3; y < 10; y++) line(3 + (y % 2), y, 8 + (y > 5 ? 1 : 0), y, y < 6 ? '#5a4a7a' : '#3a2e50'); px(5, 4, '#d8c0ff'); px(2, 2, G), px(10, 2, G), px(1, 10, G); },
  bomb: (px, line) => { for (let y = 4; y < 11; y++) { const h = y === 4 || y === 10 ? 2 : 3; line(5 - h, y, 6 + h, y, y < 7 ? '#6a7a3a' : '#4a5a2a'); } px(4, 5, '#a8c070'); line(6, 3, 8, 1, BD); px(9, 0, G), px(10, 1, '#ff9a3c'); },
  sentry: (px, line) => { line(1, 4, 11, 4, W); line(1, 4, 6, 2, IR); line(11, 4, 6, 2, IR); line(6, 1, 6, 7, ID); line(6, 7, 3, 11, W); line(6, 7, 9, 11, W); line(6, 7, 6, 11, W); px(6, 5, G); },
  bell: (px, line) => { line(2, 5, 9, 5, B); line(2, 6, 9, 6, B); line(0, 4, 0, 7, BD); line(1, 4, 1, 7, B); line(10, 4, 10, 7, BD); px(5, 5, BD); px(7, 5, BD); line(2, 7, 9, 7, BD); },
  knuckle: (px, line) => { for (let x = 1; x < 11; x += 3) { line(x, 3, x + 1, 3, B); line(x, 4, x + 1, 7, BD); } line(1, 8, 10, 8, B); line(2, 9, 9, 10, BD); },
};

const grey = (c: string) => {
  const n = parseInt(c.slice(1, 7), 16), v = Math.round((((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255)) / 3 * 0.45 + 20);
  return `rgb(${v},${v},${v + 4})`;
};
/** A fading stage's colour: toward a cold grey, a little more each stage (relicStage: 0 full to 3 the last use). */
const DIM = [0, 0.22, 0.42, 0.6];
const dim = (c: string, k: number) => {
  if (!k) return c;
  const n = parseInt(c.slice(1, 7), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, v = (r + g + b) / 3;
  const f = (x: number) => Math.round((x + (v - x) * k) * (1 - 0.45 * k));
  return `rgb(${f(r)},${f(g)},${Math.min(255, f(b) + Math.round(k * 8))})`;
};
const EL: Record<string, string> = { fire: '#ff6a2a', frost: '#9fe8ff', storm: '#e8e07a' };

/** The picture for this relic (its kind, its element, how faded: lit, dimming through its stages, dark). */
export function relicItemIcon(r: Pick<RelicItem, 'kind' | 'el' | 'charge'> & { tier?: RelicItem['tier'] }): string {
  const paint = KINDS[r.kind];
  if (!paint) return relicIcon();
  const stage = relicStage(r), dark = stage === 4, k = DIM[Math.min(3, stage)];
  return draw(`relic-${r.kind}-${r.el}-${stage}`, (px, line) => {
    const col = (c: string) => (dark ? grey(c) : dim(c, k));
    paint((x, y, c) => px(x, y, col(c)), (a, b, c, d, cl) => line(a, b, c, d, col(cl)));
    if (r.el && !dark) px(0, 0, dim(EL[r.el], k)), px(1, 0, dim(EL[r.el], k)), px(0, 1, dim(EL[r.el], k));
  });
}

/** The kind's colour on the floor and in the light: gold for plain, its element's for an elemental one. */
export const relicCol = (r: Pick<RelicItem, 'el' | 'charge'>) => (r.charge <= 0 ? '#6a6872' : r.el ? EL[r.el] : G);
export { GD as RELIC_GOLD_DEEP };
