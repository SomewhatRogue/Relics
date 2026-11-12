/**
 * A trade in the save (docs/design/trading.md, step 3). Before this browser's first ACCEPT goes to the server,
 * the trade is kept in the save (`Save.trade`): its terms and the items coming in. If the page closes before
 * it settles, the next load asks the server how it ended and settles it then. Settling and letting go of it
 * are one save, so a trade is never settled twice.
 */
import { bagSize } from '../shared/bags';
import { settle, termsKey, type Pending, type TradeState } from '../shared/trade';
import { ledgerCall } from './ledger';
import type { Save } from './save';

/** Kept in the save, before the first ACCEPT is sent. */
export function holdTrade(s: Save, p: Pending, keep: (s: Save) => void): void {
  s.trade = p;
  keep(s);
}

/** How the server says the trade ended, into the save: done, settled into the hero; else let go. True if settled. */
export function endTrade(s: Save, id: string, state: TradeState, keep: (s: Save) => void): boolean {
  const p = s.trade;
  if (!p || p.id !== id || state === 'wait') return false;
  delete s.trade;
  const hero = state === 'done' ? s.heroes.find((h) => h.id === p.me) : undefined;
  if (hero) settle(hero, p, bagSize(hero));
  keep(s);
  return !!hero;
}

/** One trade left in the save by a page that closed: how did it end? Offline, it waits for the next load. */
export async function resolveTrade(get: () => Save, keep: (s: Save) => void): Promise<boolean> {
  const p = get().trade;
  if (!p) return false;
  const r = await ledgerCall({ ask: p.id });
  if (!r) return false;
  // The id under other terms isn't this trade (the other side changed it, and this ACCEPT never counted).
  let state = (r.terms === termsKey(p.t) ? r.state : 'none') as TradeState;
  // Still open, waiting on the other: called off, unless the other's ACCEPT lands first (then it's done).
  if (state === 'wait') {
    const w = await ledgerCall({ withdraw: p.id, hero: p.me });
    if (!w) return false;
    state = w.state as TradeState;
  }
  return endTrade(get(), p.id, state, keep);
}
