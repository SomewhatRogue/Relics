/** The Roll's relics (shared/relicroll.ts): each relic that is won, and the first in this world to win it. */
import { ROLL_RELICS, type FirstRelics } from '../shared/relicroll';
import { RELICS } from '../shared/magic';
import { RELICW } from './relicwords';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export function relicRollHtml(w: { firstRelics?: FirstRelics }): string {
  const rows = ROLL_RELICS.map((k) => {
    const who = w.firstRelics?.[k];
    return `<li><b>${RELICS[k].name}</b> <span class="${who ? '' : 'dim'}">${who ? esc(who) : RELICW.rollNobody}</span></li>`;
  }).join('');
  return `<div class="rsec">${RELICW.rollTitle}</div><ul class="relicroll">${rows}</ul>`;
}
