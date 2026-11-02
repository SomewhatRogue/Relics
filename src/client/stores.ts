/**
 * Wickhold's three places for gear, each a panel of squares (cells.ts): tap a piece for its card and
 * what can be done with it here. The vault under the counting house (Keeper Edda: pack to vault and
 * back, more shelves for gold), Tobin's pawn stall on Market Row (sell anything but hungry gear, buy it
 * back at what he paid until you're home from your next job, a bigger pack for gold), and Halvard's
 * anvil at the forge (a level up for gold and steel, melt a spare down for steel, and his rack).
 * The rules are shared/bags.ts; this keeps the hero in step with the save after each one.
 */
import { bagSize, growBag, growVault, nextBag, nextVault, pawn, pawns, redeem, stow, unstow, vaultSize } from '../shared/bags';
import { ARMOR, CLASS_KITS, STEEL, WEAPONS, nextLevel, sellValue, type Item } from '../shared/tuning';
import { SHOP } from '../shared/progress';
import type { SpotId } from '../shared/town';
import type { Game } from './game';
import type { Panel } from './panels';
import { card } from './card';
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

/** Show a store; tapping a square chooses it, a `data-act` button does what it says. */
function show(panel: Panel, title: string, html: string, acts: Record<string, () => void>, again: () => void, buttons: { label: string; act: () => void; primary?: boolean; disabled?: boolean }[] = []): void {
  const scroll = document.querySelector('#panel .card')?.scrollTop ?? 0;
  panel.show(title, `<div class="store">${html}</div>`, buttons);
  const box = document.querySelector('#panel .card');
  if (box) box.scrollTop = scroll;
  document.querySelectorAll<HTMLElement>('#panel [data-src]').forEach((t) => t.addEventListener('click', () => ((sel = sel === t.dataset.src ? null : t.dataset.src!), again())));
  document.querySelectorAll<HTMLButtonElement>('#panel [data-act]').forEach((b) => b.addEventListener('click', (e) => (e.stopPropagation(), acts[b.dataset.act!]?.(), (sel = null), again())));
}

/** The vault, a counting house that's lost half its roof. */
function bank(g: Game, panel: Panel): void {
  const pr = g.profile, stash = pr.stash ?? [], [s, si] = (sel ?? '').split(':'), i = Number(si), more = nextVault(pr);
  let detail = p(BANK.tap);
  if (s === 'bag' && pr.bag[i]) {
    const it = pr.bag[i], hungry = it.quality === 'hungry';
    detail = sideBySide(g.hero, it, false, hungry ? say('Edda', BANK.hungry) : `<div class="btns">${act(BANK.store, 'store', stash.length < vaultSize(pr))}</div>`);
  } else if (s === 'vault' && stash[i]) detail = sideBySide(g.hero, stash[i], false, `<div class="btns">${act(BANK.take, 'take', pr.bag.length < bagSize(pr))}</div>`);
  show(panel, BANK.name, h3(BANK.vault, `${stash.length} / ${vaultSize(pr)}`) + grid(stash, vaultSize(pr), 'vault', sel) +
    h3('PACK', `${pr.bag.length} / ${bagSize(pr)}`) + grid(pr.bag, bagSize(pr), 'bag', sel) +
    `<div class="sdetail">${detail}</div>` + p(`<span class="dim">${BANK.safe} You have ${pr.gold} gold.</span>`) + say('Edda', BANK.greet),
  { store: () => stow(pr, i) && sync(g), take: () => unstow(pr, i) && sync(g) }, () => bank(g, panel),
  [more ? { label: BANK.more(more.size, more.gold), disabled: pr.gold < more.gold, act: () => (growVault(pr) && sync(g), bank(g, panel)) } : { label: BANK.biggest, disabled: true, act: () => {} }]);
}

/** Tobin's stall: sell, buy back, a bigger pack. */
function merchant(g: Game, panel: Panel): void {
  const pr = g.profile, held = pawns(pr), [s, si] = (sel ?? '').split(':'), i = Number(si), more = nextBag(pr), room = pr.bag.length < bagSize(pr);
  let detail = '';
  if (s === 'bag' && pr.bag[i]) {
    const it = pr.bag[i], price = sellValue(it);
    detail = sideBySide(g.hero, it, false, price > 0 ? `<div class="btns">${act(PAWN.sell(price), 'sell')}</div>` : say('Tobin', PAWN.hungry));
  } else if (s === 'back' && held[i]) detail = card(held[i].item, g.hero) + `<div class="btns">${act(PAWN.buy(held[i].price), 'buy', pr.gold >= held[i].price && room)}</div>`;
  const backs = held.map((x) => x.item), tags = (_: Item, k: number) => held[k].price + 'G';
  show(panel, PAWN.name, p(`You have ${pr.gold} gold.`) + h3('PACK', `${pr.bag.length} / ${bagSize(pr)}`) + grid(pr.bag, bagSize(pr), 'bag', sel, undefined, (it) => (sellValue(it) ? '+' + sellValue(it) + 'G' : '')) +
    h3(PAWN.back) + (backs.length ? grid(backs, backs.length, 'back', sel, undefined, tags) : p(`<span class="dim">${PAWN.none}</span>`)) +
    `<div class="sdetail">${detail || p(PAWN.rule)}</div>` + say('Tobin', PAWN.greet) + say('Tobin', PAWN.packs),
  { sell: () => pawn(pr, i) && sync(g), buy: () => redeem(pr, i) && sync(g) }, () => merchant(g, panel),
  [more ? { label: PAWN.more(more.size, more.gold), primary: true, disabled: pr.gold < more.gold, act: () => (growBag(pr) && sync(g), merchant(g, panel)) } : { label: PAWN.biggest, disabled: true, act: () => {} }]);
}

/** Halvard's anvil: up a level, or into the fire for steel. */
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
  show(panel, 'HALVARD THE SMITH', p(`You have ${pr.gold} gold and ${pr.steel} steel.`) +
    h3('WORN') + `<div class="cells">${worn.map((x, k) => cell(x, 'worn:' + k, { sel })).join('')}</div>` +
    h3('PACK', `${pr.bag.length} / ${bagSize(pr)}`) + grid(pr.bag, bagSize(pr), 'bag', sel) + `<div class="sdetail">${detail}</div>` + say('Halvard', SMITH.anvil),
  { up: () => it && g.upgrade(it), melt: () => it && g.melt(it) }, () => forge(g, panel),
  [{ label: FORGE.rack, act: () => rack(g, panel) }]);
}

/** Halvard's rack: Fine gear for gold, as before. */
function rack(g: Game, panel: Panel): void {
  const pr = g.profile, cost = SHOP.fine, full = pr.bag.length >= bagSize(pr), back = () => rack(g, panel);
  const sold = (label: string, buy: () => Item | null) => ({ label: `${label} (${cost})`, primary: true, disabled: full || pr.gold < cost, act: () => {
    const it = buy();
    if (it) panel.show('BOUGHT', `<div class="store">${sideBySide(g.hero, it)}</div>` + p(SMITH.bought), [{ label: 'MORE', act: back }, { label: 'THE ANVIL', act: () => forge(g, panel) }]);
  } });
  panel.show(FORGE.rack, say('Halvard', SMITH.greet) + p(`Fine (green): one modifier. ${cost} gold each.`) + p(full ? 'Your pack is full.' : `You have ${pr.gold} gold.`), [
    ...CLASS_KITS[pr.cls].map((k) => sold(WEAPONS[k].name, () => g.buy('fine', k))),
    ...(['light', 'medium', 'heavy'] as const).map((a) => sold(ARMOR[a].name, () => g.buy('fine', pr.weapon, 'armor', a))),
    { label: 'THE ANVIL', act: () => forge(g, panel) },
  ]);
}

/** Open one of these if `id` is one; false otherwise (townui.ts handles the rest). */
export function openStore(id: SpotId, g: Game, panel: Panel): boolean {
  if (id !== 'bank' && id !== 'merchant' && id !== 'smith') return false;
  sel = null;
  ({ bank, merchant, smith: forge })[id](g, panel);
  return true;
}

