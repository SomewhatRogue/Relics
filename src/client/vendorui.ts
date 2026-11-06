/**
 * The class vendors (Kyle, 2026-11-05): a person at a counter in each class's place (the barracks, the
 * hunters' lodge, the back of the Drowned Rat, Vell's tower, the church's vestry), with a handful of
 * pieces rolled from the ten real minutes and the vendor (shared/vendors.ts), the same for everyone, and
 * the time left until fresh stock. Tobin's stall (stores.ts) uses the same stock rows. Buying goes into
 * your own save, as every shop.
 */
import { CLASS_ORDER, TIERS, itemName, priceOf } from '../shared/tuning';
import { bagSize } from '../shared/bags';
import { buyStock, cantBuy, isBought, stockFor, stockLeft, stockWindow, usable, type VendorId } from '../shared/vendors';
import type { Game } from './game';
import type { Panel } from './panels';
import { card, compare } from './card';
import { itemIcon } from './itemicons';
import { goodsList, says, shopHead, wireGoods, type Good } from './shopui';
import { SHOPW } from './shopwords';
import { townVoice, voiceClock } from './voiceplay';
import { VENDOR_PLACES } from './vendorwords';
import { fenceBody, fenceTabs, wireFence, type Tab } from './fenceui';

/** The hero in the room follows the save (else the next frame would put the old pack back). */
export function syncPack(g: Game): void {
  const pr = g.profile, h = g.hero;
  h.bag = [...pr.bag];
  h.bagSize = bagSize(pr);
  g.keep();
}

/** "Fresh stock in 7 min.", kept ticking while the panel is open. */
export function freshLine(): string {
  return `<span data-fresh>${SHOPW.fresh(Math.ceil(stockLeft(Date.now()) / 60000))}</span>`;
}
let ticking = 0;
function tick(again: () => void, win: number): void {
  clearInterval(ticking);
  ticking = window.setInterval(() => {
    const el = document.querySelector('#panel [data-fresh]');
    if (!el) return clearInterval(ticking);
    // The stock turned while you were looking: show the new one (unless a card is open over it).
    if (stockWindow(Date.now()) !== win && !document.querySelector('#panel .spop')) return again();
    el.textContent = SHOPW.fresh(Math.ceil(stockLeft(Date.now()) / 60000));
  }, 5000);
}

/** A vendor's stock as rows: what's left of it for you this window, each with its card and what it'd change. */
export function stockGoods(g: Game, v: VendorId, again: () => void): Good[] {
  const pr = g.profile, win = stockWindow(Date.now());
  tick(again, win);
  return stockFor(v, win).flatMap((it, i) => {
    if (isBought(pr, v, win, i)) return [];
    const why = cantBuy(pr, v, win, i);
    return [{
      name: itemName(it), price: priceOf(it), icon: itemIcon(it), col: TIERS[it.quality].col, about: card(it, g.hero, true),
      cmp: usable(pr, it) ? () => compare(g.hero, it) : undefined,
      why: why === 'class' ? SHOPW.notYours : why === 'pack' ? SHOPW.packFull : why === 'gold' ? SHOPW.poor : why === 'gone' ? SHOPW.soldOut : '',
      buy: () => {
        const got = buyStock(pr, v, win, i);
        if (!got) return;
        syncPack(g);
        return `<p class="dim">${SHOPW.bought}</p>` + card(got, g.hero, true);
      },
    }];
  });
}

/**
 * A class's vendor, by the class's place in CLASS_ORDER (the Npc's arg). Anyone may look; weapons only fit
 * their class. Nettle's table (the Rogue's) has a second tab, SELL QUIETLY, where he buys (fenceui.ts).
 */
export function openVendor(g: Game, panel: Panel, arg: number, tab: Tab = 'sale'): void {
  const cls = CLASS_ORDER[arg] ?? 'WARRIOR', pl = VENDOR_PLACES[cls], again = () => openVendor(g, panel, arg, tab), fence = cls === 'ROGUE';
  const head = shopHead(pl, says(pl.who, pl.greet)) + (fence ? fenceTabs(tab) : '');
  if (fence && tab === 'fence') {
    clearInterval(ticking);
    townVoice.hush(voiceClock());
    panel.show(pl.name, head + fenceBody(g));
    wireFence(g, again, () => syncPack(g));
  } else {
    const goods = stockGoods(g, cls, again);
    const foot = `${SHOPW.gold(g.profile.gold)} ${freshLine()}`;
    panel.show(pl.name, head + (goods.length ? goodsList(goods, foot) : `<div class="shop"><p>${SHOPW.soldOut}</p><p class="dim">${foot}</p></div>`));
    wireGoods(goods, again);
  }
  document.querySelectorAll<HTMLElement>('#panel [data-tab]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    openVendor(g, panel, arg, b.dataset.tab as Tab);
  }));
}
