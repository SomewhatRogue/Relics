/**
 * Wickhold's three places for gear, laid out like every shop (shopui.ts: the place, the keeper, the
 * goods) with a panel of squares under it (cells.ts): tap a piece for its card and what can be done
 * with it here. The vault under the counting house (Keeper Edda: pack to vault and back, more shelves
 * for gold), Tobin's pawn stall on Market Row (sell anything but hungry gear, buy it back at what he
 * paid until you're home from your next job, a bigger pack for gold), and Halvard's forge (his rack of
 * Fine gear, then the anvil: a level up for gold and steel, or melt a spare down for steel).
 * The rules are shared/bags.ts; this keeps the hero in step with the save after each one.
 */
import { bagSize, growBag, growVault, nextBag, nextVault, pawn, pawns, redeem, stow, unstow, vaultSize } from '../shared/bags';
import { CLASS_KITS, STEEL, TIERS, itemName, nextLevel, sellValue, type Item } from '../shared/tuning';
import type { SpotId } from '../shared/town';
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { card, compare } from './card';
import { itemIcon } from './itemicons';
import { goodsList, says, shopHead, wireGoods, type Good } from './shopui';
import { gearGood } from './shopgoods';
import { PLACES, SHOPW } from './shopwords';
import { cell, grid, sideBySide } from './cells';
import { line } from './speech';
import { SMITH } from './copy';
import { BANK, FORGE, PAWN } from './storewords';
import './stores.css';

const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);
const h3 = (s: string, n?: string) => `<h3 class="sh">${s}${n ? ` <i>${n}</i>` : ''}</h3>`;
const act = (label: string, key: string, on = true, cls = 'primary') => `<button data-act="${key}" class="${cls}"${on ? '' : ' disabled'}>${label}</button>`;
let sel: string | null = null;

/** The hero in the room follows the save (else the next frame would put the old pack back). */
function sync(g: Game): void {
  const pr = g.profile, h = g.hero;
  h.bag = [...pr.bag];
  h.bagSize = bagSize(pr);
  g.keep();
}

/** Show a store; tapping a square chooses it, a `data-act` button does what it says, a good brings up its card. */
function show(panel: Panel, title: string, html: string, acts: Record<string, () => void>, again: () => void, goods: Good[] = [], buttons: Button[] = []): void {
  const scroll = document.querySelector('#panel .card')?.scrollTop ?? 0;
  panel.show(title, `<div class="store">${html}</div>`, buttons);
  const box = document.querySelector('#panel .card');
  if (box) box.scrollTop = scroll;
  document.querySelectorAll<HTMLElement>('#panel [data-src]').forEach((t) => t.addEventListener('click', () => ((sel = sel === t.dataset.src ? null : t.dataset.src!), again())));
  document.querySelectorAll<HTMLButtonElement>('#panel [data-act]').forEach((b) => b.addEventListener('click', (e) => (e.stopPropagation(), acts[b.dataset.act!]?.(), (sel = null), again())));
  wireGoods(goods, again);
}

/** The vault, a counting house that's lost half its roof: more shelves for sale, then the vault and your pack. */
function bank(g: Game, panel: Panel): void {
  const pr = g.profile, stash = pr.stash ?? [], [s, si] = (sel ?? '').split(':'), i = Number(si), more = nextVault(pr);
  let detail = p(BANK.tap);
  if (s === 'bag' && pr.bag[i]) {
    const it = pr.bag[i], hungry = it.quality === 'hungry';
    detail = sideBySide(g.hero, it, false, hungry ? say('Edda', BANK.hungry) : `<div class="btns">${act(BANK.store, 'store', stash.length < vaultSize(pr))}</div>`);
  } else if (s === 'vault' && stash[i]) detail = sideBySide(g.hero, stash[i], false, `<div class="btns">${act(BANK.take, 'take', pr.bag.length < bagSize(pr))}</div>`);
  const goods: Good[] = more ? [{ name: BANK.shelves, price: more.gold, about: p(SHOPW.shelves(more.size)), why: pr.gold < more.gold ? SHOPW.poor : '', buy: () => void (growVault(pr) && sync(g)) }] : [];
  show(panel, PLACES.bank.name, shopHead(PLACES.bank, says('Edda', BANK.greet)) + goodsList(goods, more ? SHOPW.gold(pr.gold) : BANK.biggest) +
    h3(BANK.vault, `${stash.length} / ${vaultSize(pr)}`) + grid(stash, vaultSize(pr), 'vault', sel) +
    h3('PACK', `${pr.bag.length} / ${bagSize(pr)}`) + grid(pr.bag, bagSize(pr), 'bag', sel) +
    `<div class="sdetail">${detail}</div>` + p(`<span class="dim">${BANK.safe}</span>`),
  { store: () => stow(pr, i) && sync(g), take: () => unstow(pr, i) && sync(g) }, () => bank(g, panel), goods);
}

/** Tobin's stall: what he'll sell you back and a bigger pack, then your pack to sell from. */
function merchant(g: Game, panel: Panel): void {
  const pr = g.profile, held = pawns(pr), [s, si] = (sel ?? '').split(':'), i = Number(si), more = nextBag(pr), room = pr.bag.length < bagSize(pr);
  let detail = p(PAWN.rule);
  if (s === 'bag' && pr.bag[i]) {
    const it = pr.bag[i], price = sellValue(it);
    detail = sideBySide(g.hero, it, false, price > 0 ? `<div class="btns">${act(PAWN.sell(price), 'sell')}</div>` : say('Tobin', PAWN.hungry));
  }
  const goods: Good[] = [
    ...held.map((x, k) => ({ name: itemName(x.item), price: x.price, icon: itemIcon(x.item), col: TIERS[x.item.quality].col, label: PAWN.back, about: card(x.item, g.hero) + compare(g.hero, x.item),
      why: !room ? SHOPW.packFull : pr.gold < x.price ? SHOPW.poor : '', buy: () => void (redeem(pr, k) && sync(g)) })),
    ...(more ? [{ name: PAWN.bigger, price: more.gold, about: p(SHOPW.pack(more.size)), why: pr.gold < more.gold ? SHOPW.poor : '', buy: () => void (growBag(pr) && sync(g)) }] : []),
  ];
  show(panel, PLACES.pawn.name, shopHead(PLACES.pawn, says('Tobin', PAWN.greet)) + goodsList(goods, SHOPW.gold(pr.gold) + (more ? '' : ' ' + PAWN.biggest)) +
    h3(SHOPW.sell, `${pr.bag.length} / ${bagSize(pr)}`) + grid(pr.bag, bagSize(pr), 'bag', sel, undefined, (it) => (sellValue(it) ? '+' + sellValue(it) + 'G' : '')) +
    `<div class="sdetail">${detail}</div>`,
  { sell: () => pawn(pr, i) && sync(g) }, () => merchant(g, panel), goods);
}

/** Halvard's forge: his rack (Fine gear for gold), then the anvil: up a level, or into the fire for steel. */
function forge(g: Game, panel: Panel): void {
  const pr = g.profile, h = g.hero, held = pr.arms[pr.weapon], worn = [held, pr.armor, ...pr.rings].filter((x): x is Item => !!x);
  const [s, si] = (sel ?? '').split(':'), i = Number(si), it = s === 'worn' ? worn[i] : s === 'bag' ? pr.bag[i] : undefined;
  let detail = p(FORGE.pick);
  if (it) {
    const next = nextLevel(it), hungry = it.quality === 'hungry';
    const up = next ? act(FORGE.up((it.level ?? 0) + 1, next.gold, next.steel), 'up', pr.gold >= next.gold && pr.steel >= next.steel) : '';
    const melt = s === 'bag' && !hungry ? act(FORGE.melt(STEEL[it.quality]), 'melt', true, '') : '';
    const note = hungry ? say('Halvard', SMITH.hungry) : (next ? '' : p(FORGE.top)) + (s === 'worn' ? p(`<span class="dim">${FORGE.meltWorn}</span>`) : '');
    detail = sideBySide(h, it, s === 'worn', note + (up || melt ? `<div class="btns">${up}${melt}</div>` : ''));
  }
  const goods = [...CLASS_KITS[pr.cls].map((kit) => gearGood(g, 'fine', { kit }, SMITH.bought)), ...(['light', 'medium', 'heavy'] as const).map((armor) => gearGood(g, 'fine', { armor }, SMITH.bought))];
  show(panel, PLACES.forge.name, shopHead(PLACES.forge, says('Halvard', SMITH.anvil)) + goodsList(goods, `You have ${pr.gold} gold and ${pr.steel} steel.`) +
    h3(FORGE.title) + h3('WORN') + `<div class="cells">${worn.map((x, k) => cell(x, 'worn:' + k, { sel })).join('')}</div>` +
    h3('PACK', `${pr.bag.length} / ${bagSize(pr)}`) + grid(pr.bag, bagSize(pr), 'bag', sel) + `<div class="sdetail">${detail}</div>`,
  { up: () => it && g.upgrade(it), melt: () => it && g.melt(it) }, () => forge(g, panel), goods);
}

/** Open one of these if `id` is one; false otherwise (townui.ts handles the rest). */
export function openStore(id: SpotId, g: Game, panel: Panel): boolean {
  if (id !== 'bank' && id !== 'merchant' && id !== 'smith') return false;
  sel = null;
  ({ bank, merchant, smith: forge })[id](g, panel);
  return true;
}

