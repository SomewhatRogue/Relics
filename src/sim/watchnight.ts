/**
 * Who comes over the fields and when, and the night they come through: goblins bled in over the
 * three minutes (each new kind as soon as it's due, then mixed in by weight), cloud over the moon, and
 * fog banks drifting in. All from the shift's own seed.
 */
import type { Rng } from '../shared/rng';
import { FIELDS, FOES, GOBS, NIGHT, WATCH, type FieldName, type GobKind } from '../shared/watchtune';
import type { Cloud, FogBank, Gob, WatchState } from './watchtypes';

const KINDS = Object.keys(GOBS) as GobKind[];

export function newGob(s: WatchState, kind: GobKind, x = FIELDS[s.field].from + WATCH.spawnX, lane = s.rng.range(0, FOES.lane)): Gob {
  const d = GOBS[kind];
  return {
    id: s.nextId++, kind, f: s.field, x, lane: Math.round(lane), hp: d.hp, walked: 0, limp: false, helmet: kind === 'helmet',
    shieldHp: kind === 'shield' ? FOES.shieldHits : 0, torch: kind === 'torch', burning: -1, state: 'walk', at: s.t,
    stopX: kind === 'archer' ? s.rng.range(...FIELDS[s.field].archerStop) : Infinity, shots: 0, nextShot: 0, stuck: [],
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
    const w = rng.range(...NIGHT.fogWide);
    return { at, w, x0: FIELDS[field].from - w - 20, v: rng.range(...NIGHT.fogSpeed) };
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
