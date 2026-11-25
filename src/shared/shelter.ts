/** What the keeper at a way station sells (client/shelterui.ts, sim/pack.ts GEAR.buy). A relic's refill is the church's price (shared/church.ts rechargeCost). */
import { POTIONS } from './potions.js';

/** `charcoal`: a sack at THE CHARCOAL HUT only, for Old Merren's fire edge (Kyle, 2026-11-24). */
export const SHELTER = { bitter: POTIONS.bitter.price, charcoal: 40 };
/** The one station that sells it. */
export const COAL_STATION = 'THE CHARCOAL HUT';
