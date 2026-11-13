/**
 * A Warrior's shield as a sprite, from its look (shared/shieldlook.ts): a heater, a round shield with a boss,
 * or a long kite; its field, lit from the left; a device in its trim's metal; a rim of the same. Made once a
 * look and kept. actors.ts holds it up; the barracks' panel (shieldui.ts) shows it large.
 */
import type { ShieldLook } from '../shared/shieldlook';
import { makeSprite, type Part, type Sprite } from './sprites';

/** Each field colour: dark, then the lit left of it. */
export const FIELD_COL: [string, string][] = [['#7a1e1a', '#9a2a22'], ['#1e3a6e', '#2c4e8a'], ['#24502a', '#326636'], ['#1e1c22', '#2e2c34'], ['#b0aca4', '#ccc8c0'], ['#8a6a24', '#a8822a']];
/** Each trim: the device's light and dark, the rim's light and dark. */
const TRIM_COL = { gold: ['#ecc860', '#c8962e', '#d4a537', '#8a6a24'], silver: ['#e8eef2', '#a8b0ba', '#cfd6dc', '#8a929c'], iron: ['#5a5662', '#3a3640', '#5a5662', '#34313b'] };

/** Each shape: its size and each row's span, left to right. */
const SHAPE: Record<ShieldLook['shape'], [number, number][]> = {
  heater: [[0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [1, 10], [1, 10], [2, 9], [3, 8], [4, 7], [5, 6]],
  round: Array.from({ length: 13 }, (_, y) => {
    const d = Math.sqrt(Math.max(0, 6.6 * 6.6 - (y - 6) * (y - 6)));
    return [Math.round(6 - d), Math.round(6 + d)] as [number, number];
  }),
  kite: [[3, 7], [1, 9], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [1, 9], [1, 9], [2, 8], [2, 8], [3, 7], [3, 7], [4, 6], [5, 5]],
};

/** A lantern, Wickhold's own: its frame in the trim, its flame warm. */
const LANTERN = ['..D..', '.dDd.', 'dfffd', 'dfFfd', 'dfffd', '.ddd.'];

/** Whether (x, y) is on the device, and on its lit side. */
function device(l: ShieldLook, x: number, y: number, w: number, h: number): 'lit' | 'dark' | 'flame' | 'bright' | null {
  const cx = (w - 1) / 2, top = l.shape === 'round' ? 0.5 : 0.42, my = h * top;
  const side = x <= cx ? 'lit' : 'dark';
  switch (l.device) {
    case 'chevron': return y <= h * 0.74 && Math.abs(y - (h * 0.32 + Math.abs(x - cx) * 0.95)) < 1.05 ? side : null;
    case 'cross': return Math.abs(x - cx) < 1.1 || Math.abs(y - my) < 1.1 ? side : null;
    case 'bend': return Math.abs(x / (w - 1) - y / (h - 1)) < 0.12 ? side : null;
    case 'quarters': return (x <= cx) !== (y < my) ? side : null;
    case 'lantern': {
      const lx = Math.round(x - cx + 2), ly = Math.round(y - my + 3), ch = LANTERN[ly]?.[lx];
      return ch === 'F' ? 'bright' : ch === 'f' ? 'flame' : ch === 'd' || ch === 'D' ? (ch === 'D' ? 'lit' : side) : null;
    }
    default: return null;
  }
}

const made = new Map<string, Sprite>();

export function shieldSprite(l: ShieldLook): Sprite {
  const key = `${l.shape}:${l.field}:${l.device}:${l.trim}`;
  let s = made.get(key);
  if (s) return s;
  const span = SHAPE[l.shape], h = span.length, w = Math.max(...span.map((r) => r[1])) + 1, [fd, fl] = FIELD_COL[l.field] ?? FIELD_COL[0], [dl, dd, rl, rd] = TRIM_COL[l.trim];
  const parts: Part[] = [];
  span.forEach(([a, b], y) => {
    for (let x = a; x <= b; x++) {
      const rim = y === 0 || x === a || x === b || y === h - 1 || (l.shape === 'round' && (y === 1 || y === h - 2) && (x <= a + 1 || x >= b - 1));
      const dv = rim ? null : device(l, x, y, w, h);
      const col = rim ? (x <= (w - 1) / 2 || y === 0 ? rl : rd) : dv === 'bright' ? '#fff1b0' : dv === 'flame' ? '#ffb44c' : dv ? (dv === 'lit' ? dl : dd) : x <= w * 0.3 ? fl : fd;
      parts.push(['p', x, y, col]);
    }
  });
  // A round shield's boss, over whatever's in the middle unless it bears the lantern.
  if (l.shape === 'round' && l.device !== 'lantern') parts.push(['r', 5, 5, 3, 3, rd], ['r', 5, 5, 2, 2, rl], ['p', 5, 5, '#ffffff']);
  s = makeSprite(w, h, parts);
  made.set(key, s);
  return s;
}
