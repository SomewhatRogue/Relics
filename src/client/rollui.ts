/**
 * The Roll of the Brave as a leaderboard (Kyle, 2026-11-13: with the tall heroes the faces took too much room,
 * "maybe small statues on plinths", "a better organized UI"). Two sides (the brave, and the unlucky); a row of
 * buttons, one a record, and the one picked shows: its top three as small stone statues on stepped plinths
 * (first in the middle and highest), their names and counts under them, places four on
 * as a list, and yours if you're not in it. The unlucky stand in mossier stone on cracked plinths.
 */
import { CLASS_NAME } from '../shared/classes';
import { SHAME, STAT_NAME, STAT_ORDER, type Profile, type Stats } from '../shared/progress';
import type { Board } from '../shared/worldsync';
import type { HeroClass } from '../shared/tuning';
import { heroLook } from './sprites';
import { coinsHtml } from '../shared/coins';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
type Side = 'brave' | 'unlucky';

const STONE: Record<Side, string[]> = {
  brave: ['#16141a', '#3a3842', '#57525e', '#7a7684', '#a39fac', '#cfcbd6'],
  unlucky: ['#14130e', '#2e2a22', '#4a4432', '#6a6448', '#8a845e', '#a8a27a'],
};

/** A hero's look turned to stone: the outline the darkest, the rest over five shades by how light it was. */
const statues = new Map<string, HTMLCanvasElement>();
function statue(cls: HeroClass, side: Side): HTMLCanvasElement {
  const key = cls + side;
  let c = statues.get(key);
  if (c) return c;
  const src = heroLook(cls).down.c;
  c = document.createElement('canvas');
  (c.width = src.width), (c.height = src.height);
  const g = c.getContext('2d')!;
  g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height), px = img.data, pal = STONE[side];
  const lum = (i: number) => 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
  let lo = 255, hi = 0;
  for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 40 && lum(i) >= 28) (lo = Math.min(lo, lum(i))), (hi = Math.max(hi, lum(i)));
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] <= 40) continue;
    const k = lum(i) < 28 ? 0 : 1 + Math.min(4, Math.floor(((lum(i) - lo) / Math.max(1, hi - lo)) * 5));
    const v = parseInt(pal[k].slice(1), 16);
    (px[i] = v >> 16), (px[i + 1] = (v >> 8) & 255), (px[i + 2] = v & 255), (px[i + 3] = 255);
  }
  g.putImageData(img, 0, 0);
  statues.set(key, c);
  return c;
}

/** The podium: three plinths (2nd, 1st, 3rd), each with its statue if anyone holds the place. 90 by 52, shown at 3x. */
function podium(rows: { cls: HeroClass }[], side: Side): string {
  const W = 90, H = 52, c = document.createElement('canvas');
  (c.width = W), (c.height = H);
  const g = c.getContext('2d')!, pal = STONE[side], shame = side === 'unlucky';
  const rect = (x: number, y: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(x, y, w, h));
  for (const [place, cx, ph] of [[2, 15, 9], [1, 45, 13], [3, 75, 6]] as const) {
    const top = H - ph, x0 = cx - 12;
    // A plinth: a base course, the block, a cap (first the highest); the unlucky's cracked.
    rect(x0 - 1, H - 2, 26, 2, pal[1]), rect(x0, top + 1, 24, ph - 2, pal[2]), rect(x0, top + 1, 1, ph - 2, pal[3]), rect(x0 + 23, top + 1, 1, ph - 2, pal[1]);
    rect(x0 - 1, top - 1, 26, 2, pal[3]), rect(x0 - 1, top - 1, 26, 1, pal[4]);
    if (shame) rect(x0 + 5, top + 1, 1, 2, pal[0]), rect(x0 + 6, top + 3, 1, 2, pal[0]), rect(x0 + 18, top + 2, 1, 3, pal[0]);
    const r = rows[place - 1];
    if (r) {
      const s = statue(r.cls, side);
      g.drawImage(s, Math.round(cx - s.width / 2), top - 1 - s.height + 1);
    }
  }
  return `<img class="rpod" alt="" src="${c.toDataURL()}">`;
}

/** Which record is showing on each side. */
const picked: Record<Side, keyof Stats | null> = { brave: null, unlucky: null };

/** The board's html for one side: the records' buttons and the one picked. */
/** The purse stats (counted in copper) shown as coins. */
const num = (k: keyof Stats, n: number) => (k === 'gold' || k === 'given' ? coinsHtml(n) : String(n));

export function rollHtml(board: Board, me: Profile, side: Side): string {
  const keys = STAT_ORDER.filter((k) => (side === 'unlucky') === SHAME.includes(k));
  const k = picked[side] && keys.includes(picked[side]!) ? picked[side]! : keys[0];
  const chips = `<div class="rchips">${keys.map((s) => `<button data-stat="${s}" class="${s === k ? 'on' : ''}">${STAT_NAME[s]}</button>`).join('')}</div>`;
  const rows = board[k] ?? [], mine = rows.findIndex((r) => r.id === me.id);
  const names = [1, 0, 2].map((i) => {
    const r = rows[i];
    return `<div class="${r && r.id === me.id ? 'me' : ''}">${r ? `<b>${esc(r.name)}</b><em>${num(k, r.n)}</em>` : '<i>-</i>'}</div>`;
  }).join('');
  const rest = rows.slice(3).map((r, i) => `<li${r.id === me.id ? ' class="me"' : ''}><span>${i + 4}</span><b>${esc(r.name)}</b><small>${CLASS_NAME[r.cls]}</small><em>${num(k, r.n)}</em></li>`).join('');
  const you = mine < 0 && me.stats[k] > 0 ? `<p class="you">You: <em>${num(k, me.stats[k])}</em></p>` : '';
  const body = rows.length ? `${podium(rows, side)}<div class="rnames">${names}</div>${rest ? `<ol>${rest}</ol>` : ''}` : `${podium([], side)}<p class="dim">Nobody yet.</p>`;
  return `${chips}<div class="rcards"><div class="rcard${side === 'unlucky' ? ' shame' : ''}"><h4>${STAT_NAME[k]}</h4>${body}${you}</div></div>`;
}

/** Wire the record buttons (after the panel shows): picking one redraws through `again`. */
export function wireRoll(side: Side, again: () => void): void {
  for (const b of document.querySelectorAll<HTMLButtonElement>('#panel .rchips button')) b.onclick = () => ((picked[side] = b.dataset.stat as keyof Stats), again());
}
