/**
 * Every shop and stall in Wickhold, laid out one way (Kyle, 2026-11-02): what the place is in a line,
 * then who keeps it and what they say, then the goods as a list. Tap one and a small card comes up
 * with what it does and a BUY button. The words are shopwords.ts; each shop is shops.ts or stores.ts.
 */
import { line } from './speech';
import { SHOPW, type Place } from './shopwords';
import './shop.css';

/** One thing for sale: its name, price and picture, what it does (html), and buying it. */
export interface Good {
  name: string;
  price: number;
  icon?: string;
  col?: string;
  /** What it does, for its card. */
  about: string;
  /** Buy it; return html to show what you got (gear), or nothing. */
  buy: () => string | void;
  /** Why it can't be bought now ('' if it can). */
  why: string;
  label?: string;
}

const p = (s: string) => `<p>${s}</p>`;
/** A line spoken by the keeper (typed in, in their voice). */
export const says = (who: string, s: string) => `<p class="says">${line(`"${s}"`, who)}</p>`;

/** The top of every shop: what the place is, then its keeper and what they say. */
export function shopHead(pl: Place, lines: string): string {
  return `<div class="shop"><p class="place">${pl.line}</p><div class="keeper">${pl.keeper}</div>${lines}</div>`;
}

/** The goods as a list (each a row: picture, name, price); `foot` under it (gold, belt). */
export function goodsList(goods: Good[], foot = '', head = SHOPW.forSale): string {
  if (!goods.length) return foot ? `<div class="shop">${p(foot)}</div>` : '';
  return `<div class="shop"><h3 class="gh">${head}</h3><div class="goods">` + goods.map((g, i) =>
    `<button class="good${g.why ? ' off' : ''}" data-good="${i}">${g.icon ? `<img src="${g.icon}" alt="">` : '<span class="noicon"></span>'}` +
    `<span class="gn"${g.col ? ` style="color:${g.col}"` : ''}>${g.name}</span><em>${g.price}G</em></button>`).join('') +
    `</div>${foot ? `<p class="dim">${foot}</p>` : ''}</div>`;
}

/** Make the rows in the open panel tappable: each brings up its card. `again` redraws the shop. */
export function wireGoods(goods: Good[], again: () => void): void {
  document.querySelectorAll<HTMLElement>('#panel [data-good]').forEach((b) =>
    b.addEventListener('click', (e) => (e.stopPropagation(), pop(goods[Number(b.dataset.good)], again))));
}

/** The small card over the shop: the good, what it does, and BUY (or why not). */
function pop(g: Good, again: () => void): void {
  const card = `<div class="ph">${g.icon ? `<img src="${g.icon}" alt="">` : ''}<b${g.col ? ` style="color:${g.col}"` : ''}>${g.name}</b><em>${g.price} GOLD</em></div>` +
    `<div class="pa">${g.about}</div>${g.why ? `<p class="dim">${g.why}</p>` : ''}` +
    `<div class="pb"><button class="primary" data-buy${g.why ? ' disabled' : ''}>${g.label ?? SHOPW.buy}</button><button data-shut>CLOSE</button></div>`;
  open(card, () => {
    const got = g.buy();
    again();
    if (got) open(`<div class="pa">${got}</div><div class="pb"><button class="primary" data-shut>OK</button></div>`);
  });
}

function open(html: string, buy?: () => void): void {
  document.querySelector('#panel .spop')?.remove();
  const host = document.querySelector('#panel');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'spop';
  el.innerHTML = `<div class="spcard">${html}</div>`;
  host.appendChild(el);
  const shut = () => el.remove();
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const t = e.target as HTMLElement;
    if (t === el || t.closest('[data-shut]')) return shut();
    if (t.closest('[data-buy]') && buy) shut(), buy();
  });
}
