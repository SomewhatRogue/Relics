/**
 * Petting a hound in the hunters' lodge (Kyle, 2026-11-05): walk up to it and USE it (E on a laptop).
 * A Ranger can pet their own; anyone can pet Maeve's, who lies by the lodge's fire (her trainer line
 * says she has a dog "with better manners waiting"). The hero kneels, the hound gets up if it was
 * lying, comes in to lean on them and wags; hearts float up. Cosmetic only and this screen's own:
 * nothing goes to the room or the relay. Repeatable after a short wait.
 */
import { WEAPONS } from '../shared/tuning';
import type { Hero, Hound } from '../sim/types';

/** The lodge's own hound, lying by the fire (tiles in the lodge: shared/townhalls.ts). */
export const LODGE_DOG = { x: 9.5, y: 2.25 };
/** How long a pet lasts, and the wait after one before the next (s). */
export const PET = { time: 2.6, wait: 1 };
export type Dog = 'own' | 'lodge';

/** A spot to USE: which hound, and where it is. */
export interface PetSpot { pet: Dog; x: number; y: number; label: string; /** Added to its reach. */ reach: number; /** Only if there's nothing else to use here (your own, always at heel, gives way to anyone you walk up to). */ last?: boolean }

/** Whether this hall is the hunters' lodge (by the door it was entered by). */
export const inLodge = (door: string | null | undefined) => door === 'lodge';

/** The hounds to pet where the hero stands: only in the lodge, their own (a Ranger's, at heel) and Maeve's. */
export function petSpots(door: string | null | undefined, h: Hero): PetSpot[] {
  if (!inLodge(door)) return [];
  const out: PetSpot[] = [{ pet: 'lodge', x: LODGE_DOG.x, y: LODGE_DOG.y, label: "PET MAEVE'S HOUND", reach: 0 }];
  const d = h.hound;
  if (WEAPONS[h.weapon].cls === 'RANGER' && d && d.state === 'heel' && !d.down) out.push({ pet: 'own', x: d.x, y: d.y, label: 'PET YOUR HOUND', reach: 0.4, last: true });
  return out;
}

interface Petting { dog: Dog; at: number; hx: number; hy: number }
const pets = new Map<string, Petting>();
const done = new Map<string, number>();

/** Start a pet (USE at a hound): false while one is going or in its short wait. */
export function startPet(h: Hero, dog: Dog, now: number): boolean {
  const p = pets.get(h.id);
  if ((p && now - p.at < PET.time) || now < (done.get(h.id) ?? -9)) return false;
  pets.set(h.id, { dog, at: now, hx: h.x, hy: h.y });
  done.set(h.id, now + PET.time + PET.wait);
  return true;
}

/** A look sheet's pet (heroart.ts): started at `at`, or none. */
export function showPet(id: string, dog: Dog | null, at = 0, hx = 0, hy = 0): void {
  if (dog) pets.set(id, { dog, at, hx, hy });
  else pets.delete(id);
}

/** The pet going on for this hero now: which hound and how far in (s); null once it's over or they moved. */
export function petFrame(h: Hero, now: number): { dog: Dog; t: number } | null {
  const p = pets.get(h.id);
  if (!p) return null;
  const t = now - p.at;
  if (t >= PET.time || t < 0 || h.moving || h.act !== 'idle' || h.blocking || Math.hypot(h.x - p.hx, h.y - p.hy) > 0.05) return void pets.delete(h.id), null;
  return { dog: p.dog, t };
}

/** Whoever's petting this hound now (the lodge's: anyone here; your own: you). */
export function pettedBy(heroes: readonly Hero[], dog: Dog, owner: Hero | null, now: number): { h: Hero; t: number } | null {
  for (const h of owner ? [owner] : heroes) {
    const f = petFrame(h, now);
    if (f && f.dog === dog) return { h, t: f.t };
  }
  return null;
}

/** The lodge's hound as the drawing wants it (lying by the fire unless it's being petted). */
export const LODGE_HOUND: Hound = { x: LODGE_DOG.x, y: LODGE_DOG.y, fx: -1, fy: 0, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: false, down: true };

/** The lodge's inside (by its name: the drawing has the map, not the door). */
export const isLodgeMap = (m: { name: string }) => m.name === "THE HUNTERS' LODGE";
