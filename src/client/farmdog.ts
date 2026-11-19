/**
 * Tollan's farm dog (docs/design/territories.md, "2. Tollan's Farm": "Only here: the dog"). An ordinary dog with
 * no secret: it can't be hurt and never fights, it is quick and keeps to the walls. A map says where it waits
 * (`map.dog.posts`, in the order you come to them); it sits at one watching whoever is nearest, and when they
 * come close it runs on to the next: on the orchard wall and then gone, ahead in the hurdle lanes, home in its
 * own yard. `late`: not there till nobody named is left standing (it waits at the barn's doors once MAWL is dead).
 *
 * Paint only, worked out on each screen from the heroes every screen has; the room never knows it is there.
 * `stepDog` is pure; `farmDog` keeps one dog a map and steps it by the wall clock.
 */
import type { GameMap } from '../shared/arena';
import type { HoundLook } from '../shared/houndlook';
import type { Hound } from '../sim/types';

/** A scruffy black and white collie sort, no name on screen. */
export const FARM_DOG: HoundLook = { breed: 'collie', coat: 0, mark: 'both', name: '' };
/** How fast it runs (tiles a second), how near you get before it goes on, how near before its tail goes. */
export const DOG = { speed: 9, shy: 6.5, glad: 9.5 };

export type Post = [number, number, number?];
export interface DogState { i: number; x: number; y: number; up: number; fx: number; moving: boolean; at: number }
type At = { x: number; y: number };

export const newDog = (posts: Post[], now = 0): DogState => ({ i: 0, x: posts[0][0], y: posts[0][1], up: posts[0][2] ?? 0, fx: 1, moving: false, at: now });

/** One step: on to the next post if someone has come close, running there, or sitting facing whoever is nearest. */
export function stepDog(s: DogState, posts: Post[], heroes: At[], dt: number): void {
  const near = heroes.reduce<At | undefined>((a, h) => (!a || Math.hypot(h.x - s.x, h.y - s.y) < Math.hypot(a.x - s.x, a.y - s.y) ? h : a), undefined);
  const d = near ? Math.hypot(near.x - s.x, near.y - s.y) : Infinity;
  if (!s.moving && d < DOG.shy && s.i < posts.length - 1) s.i++;
  const [tx, ty, tu = 0] = posts[s.i], left = Math.hypot(tx - s.x, ty - s.y), go = DOG.speed * dt;
  s.moving = left > 0.05;
  if (s.moving) {
    const k = Math.min(1, go / left);
    if (Math.abs(tx - s.x) > 0.05) s.fx = tx > s.x ? 1 : -1;
    (s.x += (tx - s.x) * k), (s.y += (ty - s.y) * k);
    // Down off a wall at once, up onto one over the last tile.
    s.up = left < 1 ? tu * (1 - left) : 0;
  } else {
    s.up = tu;
    if (near && Math.abs(near.x - s.x) > 0.3) s.fx = near.x > s.x ? 1 : -1;
  }
}

const dogs = new WeakMap<GameMap, DogState>();
const BODY: Hound = { x: 0, y: 0, fx: 1, fy: 0, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: false };

export interface FarmDog { x: number; y: number; up: number; d: Hound; moving: boolean; glad: boolean; home: boolean }

/** This map's dog as it is now, or none (no dog here, or not yet). */
export function farmDog(map: GameMap, heroes: At[], named: boolean, now: number): FarmDog | null {
  const posts = map.dog?.posts;
  if (!posts?.length || (map.dog!.late && named)) return null;
  let s = dogs.get(map);
  if (!s) dogs.set(map, (s = newDog(posts, now)));
  stepDog(s, posts, heroes, Math.max(0, Math.min(0.1, now - s.at)));
  s.at = now;
  const near = Math.min(...heroes.map((h) => Math.hypot(h.x - s!.x, h.y - s!.y)), Infinity);
  const home = !s.moving && s.i === posts.length - 1;
  return { x: s.x, y: s.y, up: s.up, d: { ...BODY, x: s.x, y: s.y, fx: s.fx, moving: s.moving }, moving: s.moving, glad: near < DOG.glad, home };
}

/** How the hound painter is told to draw it (client/hound.ts). */
export const dogDraw = (f: FarmDog) => ({
  mood: f.moving ? { moving: true, gait: 'run' as const } : f.home ? { wag: f.glad, happy: f.glad } : { sit: true, wag: f.glad },
  fx: f.d.fx, look: FARM_DOG,
});
