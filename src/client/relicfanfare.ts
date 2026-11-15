/**
 * The full-screen moment a relic is won (docs/design/relics.md section 2; the "A relic won" artboard):
 * its picture big in a gold frame, its name in gold leaf, where it came from, its uses, what it does, the
 * Roll's first winner, a line from the place, and SEE IT IN THE PACK. Pure HTML from the moment: the pop
 * (relicmoment.ts) shows it, the tests read it.
 */
import { relicName } from '../shared/relicitems';
import type { RelicMoment } from './relicnews';
import { chargePips } from './reliccard';
import { relicItemIcon } from './relicicons';
import { RELICW, RELIC_LINES } from './relicwords';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export function fanfareHtml(m: RelicMoment): string {
  const r = m.item, from = r.from ?? '', said = RELICW.wonSay[from];
  const roll = m.first ? (m.mine ? RELICW.rollMine : RELICW.rollFirst(esc(m.first))) : '';
  return `<div class="rf-in"><i class="rf-k">${RELICW.wonKicker}</i>` +
    `<div class="rf-frame"><img src="${relicItemIcon(r)}" alt=""></div>` +
    `<b class="rf-name">${relicName(r)}</b>` +
    (RELICW.wonFrom[from] ? `<span class="rf-from">${RELICW.wonFrom[from]}</span>` : '') +
    `<div class="rf-uses">${chargePips(r)}</div><i class="rf-recharge">${RELICW.wonUses(r.charge)}</i>` +
    (RELIC_LINES[r.kind] ? `<p class="rf-does">${RELIC_LINES[r.kind]}</p>` : '') +
    (roll ? `<div class="rf-roll"><i>${RELICW.rollLabel}</i><span>${roll}</span></div>` : '') +
    (said ? `<p class="rf-say">${said}</p>` : '') +
    `<button type="button" class="rf-go" data-pack>${RELICW.seePack}</button>` +
    `<i class="rf-tap">${m.carried ? RELICW.carryHint : RELICW.momentShelf}</i></div>`;
}
