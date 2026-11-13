/**
 * Every shop and stall in Wickhold, laid out one way (Kyle, 2026-11-02): what the place is in a line,
 * then who keeps it and what they say, then the goods as a list. Tap one and a small card comes up.
 * The card (Kyle, 2026-11-05: "buying and selling is noisy"): just the thing tapped, its stats in one
 * block; the comparison with what you wear behind a COMPARE toggle (off at first, remembered on this
 * device); and only that thing's actions, in a bar at the foot that never scrolls away, the price on the
 * button. The words are shopwords.ts; each shop is shops.ts, stores.ts or vendorui.ts.
 */
import { line, typeIn } from './speech';
import { SHOPW, type Place } from './shopwords';
import './shop.css';
import { coinsHtml } from '../shared/coins';

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
  /** The comparison with what you wear, behind COMPARE (gear only). */
  cmp?: () => string;
}
/** One action on a card's bar: its label (with the price or what you get), and doing it. */
export interface Act { label: string; act: () => string | void; primary?: boolean; disabled?: boolean }

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
    `<span class="gn"${g.col ? ` style="color:${g.col}"` : ''}>${g.name}</span><em>${coinsHtml(g.price)}</em></button>`).join('') +
    `</div>${foot ? `<p class="dim">${foot}</p>` : ''}</div>`;
}

/** Make the rows in the open panel tappable: each brings up its card. `again` redraws the shop. */
export function wireGoods(goods: Good[], again: () => void): void {
  document.querySelectorAll<HTMLElement>('#panel [data-good]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const g = goods[Number(b.dataset.good)];
      itemPop({ icon: g.icon, name: g.name, col: g.col, body: g.about, cmp: g.cmp, why: g.why, again,
        acts: [{ label: `${g.label ?? SHOPW.buy} (${coinsHtml(g.price)})`, act: g.buy, primary: true, disabled: !!g.why }] });
    }));
}

const CMP_KEY = 'relic.compare';
/** COMPARE, on or off, remembered on this device (off if storage is shut). */
export function compareOn(): boolean {
  try { return localStorage.getItem(CMP_KEY) === '1'; } catch { return false; }
}
function setCompare(on: boolean): void {
  try { localStorage.setItem(CMP_KEY, on ? '1' : '0'); } catch { /* the toggle still works for now */ }
}

export interface Pop { icon?: string; name: string; col?: string; body: string; cmp?: () => string; why?: string; acts: Act[]; again: () => void }

/** The small card over a shop or store: the thing, its block of stats, COMPARE, and its bar of actions. */
export function itemPop(o: Pop): void {
  const on = !!o.cmp && compareOn();
  const cmp = o.cmp ? `<button class="cmpt${on ? ' on' : ''}" data-cmp>${SHOPW.compare}${on ? ': ON' : ''}</button>${on ? o.cmp() : ''}` : '';
  const bar = (o.why ? `<p class="dim why">${o.why}</p>` : '') + '<div class="pbb">' +
    o.acts.map((a, i) => `<button class="${a.primary ? 'primary' : ''}" data-act="${i}"${a.disabled ? ' disabled' : ''}>${a.label}</button>`).join('') +
    `<button data-shut>${SHOPW.close}</button></div>`;
  open(`<div class="ph">${o.icon ? `<img src="${o.icon}" alt="">` : ''}<b${o.col ? ` style="color:${o.col}"` : ''}>${o.name}</b></div>` +
    `<div class="pa">${o.body}${cmp}</div><div class="pb">${bar}</div>`, (t) => {
    if (t.closest('[data-cmp]')) return setCompare(!on), itemPop(o);
    const a = t.closest<HTMLElement>('[data-act]');
    if (!a) return;
    const got = o.acts[Number(a.dataset.act)]?.act();
    o.again();
    if (got) open(`<div class="pa">${got}</div><div class="pb"><div class="pbb"><button class="primary" data-shut>OK</button></div></div>`);
  });
}

function open(html: string, click?: (t: HTMLElement) => void): void {
  document.querySelector('#panel .spop')?.remove();
  const host = document.querySelector('#panel');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'spop';
  el.innerHTML = `<div class="spcard">${html}</div>`;
  host.appendChild(el);
  // A keeper's line on the card (Tobin, Edda, Halvard, Nettle) types in as it does on the panel; the bar stays put.
  const body = el.querySelector<HTMLElement>('.pa');
  if (body?.querySelector('[data-say]')) typeIn(body);
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const t = e.target as HTMLElement;
    if (t === el || t.closest('[data-shut]')) return el.remove();
    if (t.closest('button:disabled')) return;
    click?.(t);
  });
}
