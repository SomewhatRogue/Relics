/**
 * The Roll of the Brave as a leaderboard: two sides (the brave, and the unlucky), each a stack of
 * cards; every card has a podium of the top three with their faces, the rest below, and your own
 * standing if you're not in it.
 */
import { CLASS_NAME } from '../shared/classes';
import { SHAME, STAT_NAME, STAT_ORDER, type Profile, type Stats } from '../shared/progress';
import type { Board } from '../shared/worldsync';
import type { HeroClass } from '../shared/tuning';
import { heroLook } from './sprites';

const faces = new Map<string, string>();
const face = (cls: HeroClass) => {
  if (!faces.has(cls)) faces.set(cls, heroLook(cls).down.c.toDataURL());
  return `<img class="rface" alt="" src="${faces.get(cls)}">`;
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** One card: the top three on a podium, places four on, and yours. */
function card(k: keyof Stats, board: Board, me: Profile): string {
  const rows = board[k] ?? [], mine = rows.findIndex((r) => r.id === me.id);
  const podium = [1, 0, 2].map((i) => {
    const r = rows[i];
    return `<div class="step s${i + 1}${r && r.id === me.id ? ' me' : ''}">${r ? `${face(r.cls)}<b>${esc(r.name)}</b><em>${r.n}</em>` : '<i>-</i>'}<span>${i + 1}</span></div>`;
  }).join('');
  const rest = rows.slice(3).map((r, i) => `<li${r.id === me.id ? ' class="me"' : ''}><span>${i + 4}</span><b>${esc(r.name)}</b><small>${CLASS_NAME[r.cls]}</small><em>${r.n}</em></li>`).join('');
  const you = mine < 0 && me.stats[k] > 0 ? `<p class="you">You: <em>${me.stats[k]}</em></p>` : '';
  return `<div class="rcard${SHAME.includes(k) ? ' shame' : ''}"><h4>${STAT_NAME[k]}</h4>${rows.length ? `<div class="podium">${podium}</div>${rest ? `<ol>${rest}</ol>` : ''}` : '<p class="dim">Nobody yet.</p>'}${you}</div>`;
}

/** The board's html for one side. */
export function rollHtml(board: Board, me: Profile, side: 'brave' | 'unlucky'): string {
  const keys = STAT_ORDER.filter((k) => (side === 'unlucky') === SHAME.includes(k));
  return `<div class="rcards">${keys.map((k) => card(k, board, me)).join('')}</div>`;
}
