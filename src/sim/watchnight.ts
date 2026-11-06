/**
 * Who comes over the fields and when, and the night they come through: goblins bled in over the
 * three minutes (each new kind as soon as it's due, then mixed in by weight), cloud over the moon, and
 * fog banks drifting in. All from the shift's own seed.
 */
import type { Rng } from '../shared/rng';
import { FOES, GOBS, NIGHT, SIDE, WATCH, type FieldName, type GobKind } from '../shared/watchtune';
import { DEEP } from '../shared/deeptune';
import type { Cloud, FogBank, Gob, WatchState } from './watchtypes';

const KINDS = Object.keys(GOBS) as GobKind[];

/** A goblin of `kind` coming in: side-on at the field's left edge on a lane; upright, at the far edge somewhere across, running for a spot on the wall. */
export function newGob(s: WatchState, kind: GobKind, x = s.field === 'deep' ? 0 : SIDE.from + WATCH.spawnX, lane = s.field === 'deep' ? 0 : s.rng.range(0, FOES.lane)): Gob {
  const d = GOBS[kind], deep = s.field === 'deep';
  const u0 = deep ? s.rng.range(-DEEP.spawnU, DEEP.spawnU) : 0, u1 = deep ? s.rng.range(-DEEP.wallU, DEEP.wallU) : 0;
  const zig = deep && kind === 'runner' ? 1 + s.rng.range(0, 5) : 0;
  return {
    id: s.nextId++, kind, x, u0, u1, zig, lane: Math.round(lane), hp: d.hp, walked: 0, limp: false, helmet: kind === 'helmet',
    shieldHp: kind === 'shield' ? FOES.shieldHits : 0, torch: kind === 'torch', burning: -1, state: 'walk', at: s.t,
    stopX: kind !== 'archer' ? Infinity : deep ? DEEP.far - s.rng.range(...DEEP.archerStop) : s.rng.range(...SIDE.archerStop), shots: 0, nextShot: 0, stuck: [],
  };
}

/** The kind of the next goblin: a kind not met yet as soon as it's due, else any due one by weight. */
export function nextKind(s: WatchState): GobKind {
  const due = KINDS.filter((k) => GOBS[k].from <= s.t);
  const fresh = due.find((k) => !s.met.includes(k));
  if (fresh) return s.met.push(fresh), fresh;
  const total = due.reduce((n, k) => n + GOBS[k].weight, 0);
  let r = s.rng.next() * total;
  for (const k of due) if ((r -= GOBS[k].weight) < 0) return k;
  return 'plain';
}

/** Bring on the next goblin when it's time (and none in the last few seconds). */
export function spawnDue(s: WatchState): void {
  if (s.t < s.nextSpawn || s.t > WATCH.duration - FOES.lastCall) return;
  s.gobs.push(newGob(s, nextKind(s)));
  const k = s.t / WATCH.duration, gap = FOES.gapStart + (FOES.gapEnd - FOES.gapStart) * k;
  s.nextSpawn = s.t + gap * s.rng.range(1 - FOES.jitter, 1 + FOES.jitter);
}

/** The night's clouds and fog, rolled once at the start. */
export function rollNight(rng: Rng, field: FieldName = 'wide'): { clouds: Cloud[]; fogs: FogBank[] } {
  const span = WATCH.duration / NIGHT.clouds, clouds: Cloud[] = [];
  for (let i = 0; i < NIGHT.clouds; i++) clouds.push({ at: span * i + rng.range(span * 0.2, span * 0.6), len: rng.range(...NIGHT.cloudLen) });
  const fogs = NIGHT.fogs.map((at) => {
    // Upright, a bank is metres deep and rolls in from out past the far edge (deepFogAt).
    if (field === 'deep') return { at, w: rng.range(...DEEP.fogDeep), x0: DEEP.fogFrom, v: rng.range(...DEEP.fogSpeed) };
    const w = rng.range(...NIGHT.fogWide);
    return { at, w, x0: SIDE.from - w - 20, v: rng.range(...NIGHT.fogSpeed) };
  });
  return { clouds, fogs };
}

const ease = (k: number) => k * k * (3 - 2 * k);
/** How much of the moon is behind cloud at `t` (0 clear, 1 covered). */
export function cover(clouds: Cloud[], t: number): number {
  let c = 0;
  for (const p of clouds) {
    const into = t - p.at, out = p.at + p.len - t;
    if (into <= 0 || out <= 0) continue;
    c = Math.max(c, ease(Math.min(1, into / NIGHT.ramp, out / NIGHT.ramp)));
  }
  return c;
}

/** The moon's light at `t` (1 full, down to 1 - NIGHT.dark behind cloud). */
export const moonlight = (clouds: Cloud[], t: number) => 1 - NIGHT.dark * cover(clouds, t);

/** A fog bank's left edge at `t` (it drifts in from the fields toward the wall). */
export const fogX = (f: FogBank, t: number) => f.x0 + f.v * Math.max(0, t - f.at);

/** How thick the fog is at a spot (0 clear .. NIGHT.fogThick): thickest mid-bank and low down. */
export function fogAt(fogs: FogBank[], t: number, x: number, up: number): number {
  if (up > NIGHT.fogHigh || up < -4) return 0;
  let f = 0;
  for (const b of fogs) {
    if (t < b.at) continue;
    const k = (x - fogX(b, t)) / b.w;
    if (k <= 0 || k >= 1) continue;
    f = Math.max(f, Math.sin(k * Math.PI));
  }
  return f * NIGHT.fogThick * (1 - Math.max(0, up) / NIGHT.fogHigh);
}

/** Upright: how thick the fog is `d` metres out and `up` metres up (banks rolling in, and the dark far off). */
export function deepFogAt(fogs: FogBank[], t: number, d: number, up: number): number {
  let f = Math.max(0, Math.min(1, (d - DEEP.clear) / (DEEP.far - DEEP.clear))) * DEEP.thick;
  if (up > DEEP.fogHigh) return f;
  for (const b of fogs) {
    if (t < b.at) continue;
    const near = b.x0 - b.v * (t - b.at), k = (d - near) / b.w;
    if (k > 0 && k < 1) f = Math.max(f, Math.sin(k * Math.PI) * NIGHT.fogThick * (1 - Math.max(0, up) / DEEP.fogHigh));
  }
  return f;
}
