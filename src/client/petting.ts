/**
 * Petting a hound (Kyle, 2026-11-05 and 2026-11-06: "hunter should be able to pet their hound
 * whenever"). A Ranger can pet their own wherever it's at heel and in reach: Wickhold, its halls, the
 * yard, a job, an expedition (game.ts `near`, petwhen.ts says when). Anyone can pet Maeve's, who lies by
 * the lodge's fire. The hero kneels, the hound comes in and reacts; hearts float up. Again soon after,
 * it reacts another way: leans in and wags, rolls over for a belly rub, then up with a play bow and a
 * hop to lick their face. Cosmetic only: the room never hears of it. Others see it from one word when
 * it starts (petword.ts), never from anything per frame.
 */
import { WEAPONS } from '../shared/tuning';
import type { Hero, Hound } from '../sim/types';
import type { HoundLook } from '../shared/houndlook';

/** The lodge's own hound, lying by the fire (tiles in the lodge: shared/townhalls.ts). */
export const LODGE_DOG = { x: 9.5, y: 2.25 };
/** How long the first sort of pet lasts, the wait after one before the next, and how soon "again" is (s). */
export const PET = { time: 2.6, wait: 1, again: 6 };
/** The ways a hound takes it, in turn when petted again soon: leaning in, a belly rub, paws up and a lick. */
export const REACTS = ['lean', 'belly', 'lick'] as const;
export type React = (typeof REACTS)[number];
/** How long each lasts (s). */
export const REACT_TIME: Record<React, number> = { lean: PET.time, belly: 3.4, lick: 3 };
export type Dog = 'own' | 'lodge';

/** A spot to USE: which hound, and where it is. */
export interface PetSpot { pet: Dog; x: number; y: number; label: string; /** Added to its reach. */ reach: number; /** Only if there's nothing else to use here (your own, always at heel, gives way to anyone you walk up to). */ last?: boolean }

/** Whether this hall is the hunters' lodge (by the door it was entered by). */
export const inLodge = (door: string | null | undefined) => door === 'lodge';

/** The hounds to pet where the hero stands: Maeve's in the lodge; a Ranger's own wherever `own` says it can be. */
export function petSpots(door: string | null | undefined, h: Hero, own = true): PetSpot[] {
  const out: PetSpot[] = inLodge(door) ? [{ pet: 'lodge', x: LODGE_DOG.x, y: LODGE_DOG.y, label: "PET MAEVE'S HOUND", reach: 0 }] : [];
  const d = h.hound;
  if (own && WEAPONS[h.weapon].cls === 'RANGER' && !h.noHound && d && d.state === 'heel' && !d.down) out.push({ pet: 'own', x: d.x, y: d.y, label: 'PET YOUR HOUND', reach: 0.4, last: true });
  return out;
}

interface Petting { dog: Dog; at: number; hx: number; hy: number; fx: number; fy: number; r: number; /** A look sheet's: no facing to keep. */ sheet?: boolean }
const pets = new Map<string, Petting>();
/** When each hero may pet again, and their last one (which way it went, when it ended). */
const done = new Map<string, number>();
const last = new Map<string, { r: number; end: number }>();

/** The reaction a pet started at `now` gets: the next in turn if the last ended within `PET.again`, else the first. */
function nextReact(id: string, now: number): number {
  const l = last.get(id);
  return l && now - l.end < PET.again ? (l.r + 1) % REACTS.length : 0;
}

/**
 * Start a pet: false while one is going or in its short wait. `r`: the reaction (a friend's word
 * says which: petword.ts); left out, the next in turn. A friend's is taken as said, never waited.
 */
export function startPet(h: Hero, dog: Dog, now: number, r?: number): boolean {
  const p = pets.get(h.id), told = r !== undefined;
  if (!told && ((p && now - p.at < durOf(p.r)) || now < (done.get(h.id) ?? -9))) return false;
  // (A friend's word twice in a moment is one pet.)
  if (told && p && now - p.at < 0.5) return false;
  // (Your own press only while standing: a pet is never started on the move or mid-swing.)
  if (!told && (h.moving || h.act !== 'idle')) return false;
  const k = told ? Math.max(0, Math.min(REACTS.length - 1, Math.floor(r))) : nextReact(h.id, now);
  pets.set(h.id, { dog, at: now, hx: h.x, hy: h.y, fx: h.fx, fy: h.fy, r: k });
  done.set(h.id, now + durOf(k) + PET.wait);
  last.set(h.id, { r: k, end: now + durOf(k) });
  return true;
}

/** The reaction of this hero's pet going now (or last), for the word that tells the others. */
export const petReact = (id: string): number => pets.get(id)?.r ?? last.get(id)?.r ?? 0;

/** Any input from this player: their pet stops at once (main.ts, with the idles' poke). */
export function stopPet(id: string, now: number): void {
  if (!pets.delete(id)) return;
  const l = last.get(id);
  if (l) l.end = Math.min(l.end, now);
}

/** A look sheet's pet (heroart.ts): started at `at`, or none. */
export function showPet(id: string, dog: Dog | null, at = 0, hx = 0, hy = 0, r = 0): void {
  if (dog) pets.set(id, { dog, at, hx, hy, fx: 1, fy: 0, r, sheet: true });
  else pets.delete(id);
}

const durOf = (r: number) => REACT_TIME[REACTS[r] ?? 'lean'];

/** The pet going on for this hero now: which hound, how far in (s), how it reacts and for how long; null once it's over or they moved. */
export function petFrame(h: Hero, now: number): { dog: Dog; t: number; r: React; dur: number } | null {
  const p = pets.get(h.id);
  if (!p) return null;
  // (The drawing's clock is the frame's, a hair behind the press that started it: a pet a moment early is at its start.)
  const raw = now - p.at, t = Math.max(0, raw), dur = durOf(p.r);
  // (A friend's copy of a hero settles by a hair as the leader's word comes in: only a real turn or step ends it.)
  const turned = !p.sheet && (Math.abs(h.fx - p.fx) > 0.5 || Math.abs(h.fy - p.fy) > 0.5);
  if (t >= dur || raw < -0.25 || h.moving || h.act !== 'idle' || h.blocking || turned || Math.hypot(h.x - p.hx, h.y - p.hy) > 0.25) return void pets.delete(h.id), null;
  return { dog: p.dog, t, r: REACTS[p.r], dur };
}

/** Whoever's petting this hound now (the lodge's: anyone here; your own: you). */
export function pettedBy(heroes: readonly Hero[], dog: Dog, owner: Hero | null, now: number): { h: Hero; t: number; r: React; dur: number } | null {
  for (const h of owner ? [owner] : heroes) {
    const f = petFrame(h, now);
    if (f && f.dog === dog) return { h, t: f.t, r: f.r, dur: f.dur };
  }
  return null;
}

/** The lodge's hound as the drawing wants it (lying by the fire unless it's being petted). */
export const LODGE_HOUND: Hound = { x: LODGE_DOG.x, y: LODGE_DOG.y, fx: -1, fy: 0, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: false, down: true };

/** Maeve's own: one of her rough wolfhounds, brindled, a white blaze; unnamed (docs/lore/story-bible.md). */
export const MAEVE_HOUND: HoundLook = { breed: 'wolfhound', coat: 2, mark: 'blaze', name: '' };

/** The lodge's inside (by its name: the drawing has the map, not the door). */
export const isLodgeMap = (m: { name: string }) => m.name === "THE HUNTERS' LODGE";
