/**
 * A pet, as the others hear of it (petting.ts): one small word when it starts, `{ k: 'pet', d, r, n }`
 * (which hound, how it takes it, the petter's name), over a room already open: the town's peer room
 * in Wickhold, the party's chat room on a job (chat.ts). Nothing per frame: each screen draws the pet
 * from there, and it ends there the way it ends here (a step, a turn, a blow: petFrame). Sent only with
 * someone there to see it, and a pet comes at most every few seconds (PET.wait).
 */
import { REACTS, type Dog } from './petting';

export interface PetWord { k: 'pet'; d: Dog; r: number; n: string }

export const petWord = (d: Dog, r: number, name: string): PetWord => ({ k: 'pet', d, r, n: name.slice(0, 14) });

/** A word heard: the pet in it, or null if it isn't one (or isn't sound). */
export function readPet(w: unknown): PetWord | null {
  const o = w as Partial<PetWord> | null;
  if (!o || typeof o !== 'object' || o.k !== 'pet' || (o.d !== 'own' && o.d !== 'lodge')) return null;
  const r = typeof o.r === 'number' && Number.isInteger(o.r) && o.r >= 0 && o.r < REACTS.length ? o.r : 0;
  return { k: 'pet', d: o.d, r, n: typeof o.n === 'string' ? o.n.slice(0, 14) : '' };
}
