/**
 * Wickhold's three places for gear, laid out like every shop (shopui.ts: the place, the keeper, the
 * goods) with a panel of squares under it (cells.ts). Tap a square and its card comes up with only what
 * can be done with that piece here, in a bar that never scrolls away (Kyle, 2026-11-05). The vault under
 * the counting house (Keeper Edda: pack to vault and back, more shelves for gold); Tobin's pawn stall on
 * Market Row (his stock, rolled every ten minutes for everyone, shared/vendors.ts; a bigger pack; what
 * you sold him, back at what he paid until you're home from your next job; and he buys anything but
 * the rare three, and won't trade at all with a hero carrying hungry gear, shared/fence.ts); Halvard's forge (strike what you wear up a plus for gold and steel, forgeview.ts; MELT DOWN what's in your pack).
 * The rules are shared/bags.ts; syncPack keeps the hero in step with the save after each one.
 */
import { coinsHtml } from '../shared/coins';
import { carriesHungry, tobinWont } from '../shared/fence';
import { bagSize, growBag, growVault, nextBag, nextVault, pawn, pawns, redeem, stow, unstow, vaultSize } from '../shared/bags';
import { itemCol } from './uniquelook';
import { STEEL, itemName, nextLevel, plusOf, sellValue, type Item } from '../shared/tuning';
import type { SpotId } from '../shared/town';
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { card, compare } from './card';
import { itemIcon } from './itemicons';
import { goodsList, itemPop, says, shopHead, wireGoods, type Act, type Good } from './shopui';
import { sfxTown } from './sfxtown';
import { PLACES, SHOPW } from './shopwords';
import { cell, grid } from './cells';
import { SMITH } from './copy';
import { BANK, FORGE, PAWN } from './storewords';
import { forgeBody } from './forgeview';
import { freshLine, stockGoods, syncPack } from './vendorui';
import { WEAPONS } from '../shared/tuning';
import { openShiftDesk } from './shiftui';
import { SHIFTW } from './shiftwords';
import './stores.css';

const p = (s: string) => `<p>${s}</p>`;
const h3 = (s: string, n?: string) => `<h3 class="sh">${s}${n ? ` <i>${n}</i>` : ''}</h3>`;

/** Show a store; tapping a square brings up its card (`tap`), a good brings up its own. */
function show(panel: Panel, title: string, html: string, tap: (src: string, i: number) => void, again: () => void, goods: Good[] = [], buttons: Button[] = []): void {
  const scroll = document.querySelector('#panel .card')?.scrollTop ?? 0;
  panel.show(title, `<div class="store">${html}</div>`, buttons);
  const box = document.querySelector('#panel .card');
  if (box) box.scrollTop = scroll;
  document.querySelectorAll<HTMLElement>('#panel [data-src]').forEach((t) => t.addEventListener('click', (e) => {
    e.stopPropagation();
    const [s, i] = t.dataset.src!.split(':');
    tap(s, Number(i));
  }));
  wireGoods(goods, again);
}

/** A piece's card, with COMPARE when it's yours to wear (a weapon of another class: just the card). */
function piece(g: Game, it: Item, acts: Act[], again: () => void, note = '', worn = false): void {
  const fits = !it.kit || WEAPONS[it.kit].cls === WEAPONS[g.hero.weapon].cls;
  itemPop({ icon: itemIcon(it), name: itemName(it), col: itemCol(it), body: card(it, g.hero, true) + note, acts, again,
    cmp: fits && !worn ? () => compare(g.hero, it) : undefined, why: fits ? '' : SHOPW.notYours });
}

/** The vault, a counting house that's lost half its roof: more shelves for sale, then the vault and your pack. */
function bank(g: Game, panel: Panel): void {
  const pr = g.profile, stash = pr.stash ?? [], more = nextVault(pr), again = () => bank(g, panel);
  const tap = (s: string, i: number) => {
    if (s === 'bag' && pr.bag[i]) {
      const it = pr.bag[i];
      return piece(g, it, [{ label: BANK.store, primary: true, disabled: stash.length >= vaultSize(pr), act: () => void (stow(pr, i) && syncPack(g)) }], again,
        it.quality === 'hungry' ? says('Edda', BANK.hungry) : '');
    }
    if (s === 'vault' && stash[i]) piece(g, stash[i], [{ label: BANK.take, primary: true, disabled: pr.bag.length >= bagSize(pr), act: () => void (unstow(pr, i) && syncPack(g)) }], again);
  };
  const goods: Good[] = more ? [{ name: BANK.shelves, price: more.gold, about: p(SHOPW.shelves(more.size)), why: pr.gold < more.gold ? SHOPW.poor : '', buy: () => void (growVault(pr) && syncPack(g)) }] : [];
  show(panel, PLACES.bank.name, shopHead(PLACES.bank, says('Edda', BANK.greet)) + goodsList(goods, more ? SHOPW.gold(pr.gold) : BANK.biggest) +
    h3(BANK.vault, `${stash.length} / ${vaultSize(pr)}`) + grid(stash, vaultSize(pr), 'vault', null) +
    h3('PACK', `${pr.bag.length} / ${bagSize(pr)}`) + grid(pr.bag, bagSize(pr), 'bag', null) + p(`<span class="dim">${BANK.tap}</span>`),
  tap, again, goods);
}

/** Which of Tobin's tabs is up: what he has, or your pack to sell from (Kyle, 2026-11-08: "a different tab
 *  than buying, otherwise it takes too much space"). */
let pawnTab: 'buy' | 'sell' = 'buy';
/** Turn to one of Tobin's tabs (the tabs themselves do this; the tests too). */
export const pawnTabTo = (t: 'buy' | 'sell') => void (pawnTab = t);

/**
 * Tobin's stall, in two tabs: FOR SALE, his stock, a bigger pack and what he'll sell you back; and SELL, your
 * pack to sell from, the rare three dim. Carrying hungry gear, you get his panic and nothing else (Kyle, 2026-11-05).
 */
function merchant(g: Game, panel: Panel): void {
  const pr = g.profile, held = pawns(pr), more = nextBag(pr), room = pr.bag.length < bagSize(pr), again = () => merchant(g, panel);
  if (carriesHungry(pr)) return show(panel, PLACES.pawn.name, shopHead(PLACES.pawn, says('Tobin', PAWN.panic)) + p(`<span class="dim">${PAWN.panicRule}</span>`), () => {}, again);
  const wont = (it: Item) => !!tobinWont(pr, it);
  const tap = (s: string, i: number) => {
    const it = s === 'bag' ? pr.bag[i] : undefined, price = it ? sellValue(it) : 0;
    if (!it) return;
    if (wont(it)) return itemPop({ icon: itemIcon(it), name: itemName(it), col: itemCol(it), body: says('Tobin', PAWN.hungry) + card(it, g.hero, true), acts: [], again, why: PAWN.wont });
    piece(g, it, [{ label: PAWN.sell(price), primary: true, act: () => void (pawn(pr, i) && syncPack(g)) }], again);
  };
  const goods: Good[] = [
    ...stockGoods(g, 'pawn', again),
    ...(more ? [{ name: PAWN.bigger, price: more.gold, about: p(SHOPW.pack(more.size)), why: pr.gold < more.gold ? SHOPW.poor : '', buy: () => void (growBag(pr) && syncPack(g)) }] : []),
    ...held.map((x, k) => ({ name: itemName(x.item), price: x.price, icon: itemIcon(x.item), col: itemCol(x.item), label: PAWN.back, about: card(x.item, g.hero, true),
      cmp: () => compare(g.hero, x.item), why: !room ? SHOPW.packFull : pr.gold < x.price ? SHOPW.poor : '', buy: () => void (redeem(pr, k) && syncPack(g)) })),
  ];
  const tabs = '<div class="tabs">' + ([['buy', SHOPW.forSale], ['sell', PAWN.sellTab]] as const)
    .map(([t, name]) => `<button data-ptab="${t}"${t === pawnTab ? ' class="on"' : ''}>${name}</button>`).join('') + '</div>';
  const body = pawnTab === 'buy'
    ? shopHead(PLACES.pawn, says('Tobin', PAWN.greet)) + goodsList(goods, `${SHOPW.gold(pr.gold)} ${freshLine()}` + (more ? '' : ' ' + PAWN.biggest)) + (held.length ? p(`<span class="dim">${PAWN.rule}</span>`) : '')
    : h3(SHOPW.sell, `${pr.bag.length} / ${bagSize(pr)}`) + grid(pr.bag, bagSize(pr), 'bag', null, undefined, (it) => (wont(it) ? PAWN.no : '+' + coinsHtml(sellValue(it))), wont) +
      (pr.bag.some(wont) ? p(`<span class="dim">${PAWN.wont}</span>`) : '') + p(`<span class="dim">${SHOPW.gold(pr.gold)}</span>`);
  show(panel, PLACES.pawn.name, tabs + body, tap, again, pawnTab === 'buy' ? goods : []);
  document.querySelectorAll<HTMLElement>('#panel [data-ptab]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    pawnTab = b.dataset.ptab as 'buy' | 'sell';
    again();
  }));
}

/** A worn piece at the forge: its plus, NOW and AFTER and the price (forgeview.ts), then its card. */
function forgePop(g: Game, it: Item, acts: Act[], again: () => void): void {
  itemPop({ icon: itemIcon(it), name: itemName(it), col: itemCol(it), body: forgeBody(it, WEAPONS[g.hero.weapon].cls) + card(it, g.hero, true), acts, again });
}

/** Halvard's forge: UPGRADE what you wear, or MELT DOWN what's in your pack. One choice per piece. Or WORK A SHIFT (shiftui.ts). */
function forge(g: Game, panel: Panel): void {
  const pr = g.profile, held = pr.arms[pr.weapon], worn = [held, pr.armor, ...pr.rings].filter((x): x is Item => !!x), again = () => forge(g, panel);
  const tap = (s: string, i: number) => {
    const it = s === 'worn' ? worn[i] : s === 'bag' ? pr.bag[i] : undefined;
    if (!it) return;
    if (it.quality === 'hungry') return piece(g, it, [], again, says('Halvard', SMITH.hungry), s === 'worn');
    if (s === 'bag') return piece(g, it, [{ label: FORGE.melt(STEEL[it.quality]), primary: true, act: () => void (g.melt(it) && sfxTown.anvil()) }], again);
    // The only way up a plus is to strike it yourself (Kyle, 2026-11-06): pay, the plus is made and saved
    // (Game.levelUp), then the anvil (anvilmode.ts) adds a little more for a good strike.
    const next = nextLevel(it), poor = !next || pr.gold < next.gold || pr.steel < next.steel, to = plusOf(it) + 1;
    const strike = () => {
      const up = g.levelUp(it);
      if (up) void import('./anvilmode').then((m) => (panel.hide(), m.openAnvil(g, panel, up, again)));
    };
    forgePop(g, it, next ? [{ label: FORGE.strike(to, next.gold, next.steel), primary: true, disabled: poor, act: strike }] : [], again);
  };
  show(panel, PLACES.forge.name, shopHead(PLACES.forge, says('Halvard', SMITH.anvil)) + p(`<span class="dim">${FORGE.purse(pr.gold, pr.steel)}</span>`) +
    h3(FORGE.upHead) + `<div class="cells">${worn.map((x, k) => cell(x, 'worn:' + k)).join('')}</div>` +
    h3(FORGE.meltHead, `${pr.bag.length} / ${bagSize(pr)}`) + grid(pr.bag, bagSize(pr), 'bag', null, undefined, (it) => (it.quality === 'hungry' ? '' : '+' + STEEL[it.quality])),
  tap, again, [], [{ label: SHIFTW.work, act: () => openShiftDesk(g, panel, again) }]);
}

/** Open one of these if `id` is one; false otherwise (townui.ts handles the rest). */
export function openStore(id: SpotId, g: Game, panel: Panel): boolean {
  if (id !== 'bank' && id !== 'merchant' && id !== 'smith') return false;
  ({ bank, merchant, smith: forge })[id](g, panel);
  return true;
}
