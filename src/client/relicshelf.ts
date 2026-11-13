/**
 * The pack's row of relics (Kyle, 2026-11-05: "it's not clear ... how to equip it, since it's not in
 * your inventory pack"): the RELIC slot with the one carried, and beside it every other relic you own,
 * each its own square with its picture and its uses as pips, NEW on one you haven't looked at. Tap one
 * for its card and CARRY; drag one onto RELIC to carry it (the old one goes back on the shelf), or the
 * carried one onto the shelf to put it away. With nothing carried and a relic owned, the empty slot
 * pulses and says TAP. Pure HTML from the hero: the pack draws it, the tests read it.
 */
import { relicName, type RelicItem } from '../shared/relicitems';
import type { Hero } from '../sim/types';
import { chargePips, fillCol } from './reliccard';
import { relicItemIcon } from './relicicons';
import { RELICW } from './relicwords';

const esc = (s: string) => s.replace(/"/g, '&quot;');

/** One relic's square: picture, pips, NEW. `src` its pick ('relic' carried, 'found:k' on the shelf). */
function square(r: RelicItem, src: string, sel: string | null, fresh: boolean, dst?: string, label?: string): string {
  return `<div class="tile rtile${src === sel ? ' sel' : ''}${fresh ? ' new' : ''}" style="--t:${fillCol(r)}" title="${esc(relicName(r))}" data-src="${src}"${dst ? ` data-dst="${dst}"` : ''}>` +
    `<img src="${relicItemIcon(r)}" alt="">${fresh ? `<em class="rnew">${RELICW.newMark}</em>` : ''}${chargePips(r)}${label ? `<i>${label}</i>` : ''}</div>`;
}

/** The carried relic's item (none: nothing carried). */
export const carriedRelic = (h: Pick<Hero, 'found' | 'relicItem' | 'relics'>) => (h.relics[1] ? h.found.find((r) => r.id === h.relicItem) : undefined);

/** The row: RELIC slot, then the shelf. `fresh`: ids still NEW. */
export function relicRow(h: Pick<Hero, 'found' | 'relicItem' | 'relics'>, sel: string | null, fresh: readonly string[]): string {
  const it = carriedRelic(h), others = h.found.map((r, k) => [r, k] as const).filter(([r]) => r !== it);
  if (!h.found.length) return '';
  const slot = it
    ? square(it, 'relic', sel, fresh.includes(it.id), 'relic')
    : `<div class="tile empty rslot pulse${sel === 'relic' ? ' sel' : ''}" style="--t:#ffd27a" data-src="relic" data-dst="relic"><b class="rtap">${RELICW.tapSlot}</b></div>`;
  const shelf = others.map(([r, k]) => square(r, 'found:' + k, sel, fresh.includes(r.id))).join('');
  // Pictures only, no heading; the shelf's well only when something is on it (Kyle, 2026-11-13: declutter).
  return `<div class="relicrow" title="${RELICW.shelf}"><div class="rrow">${slot}${shelf ? `<div class="rshelf" data-dst="shelf">${shelf}</div>` : ''}</div></div>`;
}
