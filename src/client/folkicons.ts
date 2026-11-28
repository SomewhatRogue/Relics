/**
 * Folk icons: a little pixel picture bobbing over each person in town who gives you a pastime (a fish, a
 * target, a die, a fist, a knife) or trains a class (crossed swords, your own class's a touch brighter), so
 * you know what you'll play before you walk up. Pale, never the quest diamond's gold, never a telegraph's red.
 * Over someone who also has the gold diamond (marks of kind 'folk'), the icon sits above it so both read.
 * Drawing only: `folkIcons` picks, the two draw functions put them on the flat view and the 2.5D overlay.
 */
import { npcAt, type Npc } from '../shared/arena';
import { CLASS_ORDER, type HeroClass } from '../shared/weapons';
import type { Light } from './light';

export type IconKind = 'fish' | 'range' | 'dice' | 'arm' | 'knives' | 'trainer';
export interface FolkIcon { kind: IconKind; x: number; y: number; /** a quest diamond is over them already */ raised: boolean; /** their class's trainer */ mine: boolean }

const KIND: Record<string, IconKind> = { fish: 'fish', range: 'range', dice: 'dice', arm: 'arm', knives: 'knives', trainer: 'trainer' };
/** The icon a person's `talk` earns, if any. */
export const iconOf = (n: Npc): IconKind | null => (n.mute ? null : KIND[n.talk] ?? null);

/** Who gets which icon this moment: `t` is the room's time (walking folk), `gone` those a quest has sent home. */
export function folkIcons(npcs: Npc[], t: number, cls: HeroClass | null, marks: { x: number; y: number; kind: string }[], gone: (n: Npc) => boolean = () => false): FolkIcon[] {
  const out: FolkIcon[] = [];
  for (const n of npcs) {
    const kind = iconOf(n);
    if (!kind || gone(n)) continue;
    const at = npcAt(n, t);
    out.push({ kind, x: at.x, y: at.y, raised: marks.some((m) => m.kind === 'folk' && Math.hypot(m.x - at.x, m.y - at.y) < 1.4), mine: kind === 'trainer' && cls !== null && n.arg === CLASS_ORDER.indexOf(cls) });
  }
  return out;
}

const OUT = '#14161f';
const ART: Record<IconKind, { rows: string[]; pal: Record<string, string> }> = {
  fish: { rows: ['.........', '..OOOO.O.', '.OffhfOOO', 'OffkffffO', 'OfffffOOO', '.OOOOO.O.'], pal: { f: '#8cc8dc', h: '#d4f0f8', k: '#1c2a38' } },
  range: { rows: ['..OOOOO..', '.OsssssO.', 'OssOOOssO', 'OsOwwwOsO', 'OsOwdwOsO', 'OsOwwwOsO', 'OssOOOssO', '.OsssssO.', '..OOOOO..'], pal: { s: '#a8bcd0', w: '#f0f4f8', d: '#4a6a90' } },
  dice: { rows: ['.OOOOOOO.', 'OwwwwwwwO', 'OwkwwwkwO', 'OwwwwwwwO', 'OwwwkwwwO', 'OwwwwwwwO', 'OwkwwwkwO', 'OgggggggO', '.OOOOOOO.'], pal: { w: '#f2ecd8', g: '#b4ac96', k: '#2a2630' } },
  arm: { rows: ['..OOOOOO.', '.OfhfhfhO', '.OfOfOfOO', 'OOffffffO', 'OfffffffO', 'OfffffffO', '.OfffffO.', '..OsssO..', '..OOOOO..'], pal: { f: '#e0bc98', h: '#f8e2ca', s: '#8890a0' } },
  knives: { rows: ['......OOO', '.....OwwO', '....OwwO.', '...OwwO..', '..OwwO...', '.OgOO....', 'OhhgO....', 'OhhO.....', 'OOO......'], pal: { w: '#d4dce8', g: '#8892a4', h: '#8a5e38' } },
  trainer: { rows: ['OO.....OO', 'OwO...OwO', '.OwO.OwO.', '..OwOwO..', '...OwO...', '..OwOwO..', '.OhO.OhO.', 'OhhO.OhhO', 'OOO...OOO'], pal: { w: '#d8e2f0', h: '#9aa6bc' } },
};
const SIZE = 9;

/** One icon centred on (x, y) in pixels; `mine` brightens it. */
export function drawIcon(g: CanvasRenderingContext2D, kind: IconKind, x: number, y: number, mine = false, k = 1): void {
  const { rows, pal } = ART[kind], X = Math.round(x) - (SIZE >> 1) * k, Y = Math.round(y) - (rows.length >> 1) * k;
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '.') return;
    g.fillStyle = ch === 'O' ? OUT : mine && ch === 'w' ? '#ffffff' : pal[ch];
    g.fillRect(X + i * k, Y + j * k, k, k);
  }));
}

/** The flat view: icons over `list`, the camera at (cx, cy); `toPx` gives where someone stands before the camera. Returns their faint lights. */
export function drawFolkIcons(g: CanvasRenderingContext2D, list: FolkIcon[], toPx: (x: number, y: number) => [number, number], cx: number, cy: number, vw: number, vh: number, now: number): Light[] {
  const lights: Light[] = [];
  list.forEach((f, i) => {
    const [px, py] = toPx(f.x, f.y), sx = px - cx, sy = py - cy, y = sy - (f.raised ? 56 : 40) + Math.round(Math.sin(now * 3 + i * 1.7) * 1.5);
    if (sx < -6 || sx > vw + 6 || y < -6 || y > vh + 6) return;
    drawIcon(g, f.kind, sx, y, f.mine);
    lights.push({ x: sx, y: y + 4, r: f.mine ? 26 : 20, i: f.mine ? 0.3 : 0.2, c: [0.75, 0.88, 1] });
  });
  return lights;
}
