/**
 * The party you're in while in town, kept in this browser, so a reload (or a phone that killed the
 * page) comes back to it: the one you lead (and its whole job), or whose you joined. Good for the
 * party's grace only; after that the others have let you go.
 */
import type { Job } from '../shared/jobs';
import { PARTY_GRACE, type Offer } from '../shared/lobby';

export interface Kept { hero: string; at: number; mine?: Offer; job?: Job; joined?: string }
const KEY = 'relic-party';

export function keepParty(k: Omit<Kept, 'at'> | null): void {
  try {
    if (!k || (!k.mine && !k.joined)) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify({ ...k, at: Date.now() }));
  } catch { /* private window: a reload starts you over */ }
}

/** Still fresh, and this hero's? */
export function keptParty(hero: string): Kept | null {
  try {
    const k = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Kept | null;
    return k && k.hero === hero && Date.now() - k.at < PARTY_GRACE * 1000 ? k : null;
  } catch {
    return null;
  }
}
