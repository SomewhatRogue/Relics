/**
 * Words for a full fall out on the land (docs/design/outside-the-gate.md; Kyle, 2026-11-25): carried back to Wickhold,
 * healed, and the fee. Awaiting the lore keeper's check.
 */
import { coins } from '../shared/coins';
import { toast } from './partytoast';

export const HEALW = {
  /** The fee, with the coin after it. */
  fee: 'INFIRMARY',
  /** Said once on arrival at the infirmary. */
  carried: 'You were carried home and healed.',
};

/** INFIRMARY: 3s 20c, then the line. Nothing taken: the line alone. */
export function healToast(fee: number): void {
  if (fee > 0) toast(`${HEALW.fee}: ${coins(fee)}`, { kind: 'quest' });
  toast(HEALW.carried, { kind: 'quest' });
}
