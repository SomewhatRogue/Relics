/**
 * The church's vowed side (shared/shelf.ts): what amends pay, and Odric's shelf, both for clean heroes. The church
 * panel (client/townui.ts) adds `churchVowed`'s buttons.
 */
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { says } from './shopui';
import { card } from './card';
import { coinsHtml } from '../shared/coins';
import { isCorrupt } from '../shared/corrupt';
import { bagSize } from '../shared/bags';
import { Rng } from '../shared/rng';
import { stockLeft, stockWindow } from '../shared/vendors';
import { VOWED, vowedFor, vowedOf } from '../shared/vowed';
import { canPay, payOut, shelfFor, shelfPrice, takenNow } from '../shared/shelf';
import { itemName, type Item } from '../shared/tuning';
import { SHELFW } from './shelfwords';
import { spoken } from './vowedwords';

const dim = (s: string) => `<p class="dim">${s}</p>`;
const nameOf = (it: Item) => { const id = vowedOf(it); return id ? VOWED[id].name : itemName(it); };

/** The church panel's vowed buttons: a payout waiting, and the shelf. None for a corrupt hero. */
export function churchVowed(g: Game, panel: Panel, again: () => void): Button[] {
  const pr = g.profile;
  if (isCorrupt(pr)) return [];
  const out: Button[] = [];
  if (canPay(pr)) out.push({ label: SHELFW.owedButton, primary: true, act: () => payPick(g, panel, again) });
  out.push({ label: SHELFW.shelfButton, act: () => shelf(g, panel, again) });
  return out;
}

/** The payout: pick a slot, take the piece. */
function payPick(g: Game, panel: Panel, again: () => void): void {
  const pr = g.profile, full = pr.bag.length >= bagSize(pr);
  const slots = (['weapon', 'armor', 'ring'] as const).filter((s) => vowedFor(pr.cls, s).length);
  panel.show('FATHER ODRIC', says('Father Odric', SHELFW.owedLine) + (full ? dim(SHELFW.full) : ''), [
    ...slots.map((s) => ({ label: SHELFW.slots[s], disabled: full, act: () => {
      const it = payOut(pr, s, new Rng(pr.runs * 197 + (pr.amendsPaid ?? 0) * 31 + pr.level));
      g.keep();
      if (it) panel.show('FATHER ODRIC', says('Father Odric', SHELFW.paid(spoken(nameOf(it)))) + card(it, g.hero, true), [{ label: 'BACK', primary: true, act: again }]);
      else again();
    } })),
    { label: 'BACK', act: again },
  ]);
}

/** Odric's shelf: three for this class this window, each for a gift at the Lantern. */
function shelf(g: Game, panel: Panel, again: () => void): void {
  const pr = g.profile, now = Date.now(), win = stockWindow(now), items = shelfFor(pr.cls, win, pr.level), took = takenNow(pr.shelf, win);
  const full = pr.bag.length >= bagSize(pr), back = () => shelf(g, panel, again);
  const body = says('Father Odric', SHELFW.shelfLine) + items.map((it) => `<h3>${nameOf(it)}</h3>${card(it, g.hero, true)}`).join('') +
    (full ? dim(SHELFW.full) : '') + dim(SHELFW.restock(Math.ceil(stockLeft(now) / 60000)));
  panel.show(SHELFW.shelfButton, body, [
    ...items.map((it, i) => {
      const price = shelfPrice(it), gone = took.includes(i);
      return { label: gone ? `${nameOf(it)}: ${SHELFW.taken}` : `${nameOf(it)}: ${SHELFW.take(coinsHtml(price))}`, disabled: gone || full || pr.gold < price || pr.armor?.hungry === 'ransom', act: () => {
        if (!g.donate(price)) return back();
        pr.bag.push(it);
        pr.shelf = { win, took: [...took, i] };
        g.keep();
        back();
      } };
    }),
    { label: 'BACK', act: again },
  ]);
}
