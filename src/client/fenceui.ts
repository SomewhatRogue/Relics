/**
 * Nettle's table has two tabs (Kyle, 2026-11-05): FOR SALE, his stock like every class vendor's, and
 * SELL QUIETLY, where he quietly buys touched and turning gear out of your pack, cheap and gone for
 * good (shared/fence.ts). Everything else in the pack shows dim with the reason. The words: vendorwords.ts.
 */
import { itemName } from '../shared/tuning';
import { itemCol } from './uniquelook';
import { bagSize } from '../shared/bags';
import { fence, fenceValue, nettleTakes } from '../shared/fence';
import type { Item } from '../shared/loot';
import type { Game } from './game';
import { card } from './card';
import { grid } from './cells';
import { itemIcon } from './itemicons';
import { itemPop, says } from './shopui';
import { SHOPW } from './shopwords';
import { PAWN } from './storewords';
import { FENCE } from './vendorwords';

export type Tab = 'sale' | 'fence';

/** The two tabs, `on` lit. */
export const fenceTabs = (on: Tab) => '<div class="tabs">' +
  ([['sale', SHOPW.forSale], ['fence', FENCE.tab]] as const).map(([t, name]) => `<button data-tab="${t}"${t === on ? ' class="on"' : ''}>${name}</button>`).join('') + '</div>';

/** SELL QUIETLY: what he'd pay, and your pack with what he won't take dim. */
export function fenceBody(g: Game): string {
  const pr = g.profile, wont = (it: Item) => !nettleTakes(it, pr);
  return `<div class="shop"><p class="dim">${FENCE.about}</p><h3 class="gh">PACK <i>${pr.bag.length} / ${bagSize(pr)}</i></h3>` +
    grid(pr.bag, bagSize(pr), 'bag', null, undefined, (it) => (wont(it) ? PAWN.no : '+' + fenceValue(it, pr) + 'G'), wont) +
    (pr.bag.some(wont) ? `<p class="dim">${FENCE.wont}</p>` : '') + `<p class="dim">${SHOPW.gold(pr.gold)}</p></div>`;
}

/** Tap a packed piece under the table: SELL if he takes it, else its card and why not. `sync` puts the hero in step with the save. */
export function wireFence(g: Game, again: () => void, sync: () => void): void {
  const pr = g.profile;
  document.querySelectorAll<HTMLElement>('#panel [data-src^="bag:"]').forEach((t) => t.addEventListener('click', (e) => {
    e.stopPropagation();
    const i = Number(t.dataset.src!.split(':')[1]), it = pr.bag[i];
    if (!it) return;
    const price = fenceValue(it, g.profile), base = { icon: itemIcon(it), name: itemName(it), col: itemCol(it), body: card(it, g.hero, true), again };
    if (!price) return itemPop({ ...base, acts: [], why: FENCE.wont });
    itemPop({ ...base, acts: [{ label: PAWN.sell(price), primary: true, act: () => {
      if (!fence(pr, i)) return;
      sync();
      return says('Nettle', FENCE.sold);
    } }] });
  }));
}
