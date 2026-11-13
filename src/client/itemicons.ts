/**
 * Small pixel pictures for the pack's cells: what kind of thing a piece is at a glance (a blade, a bow,
 * a staff, mail, a ring, a flask), drawn in code on a 12 by 12 grid and kept as images. The cell's
 * border carries its tier's colour; the picture is the same for every tier.
 */
import { ELEMENT_TRAITS, POTIONS, slotOf, type Item, type PotionId } from '../shared/tuning';

const S = 12;
const M = '#d8dce6', MD = '#7a8090', W = '#8a5a30', WD = '#5a3a1e', G = '#d9b13a', C = '#9a6a3a';
export type Paint = (px: (x: number, y: number, c: string) => void, line: (a: number, b: number, c: number, d: number, col: string) => void) => void;

const blade = (len: number, wide: boolean, guard: string): Paint => (px, line) => {
  line(11, 0, 11 - len, len, M);
  if (wide) line(11, 1, 12 - len, len, MD);
  else line(11, 1, 11 - len + 1, len, MD);
  line(11 - len - 2, len - 1, 11 - len + 1, len + 2, guard);
  line(11 - len - 1, len + 1, 11 - len - 3, len + 3, W);
  px(11 - len - 3, len + 3, G);
};
const ICONS: Record<string, Paint> = {
  sword: blade(7, false, G),
  rapier: (px, line) => { line(11, 0, 4, 7, M); px(3, 7, G), px(4, 8, G), px(2, 7, G), px(4, 9, G), px(3, 8, G); line(2, 9, 0, 11, W); },
  greatsword: blade(8, true, MD),
  spear: (px, line) => { line(0, 11, 8, 3, W); line(9, 2, 11, 0, M); px(8, 2, M), px(9, 3, M), px(10, 0, MD), px(11, 1, MD); },
  daggers: (px, line) => { line(9, 1, 4, 6, M); line(3, 7, 1, 9, W); line(2, 1, 7, 6, M); line(8, 7, 10, 9, W); px(3, 5, G), px(8, 5, G); },
  longbow: (px, line) => { line(2, 0, 6, 2, W); line(6, 2, 8, 6, W); line(8, 6, 6, 10, W); line(6, 10, 2, 11, W); line(2, 0, 2, 11, M); },
  shortbow: (px, line) => { line(3, 1, 7, 3, W); line(7, 3, 8, 6, W); line(8, 6, 7, 9, W); line(7, 9, 3, 11, W); line(3, 1, 3, 11, M); },
  crossbow: (px, line) => { line(6, 2, 6, 11, WD); line(1, 5, 11, 5, W); line(1, 5, 6, 3, M); line(11, 5, 6, 3, M); px(6, 1, M); },
  // A short sword and a blowgun crossed, a green drop at the tube's mouth.
  poisoner: (px, line) => { line(9, 2, 4, 7, M); line(3, 8, 1, 10, W); px(4, 6, G), px(3, 7, G); line(1, 2, 10, 11, WD); px(0, 1, '#9be040'), px(1, 1, '#6ab82a'); },
  wand: (px, line) => { line(2, 10, 8, 4, W); px(9, 3, '#9fe8ff'), px(10, 2, '#fff'), px(11, 1, '#9fe8ff'), px(10, 4, '#9fe8ff'), px(8, 2, '#9fe8ff'); },
  staff: (px, line) => { line(1, 11, 8, 4, W); for (const [x, y] of [[9, 1], [10, 1], [9, 2], [10, 2], [8, 2], [11, 2], [9, 3], [10, 3]]) px(x, y, '#b57aff'); px(9, 1, '#fff'); },
  spellblade: (px, line) => { line(3, 8, 10, 1, W); line(4, 8, 11, 1, '#b57aff'); line(2, 6, 5, 9, M); line(1, 10, 3, 8, WD); px(11, 0, '#fff'); },
  mace: (px, line) => { line(1, 11, 7, 5, W); for (let y = 1; y < 6; y++) line(6, y, 10, y, y % 2 ? M : MD); px(8, 0, M), px(11, 3, M), px(5, 3, M); },
  flail: (px, line) => { line(0, 11, 4, 7, W); line(4, 7, 7, 5, MD); for (let y = 2; y < 6; y++) line(7, y, 10, y, M); px(11, 3, M), px(8, 1, M); },
  censer: (px, line) => { line(2, 0, 6, 4, MD); for (let y = 5; y < 10; y++) line(4, y, 9, y, y === 5 ? G : C); px(6, 7, '#ff9a3c'), px(7, 7, '#ffd27a'), px(5, 10, C), px(8, 10, C); },
  light: (px, line) => tunic(px, line, '#8a5a30', '#5a3a1e'),
  medium: (px, line) => tunic(px, line, '#8a90a0', '#5a6070'),
  heavy: (px, line) => tunic(px, line, '#c8ccd8', '#7a8090'),
  ring: (px, line) => { line(4, 3, 7, 3, G), line(4, 10, 7, 10, G), line(2, 5, 2, 8, G), line(9, 5, 9, 8, G); px(3, 4, G), px(8, 4, G), px(3, 9, G), px(8, 9, G); px(5, 1, '#e07a6a'), px(6, 1, '#e07a6a'), px(5, 2, '#ff9a8a'), px(6, 2, '#c84a3a'); },
  relic: (px, line) => { for (let y = 1; y < 11; y++) { const h = Math.min(y, 11 - y) >> 1; line(6 - h, y, 6 + h, y, y < 6 ? '#ffd27a' : '#d9a13a'); } px(6, 3, '#fff6e0'); },
  skill: (px, line) => { line(6, 0, 6, 11, '#9fd0ff'); line(1, 6, 11, 6, '#9fd0ff'); line(3, 3, 9, 9, '#5a8ac8'); line(9, 3, 3, 9, '#5a8ac8'); px(6, 6, '#fff'); },
};
function tunic(px: (x: number, y: number, c: string) => void, line: (a: number, b: number, c: number, d: number, col: string) => void, a: string, b: string): void {
  line(1, 2, 3, 1, a), line(8, 1, 10, 2, a), line(0, 3, 0, 6, a), line(11, 3, 11, 6, a);
  for (let y = 1; y < 11; y++) line(2, y, 9, y, y % 3 ? a : b);
  for (let y = 1; y < 4; y++) px(5, y, '#14121a'), px(6, y, '#14121a');
  line(2, 7, 9, 7, b);
}

const made = new Map<string, string>();
export function draw(key: string, paint: Paint): string {
  if (made.has(key)) return made.get(key)!;
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  if (!g) return '';
  const px = (x: number, y: number, col: string) => ((g.fillStyle = col), g.fillRect(x, y, 1, 1));
  const line = (x0: number, y0: number, x1: number, y1: number, col: string) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) px(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), col);
  };
  paint(px, line);
  const url = c.toDataURL();
  made.set(key, url);
  return url;
}

/** The picture for a piece of gear (a weapon's element tints its blade a little, nothing more). */
export function itemIcon(it: Item): string {
  const s = slotOf(it), key = s === 'weapon' ? it.kit ?? 'sword' : s === 'armor' ? it.armor ?? 'light' : 'ring';
  const el = it.traits.find((t) => ELEMENT_TRAITS.includes(t));
  return draw(key + (el ?? ''), (px, line) => {
    ICONS[key](px, line);
    if (el) px(11, 0, el === 'ember' ? '#ff6a2a' : el === 'rime' ? '#9fe8ff' : '#e8e07a');
  });
}
export const relicIcon = () => draw('relic', ICONS.relic);
/** What an empty slot shows, faint, in place of its name: a tunic for the body, a ring, a relic. */
export const ghostIcon = (key: 'light' | 'ring' | 'relic') => draw(key, ICONS[key]);
export const skillIcon = () => draw('skill', ICONS.skill);
export function potionIcon(id: PotionId): string {
  const col = POTIONS[id]?.col ?? '#c84a3a';
  return draw('potion' + id, (px, line) => {
    line(5, 0, 6, 0, WD), line(5, 1, 6, 1, '#d8ccb0');
    for (let y = 2; y < 4; y++) line(5, y, 6, y, '#5a5466');
    for (let y = 4; y < 11; y++) line(y < 5 || y > 9 ? 3 : 2, y, y < 5 || y > 9 ? 8 : 9, y, y < 6 ? '#5a5466' : col);
    px(4, 6, '#ffffffaa');
  });
}
