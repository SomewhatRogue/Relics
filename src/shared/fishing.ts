/**
 * The rules of fishing at the millpond, pure and seeded, run only in the player's own browser
 * (client/fishmode.ts). One button: hold to swing the cast meter and let go to cast; wait for the
 * bite (the float twitches with nibbles first, and striking on a nibble is too soon); tap when the
 * float goes under; then hold to reel and let go when the fish runs, keeping the line's tension
 * between slack (it throws the hook) and snapping.
 *
 * Each cast is its own seed, made from the hero and how many casts they've made (the count is saved
 * as the cast goes out), so a refresh can't roll the fish again: the next cast is simply the next one.
 * Everything about the fish (kind, size, when it bites, when it runs) is drawn when the cast lands.
 */
import { Rng } from './rng.js';
import { FISH, SPECIES, speciesOf, type FishId, type Species } from './fishtune.js';

export type FishPhase = 'ready' | 'aim' | 'fly' | 'wait' | 'bite' | 'reel' | 'landed' | 'lost';
/** Why a fish got away. */
export type LostWhy = 'early' | 'missed' | 'snapped' | 'thrown';

/** The fish on the end of this cast (drawn the moment it lands). */
export interface Hooked { sp: FishId; oz: number; pull: number; fight: number }

export interface FishState {
  phase: FishPhase;
  /** Seconds in this phase. */
  t: number;
  /** The cast meter (0 to 1) while aiming, and how far the last cast went. */
  meter: number;
  reach: number;
  seed: number;
  rng: Rng;
  fish: Hooked | null;
  /** When it bites (s into the wait), and the nibbles before it (start times). */
  biteAt: number;
  nibbles: number[];
  /** Reeling: metres out, tension, how long it's been slack, running now, the warning before a run, and when the next change comes. */
  dist: number;
  tension: number;
  slackT: number;
  running: boolean;
  tell: boolean;
  nextAt: number;
  /** Seconds since the fight began. */
  fightT: number;
  why: LostWhy | null;
  /** Presses seen so far (a tap is never lost between frames). */
  seen: number;
}
/** What the player does: holding the button, and how many presses so far. */
export interface FishInput { held: boolean; presses: number }

export function newFishing(): FishState {
  return { phase: 'ready', t: 0, meter: 0, reach: 0, seed: 0, rng: new Rng(1), fish: null, biteAt: 0, nibbles: [], dist: 0, tension: 0, slackT: 0, running: false, tell: false, nextAt: 0, fightT: 0, why: null, seen: 0 };
}

/** The seed of a hero's `n`th cast (or round: shared/range.ts uses the same). */
export function seedOf(id: string, n: number): number {
  let x = 2166136261;
  const s = `${id}:${n}`;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return x >>> 0 || 1;
}

/** Which fish takes a cast of `reach` (0 by the bank, 1 far out): `a` and `b` are two rolls in [0, 1). */
export function rollFish(reach: number, a: number, b: number): Hooked {
  const w = SPECIES.map((s) => s.often * Math.max(0.03, 1 - Math.abs(reach - s.deep) * 1.6) ** 2);
  let r = a * w.reduce((n, x) => n + x, 0), sp: Species = SPECIES[SPECIES.length - 1];
  for (let i = 0; i < SPECIES.length; i++) if ((r -= w[i]) < 0) { sp = SPECIES[i]; break; }
  // Small ones are common, big ones rare.
  const k = b ** 1.8, oz = Math.round(sp.min + (sp.max - sp.min) * k);
  return { sp: sp.id, oz, pull: sp.pull * (0.7 + 0.6 * k), fight: sp.fight };
}

/** The meter at `t` seconds held: up and back down, over and over. */
export const meterAt = (t: number) => {
  const k = (t / FISH.swing) % 1;
  return k < 0.5 ? k * 2 : 2 - k * 2;
};

/** The float is twitching with a nibble now (in the wait). */
export const nibbling = (s: FishState) => s.phase === 'wait' && s.nibbles.some((n) => s.t >= n && s.t < n + FISH.nibble);

const go = (s: FishState, phase: FishPhase): void => void ((s.phase = phase), (s.t = 0));
const lose = (s: FishState, why: LostWhy): void => void ((s.why = why), go(s, 'lost'));

/**
 * The cast goes out: `seed` is this cast's own (seedOf the hero and their cast count). Everything about
 * the fish is drawn now.
 */
export function cast(s: FishState, reach: number, seed: number): void {
  const r = new Rng(seed);
  s.seed = seed;
  s.rng = r;
  s.reach = Math.max(0, Math.min(1, reach));
  s.fish = rollFish(s.reach, r.next(), r.next());
  s.biteAt = r.range(FISH.wait[0], FISH.wait[1]) + FISH.waitFar * s.reach;
  const n = r.int(FISH.nibbles + 1);
  s.nibbles = Array.from({ length: n }, () => r.range(0.8, Math.max(0.9, s.biteAt - 0.6))).sort((a, b) => a - b);
  s.why = null;
  go(s, 'fly');
}

/** Hold to aim, let go to cast; `castSeed` is asked for the seed only when the cast actually goes. */
export function stepFish(s: FishState, inp: FishInput, dt: number, castSeed: () => number): void {
  const pressed = inp.presses > s.seen;
  s.seen = inp.presses;
  s.t += dt;
  switch (s.phase) {
    case 'ready':
    case 'landed':
    case 'lost':
      // (A fresh press starts the meter; a finger still down from the strike doesn't.)
      if (pressed && inp.held) go(s, 'aim'), (s.meter = 0);
      return;
    case 'aim':
      // Let go: it goes as far as the meter showed when you let go.
      if (!inp.held) return cast(s, s.meter, castSeed());
      s.meter = meterAt(s.t);
      return;
    case 'fly':
      if (s.t >= FISH.fly) go(s, 'wait');
      return;
    case 'wait':
      // Struck before it's taken: too soon, it's off.
      if (pressed) return lose(s, 'early');
      if (s.t >= s.biteAt) go(s, 'bite');
      return;
    case 'bite':
      if (pressed) return startFight(s);
      if (s.t >= FISH.window) lose(s, 'missed');
      return;
    case 'reel':
      return reel(s, inp.held, dt);
  }
}

function startFight(s: FishState): void {
  go(s, 'reel');
  s.dist = FISH.dist + FISH.distFar * s.reach;
  s.tension = FISH.hold;
  s.slackT = 0;
  s.running = false;
  s.tell = false;
  s.fightT = 0;
  // A moment's rest first, so you can settle your thumb.
  s.nextAt = 1;
}

/** The fight: runs and rests on the fish's own clock, tension moving toward where it's being pulled. */
function reel(s: FishState, held: boolean, dt: number): void {
  const f = s.fish!, r = s.rng;
  s.fightT += dt;
  // The fish's clock: rest, a warning, run, rest...
  if (s.fightT >= s.nextAt) {
    s.running = !s.running;
    s.nextAt = s.fightT + (s.running ? r.range(FISH.runFor[0], FISH.runFor[1]) * (0.6 + f.fight) : r.range(FISH.rest[0], FISH.rest[1]) * (1 - f.fight * 0.4));
  }
  s.tell = !s.running && s.nextAt - s.fightT < FISH.tell;
  const to = (held ? FISH.hold : FISH.slack) + (s.running ? f.pull * FISH.run : 0), d = to - s.tension;
  s.tension += Math.sign(d) * Math.min(Math.abs(d), FISH.rate * dt);
  if (s.tension >= FISH.snap) return lose(s, 'snapped');
  if (held) s.dist -= FISH.reel * (s.running ? FISH.reelRun : 1) * dt;
  else if (s.running) s.dist = Math.min(FISH.dist + FISH.distFar + 4, s.dist + FISH.take * f.pull * dt);
  s.slackT = s.tension < FISH.loose ? s.slackT + dt : 0;
  if (s.slackT >= FISH.throw) return lose(s, 'thrown');
  if (s.dist <= 0) (s.dist = 0), go(s, 'landed');
}

/** A hero's fishing: casts made (seeds the next), fish landed, the biggest of each kind, and the biggest of all. */
export interface FishRecord { casts: number; caught: number; bests: Partial<Record<FishId, number>>; best?: { sp: FishId; oz: number } }
export const newFishRecord = (): FishRecord => ({ casts: 0, caught: 0, bests: {} });

/** A landed fish onto the record: whether it's the biggest of its kind, the biggest ever, or the first of its kind. */
export function recordCatch(r: FishRecord, sp: FishId, oz: number): { kind: boolean; ever: boolean; first: boolean } {
  const was = r.bests[sp], first = was === undefined, kind = !first && oz > was!, ever = !r.best || oz > r.best.oz;
  r.caught++;
  if (first || oz > was!) r.bests[sp] = oz;
  if (ever) r.best = { sp, oz };
  return { kind, ever, first };
}

/** A record from a save, made sound (anything odd is dropped). */
export function fitFishRecord(raw: unknown): FishRecord {
  const r = (raw ?? {}) as Partial<FishRecord>, out = newFishRecord();
  const n = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);
  out.casts = n(r.casts, 1e9);
  out.caught = n(r.caught, 1e9);
  for (const s of SPECIES) {
    const oz = n(r.bests?.[s.id], s.max);
    if (oz) out.bests[s.id] = oz;
  }
  for (const [id, oz] of Object.entries(out.bests)) if (!out.best || oz! > out.best.oz) out.best = { sp: id as FishId, oz: oz! };
  return out;
}

export { speciesOf };
