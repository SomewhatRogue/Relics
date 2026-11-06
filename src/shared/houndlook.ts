/**
 * Which hound a Ranger has (Kyle, 2026-11-05: "maybe let people choose which dog is theirs", "doesn't
 * affect stats"): a breed, a coat, a marking and a name, chosen with Maeve at the hunters' lodge.
 * Drawing only. The room's Hound (sim/ranger.ts) never reads any of it: every breed runs, bites and
 * bolts the same, at the same size.
 *
 * Saved on the hero's profile (`Profile.hound`), copied to `Hero.houndLook`, and sent to friends once
 * with the hero's look: in the town's `me` word (townfolk.ts, packed small) and in a party's hero
 * (snap.ts sends a field only when it changes). Anything heard from outside goes through `fitHound`.
 */
import { isBad, plain } from './chatfilter.js';

export const BREEDS = ['wolfhound', 'lurcher', 'hillhound', 'collie'] as const;
export type BreedId = (typeof BREEDS)[number];
/** Coats a breed comes in (client/houndcoats.ts colours them; houndwords.ts names them). */
export const COATS: Record<BreedId, number> = { wolfhound: 3, lurcher: 3, hillhound: 3, collie: 3 };
/** White on a hound: none, a blaze down the face and chest, white socks, or both. */
export const MARKS = ['none', 'blaze', 'socks', 'both'] as const;
export type MarkId = (typeof MARKS)[number];

export interface HoundLook { breed: BreedId; coat: number; mark: MarkId; name: string }

/** A hound's name: short, letters and a space, an apostrophe or a hyphen (the pixel font has those). */
export const HOUND_NAME = { max: 10 } as const;

/**
 * Names a new hound is given until its Ranger picks one: short, old, plain dog names. None is a
 * Wickhold person's name (docs/lore/story-bible.md) or anything from the books Relic keeps clear of.
 */
export const AUTO_NAMES = ['BRAN', 'FLY', 'MOSS', 'JESS', 'BRACKEN', 'RUSS', 'SORREL', 'MEG', 'TESS', 'SLOE', 'CORRIE', 'TIPPER'] as const;
/**
 * Auto names given before the lore keeper's pass (2026-11-05), each at its place in the list: GYP comes
 * from a slur, FENN is too near Fenmere. A hound that still carries the one it was given then gets the
 * new one in its place; one its player typed (any other hero's id would have given something else) stays.
 */
const OLD_AUTO: Record<string, number> = { GYP: 7, FENN: 8 };

/**
 * Slurs against travellers, which chat lets by (shared/chatfilter.ts) but a hound's name, shown over it to
 * everyone, never carries. Read as chat reads a word (`plain`). Not "pike": that's Watchman Pike.
 */
const NOT_NAMES: RegExp[] = [/^g+[iy]+p+s*$/, /^g+[iy]+p+[oe]+s*$/, /^g+[iy]+p+s+[iy]+e*s*$/, /^p+i+k+e+y+s*$/];
const badName = (w: string) => isBad(w) || NOT_NAMES.some((r) => r.test(plain(w)));

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** The name a hero's hound has until they choose one (the same every time for that hero). */
export const autoName = (seed: string) => AUTO_NAMES[hash(seed) % AUTO_NAMES.length];

/**
 * The hound a new Ranger comes with: the rough grey wolfhound of the story bible (bred at Maeve's
 * lodge and sold out of it as a pup), no white on it, and an auto name.
 */
export const defaultHound = (seed: string): HoundLook => ({ breed: 'wolfhound', coat: 0, mark: 'none', name: autoName(seed) });

/** A typed name as a hound's name: capitals, the font's few marks, spaces closed up, at most 10. */
export function tidyName(s: string): string {
  return String(s ?? '').toUpperCase().replace(/[^A-Z '-]/g, '').replace(/\s+/g, ' ').trim().slice(0, HOUND_NAME.max).trim();
}

/** Why a name won't do ('' if it will): empty, or the chat filter's swearing and slurs (chatfilter.ts). */
export function nameTrouble(s: string): '' | 'empty' | 'rude' {
  const t = tidyName(s);
  if (!t.replace(/[ '-]/g, '')) return 'empty';
  // Word by word as chat reads it, and the letters run together (a name split up to slip past).
  return t.split(/[\s'-]+/).some(badName) || badName(t.replace(/[^A-Z]/g, '')) ? 'rude' : '';
}

/** A name to keep: tidied, or the auto name if it's empty or rude. */
export const houndName = (s: string, seed: string) => (nameTrouble(s) ? autoName(seed) : tidyName(s));

/** Anything (an old save, a word off the relay) as a hound to draw: what's sound is kept, the rest defaulted. */
export function fitHound(x: unknown, seed: string): HoundLook {
  const d = defaultHound(seed), o = x && typeof x === 'object' ? (x as Partial<HoundLook>) : {};
  const breed = BREEDS.includes(o.breed as BreedId) ? (o.breed as BreedId) : d.breed;
  const coat = Number.isInteger(o.coat) && (o.coat as number) >= 0 && (o.coat as number) < COATS[breed] ? (o.coat as number) : 0;
  const mark = MARKS.includes(o.mark as MarkId) ? (o.mark as MarkId) : d.mark;
  const auto = typeof o.name === 'string' && OLD_AUTO[o.name] !== undefined && hash(seed) % AUTO_NAMES.length === OLD_AUTO[o.name];
  return { breed, coat, mark, name: typeof o.name === 'string' && !auto ? houndName(o.name, seed) : d.name };
}

/** Small for the town's word: [breed, coat, mark, name] by index. */
export type PackedHound = [number, number, number, string];
export const packHound = (h: HoundLook): PackedHound => [BREEDS.indexOf(h.breed), h.coat, MARKS.indexOf(h.mark), h.name];
export function unpackHound(p: unknown, seed: string): HoundLook | undefined {
  if (!Array.isArray(p) || p.length !== 4) return undefined;
  const [b, c, m, n] = p;
  return fitHound({ breed: BREEDS[b as number], coat: c, mark: MARKS[m as number], name: n }, seed);
}

export const sameHound = (a?: HoundLook, b?: HoundLook) => !!a && !!b && a.breed === b.breed && a.coat === b.coat && a.mark === b.mark && a.name === b.name;
