/**
 * What a hound does by itself, as each screen sees it (drawing only; the room's hound is untouched):
 * how fast it's going, for its gait (a walk beside someone creeping, a trot at heel, a run when it goes
 * in), and, stood at heel a few seconds with nothing else on, its own idles: nose down working the
 * ground, a hind foot at an ear, a shake from nose to tail, or lying down with its head on its paws
 * (and up now and then) until its Ranger moves off. A hero's idle with it (fetch, a ruffle, the tackle)
 * or a pet takes it over (idlehound.ts) and the wait starts again after.
 */
import type { Hound } from '../sim/types';
import type { Gait, PoseName } from './houndposes';

export type OwnIdle = 'sniff' | 'scratch' | 'shake' | 'lie';
/** Still this long (s) before the first, then one every `gap` s start to start; how long each lasts. */
export const OWN = { settle: [3, 5], gap: [5, 9], dur: { sniff: 2.4, scratch: 1.8, shake: 1.2, lie: Infinity } as Record<OwnIdle, number>, weights: { sniff: 3, scratch: 2, shake: 1, lie: 2 } as Record<OwnIdle, number> } as const;
/** Tiles a second: under `walk` it walks, under `trot` it trots, past that it runs. */
export const PACE = { walk: 2.8, trot: 5.4 } as const;

/** About a hero's pace: what a hound already moving is taken to be doing until it's been watched a moment. */
const HEEL = 4.4;

interface Track { x: number; y: number; t: number; v: number; still: number; next: number; n: number; idle: OwnIdle | null; at: number }
const tracks = new WeakMap<object, Track>();

const roll = (seed: number, n: number) => {
  let h = Math.imul(seed ^ (n * 2654435761), 1597334677) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  return (h % 10000) / 10000;
};
const between = ([a, b]: readonly number[], k: number) => a + (b - a) * k;

function pick(k: number): OwnIdle {
  const all = Object.entries(OWN.weights) as [OwnIdle, number][], sum = all.reduce((s, [, w]) => s + w, 0);
  let r = k * sum;
  for (const [id, w] of all) if ((r -= w) < 0) return id;
  return 'sniff';
}

/** A hound's own seed, from its Ranger's id (so a party's hounds never idle in step). */
export const seedOf = (id: string) => [...id].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261) % 100000;

/** The gait for a speed in tiles a second. */
export const gaitFor = (v: number): Gait => (v < PACE.walk ? 'walk' : v < PACE.trot ? 'trot' : 'run');

/** This hound's speed (tiles a second, smoothed over a few frames) and its own idle, if one's on. */
export function houndSelf(d: Hound, now: number, seed: number): { v: number; idle: { id: OwnIdle; t: number } | null } {
  let k = tracks.get(d);
  if (!k) tracks.set(d, (k = { x: d.x, y: d.y, t: now, v: d.moving ? HEEL : 0, still: now, next: now + between(OWN.settle, roll(seed, 0)), n: 1, idle: null, at: 0 }));
  const dt = now - k.t;
  if (dt > 1 || dt < 0) Object.assign(k, { x: d.x, y: d.y, t: now });
  else if (dt >= 0.1) {
    const v = Math.hypot(d.x - k.x, d.y - k.y) / dt;
    Object.assign(k, { v: k.v * 0.5 + v * 0.5, x: d.x, y: d.y, t: now });
  }
  // On the move, off after something, scared, or lying across you: no idle, and the wait starts over.
  if (d.moving || d.state !== 'heel' || d.down) return busy(k, now, seed), { v: d.moving ? Math.max(k.v, 1) : 0, idle: null };
  if (k.idle && now - k.at >= OWN.dur[k.idle]) k.idle = null;
  if (!k.idle && now >= k.next) {
    k.idle = pick(roll(seed, k.n++));
    k.at = now;
    k.next = now + between(OWN.gap, roll(seed, k.n++));
  }
  return { v: 0, idle: k.idle ? { id: k.idle, t: now - k.at } : null };
}

/** Taken over (playing with its Ranger, being petted): its own idle stops and the wait starts again. */
export function houndBusy(d: Hound, now: number, seed: number): void {
  const k = tracks.get(d);
  if (k) busy(k, now, seed);
}

function busy(k: Track, now: number, seed: number): void {
  k.idle = null;
  k.still = now;
  k.next = now + between(OWN.settle, roll(seed, k.n++));
}

/** Its own idle as a pose and frame: sniffing works along, scratching kicks, a shake runs through, lying lifts its head now and then. */
export function ownPose(id: OwnIdle, t: number): [PoseName, number] {
  if (id === 'sniff') return ['sniff', Math.floor(t * 3)];
  if (id === 'scratch') return t < 0.25 || t > OWN.dur.scratch - 0.2 ? ['sit', 0] : ['scratch', Math.floor(t * 12)];
  if (id === 'shake') return ['shake', t > OWN.dur.shake - 0.3 ? 2 : Math.floor(t * 10) % 2];
  return [t > 0.6 && Math.floor(t / 3) % 3 === 2 ? 'downUp' : 'down', 0];
}

