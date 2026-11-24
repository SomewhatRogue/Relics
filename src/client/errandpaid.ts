/**
 * A small quest's pay, shown (shared/errandpay.ts; Kyle, 2026-11-24): QUEST DONE and the coin, in a toast; the
 * trainer's gift as NEW WEAPON and its name. Approved words only (questwords.ts, errandwords.ts).
 */
import { coins } from '../shared/coins';
import { itemName, type Item } from '../shared/loot';
import { ERRANDW } from './errandwords';
import { toast } from './partytoast';
import { QUESTW } from './questwords';

/** QUEST DONE: 20c. Nothing for nothing paid. */
export function paidToast(n: number): void {
  if (n > 0) toast(`${QUESTW.done}: ${coins(n)}`, { kind: 'quest' });
}

/** NEW WEAPON: its name. */
export function giftToast(it: Item | null): void {
  if (it) toast(`${ERRANDW.gift}: ${itemName(it)}`, { kind: 'quest' });
}
