/**
 * Every pose a hound is drawn in, by name and frame (houndbody.ts paints them). Gaits are four frames
 * each, their legs worked out from where each foot is in its stride: a walk sets one foot down at a
 * time, a trot moves the diagonals together, a run gathers and stretches with all four off the ground.
 * Its own idles (houndidle.ts): sniffing the ground, scratching an ear, lying with its head on its
 * paws, shaking off. Petted (petting.ts): over on its back, legs going, for a belly rub. The fight's moves follow the room's hound (sim/ranger.ts): the lunge as it runs in,
 * the bite, and the latch when SEND THE HOUND pins (sim/sic.ts).
 */
import type { Pose } from './houndbody';

export const GAITS = ['walk', 'trot', 'run'] as const;
export type Gait = (typeof GAITS)[number];
export const IDLE_POSES = ['stand', 'sit', 'sniff', 'scratch', 'down', 'downUp', 'shake', 'belly'] as const;
export const FIGHT_POSES = ['lunge', 'bite', 'latch', 'bow', 'leap'] as const;
export type PoseName = Gait | (typeof IDLE_POSES)[number] | (typeof FIGHT_POSES)[number];

/** Frames a pose has (the drawing cycles them). */
export const FRAMES: Record<PoseName, number> = { walk: 4, trot: 4, run: 4, stand: 1, sit: 1, sniff: 2, scratch: 2, down: 1, downUp: 1, shake: 3, belly: 2, lunge: 2, bite: 2, latch: 2, bow: 1, leap: 1 };
/** Frames a second for each gait (the others step at their own pace in hound.ts). */
export const GAIT_FPS: Record<Gait, number> = { walk: 6, trot: 9, run: 13 };

/** A stride: how far a foot reaches (px), the share of it on the ground, each foot's place in it (near front, far front, near hind, far hind), and how high it lifts. */
const STRIDE: Record<Gait, { a: number; stance: number; phase: number[]; lift: number }> = {
  walk: { a: 1, stance: 0.7, phase: [0.25, 0.75, 0, 0.5], lift: 1 },
  trot: { a: 2, stance: 0.5, phase: [0, 0.5, 0.5, 0], lift: 1 },
  run: { a: 3, stance: 0.4, phase: [0.5, 0.6, 0, 0.1], lift: 2 },
};

function foot(g: Gait, i: number, f: number): [number, number] {
  const s = STRIDE[g], p = (f / 4 + s.phase[i]) % 1;
  if (p < s.stance) return [Math.round(s.a - (2 * s.a * p) / s.stance), 0];
  const q = (p - s.stance) / (1 - s.stance);
  return [Math.round(-s.a + 2 * s.a * q), Math.round(Math.sin(q * Math.PI) * s.lift)];
}

/** A gait's frame: the legs, a trot's bob, a run's reach and gather with a moment in the air. */
function gait(g: Gait, f: number, wag: number, tuck: boolean): Pose {
  const legs = [0, 1, 2, 3].map((i) => foot(g, i, f));
  const run = g === 'run';
  return {
    kind: 'stand', legs,
    lift: run ? [1, 0, 0, 1][f] : g === 'trot' ? f % 2 : 0,
    stretch: run ? [1, 0, -1, 0][f] : 0,
    head: { dx: run ? 1 : 0, dy: run ? 1 : 0 },
    ears: run || tuck ? 'back' : undefined,
    tail: tuck ? 'tuck' : run ? 'run' : undefined,
    wag: tuck ? 0 : wag,
  };
}

/** The pose `name` at frame `f` (wrapped), with the tail at `wag` degrees; `tuck`: tail between the legs, ears back (bolting). */
export function poseOf(name: PoseName, f: number, wag = 0, tuck = false): Pose {
  f = ((f % FRAMES[name]) + FRAMES[name]) % FRAMES[name];
  switch (name) {
    case 'walk': case 'trot': case 'run': return gait(name, f, wag, tuck);
    case 'stand': return { kind: 'stand', wag };
    case 'sit': return { kind: 'sit', wag };
    // Nose to the ground, working along it, the tail going slowly.
    case 'sniff': return { kind: 'stand', head: { low: true, dx: f, dy: 0 }, legs: [[f, 0], [0, 0], [0, 0], [0, 0]], wag, ears: 'up' };
    case 'scratch': return { kind: 'scratch', kick: f };
    case 'down': return { kind: 'down', wag };
    case 'downUp': return { kind: 'down', headUp: true, wag, ears: 'up' };
    // Shaking off: the coat flung one way and the other, then settling.
    case 'shake': return { kind: 'stand', fluff: f < 2 ? f + 1 : 0, head: { dy: f === 1 ? 1 : 0 }, tilt: f === 0 ? 1 : 0, ears: f < 2 ? 'back' : undefined, wag: f === 2 ? 0 : f ? 30 : -30 };
    // On its back for a rub, the legs paddling in the air, the tail going along the floor.
    case 'belly': return { kind: 'belly', kick: f, wag };
    // Flying in: front feet reaching, hind ones driving, jaws open.
    case 'lunge': return { kind: 'stand', legs: [[3, 2], [2, 1], [-3, 1], [-2, 0]], stretch: 2, lift: f ? 2 : 1, head: { dx: 1, dy: 1, open: true }, ears: 'back', tail: 'run' };
    // The bite: braced, head in, jaws open then shut on it.
    case 'bite': return { kind: 'stand', legs: [[2, 0], [1, 0], [-1, 0], [-2, 0]], crouch: 1, head: { dx: 1, dy: f ? 2 : 1, open: !f }, ears: 'back', tail: 'run' };
    // Latched on and holding: sat back on its haunches, front feet braced, head low and shaking it.
    case 'latch': return { kind: 'stand', legs: [[2, 0], [2, 0], [-2, 0], [-1, 0]], tilt: -1, crouch: 1, head: { dx: f, dy: 2 }, ears: 'back', tail: 'run', wag: f ? 10 : -10 };
    // A play bow: chest down on the front legs, rump up, tail going.
    case 'bow': return { kind: 'stand', legs: [[2, 0], [2, 0], [0, 0], [0, 0]], front: 2, tilt: 1, head: { dy: 2 }, tail: 'up', wag, ears: 'up' };
    case 'leap': return { kind: 'stand', legs: [[3, 2], [2, 2], [-3, 1], [-2, 1]], stretch: 1, lift: 3, head: { dx: 1, dy: 0 }, ears: 'back', tail: 'run' };
  }
}

/** Every pose and frame (the look sheet; the tests). */
export const ALL_POSES: [PoseName, number][] = (Object.keys(FRAMES) as PoseName[]).flatMap((n) => Array.from({ length: FRAMES[n] }, (_, f) => [n, f] as [PoseName, number]));
