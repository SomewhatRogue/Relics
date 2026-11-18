/**
 * The living world (docs/decisions/new-look-characters.md, Kyle 2026-11-16: "I wish characters and NPCs looked more
 * dynamic", "beautiful landscapes make a huge difference... things that look deep or nuanced, like water"): capes
 * trail and swing, goblins are knocked back the way a blow lands, townsfolk shift their weight and turn to look at
 * you; in the 2.5D view the wind runs through the trees in gusts, cloud shadows drift over the ground, the sun keeps
 * the hour and figures cast shadows, and the water has foam at its edges and light glinting on it.
 *
 * It was an option to compare. **It is the game now** (Kyle, 2026-11-17: "we should make that absolutely a feature
 * not a toggle"): the button and its setting are gone. `?alive=0` in the address still turns it off, for the look
 * scripts that compare with and without.
 */

/** Whether the living world is on: always, but for `?alive=0` in the address. */
export const ALIVE = { on: typeof location === 'undefined' || new URLSearchParams(location.search).get('alive') !== '0' };

/**
 * The wind (one for everything: a cape's hem, the trees in 2.5D, three/wind3d.ts's shader writes the same sum):
 * gusts that travel across the map from the west-north-west, a band at a time, `0` calm to `1` a full gust at room
 * tile (x, y) at time `now` (seconds). Two waves at odd lengths, so gusts come unevenly, never in lockstep.
 */
export const WIND = { dir: [0.92, 0.38], speed: 2.6, len: [9.5, 23] };
export function gust(x: number, y: number, now: number): number {
  const along = x * WIND.dir[0] + y * WIND.dir[1];
  const a = Math.sin((along - now * WIND.speed) / WIND.len[0] * 6.283), b = Math.sin((along - now * WIND.speed * 0.6) / WIND.len[1] * 6.283);
  const g = Math.max(0, a * 0.6 + b * 0.55 - 0.15);
  return Math.min(1, g * g * 1.6);
}

/** Where the player is (room tiles), set by the scene before it draws the townsfolk, so they can turn to look. */
export const WATCHED = { on: false, x: 0, y: 0 };
export function watched(me: { x: number; y: number } | null | undefined): void {
  WATCHED.on = !!me;
  if (me) (WATCHED.x = me.x), (WATCHED.y = me.y);
}

/** A steady number in 0..1 for a name: each townsperson keeps their own rhythm. */
export function phaseOf(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return ((x >>> 0) % 1000) / 1000;
}

/** How a standing townsperson stands, with the living world on: `look`, which way they face (true: left), toward the
 *  player within `near` tiles, else glancing one way and the other on their own uneven rhythm; `shift`, a pixel of
 *  weight from foot to foot now and then. */
export const IDLE = { near: [5, 3.5] };
/** When each townsperson last saw you come near (seconds), for the nod; dropped when you've gone. */
const greeted = new Map<string, number>();
/** The greeting: two quick dips of a pixel, `beat` seconds each, after you come near. */
const NOD = { beat: 0.14, dips: 2 };
export function idleStance(name: string, x: number, y: number, now: number): { left: boolean; shift: number; dy: number } {
  const ph = phaseOf(name) * 6.283;
  const near = WATCHED.on && Math.abs(WATCHED.x - x) < IDLE.near[0] && Math.abs(WATCHED.y - y) < IDLE.near[1];
  const left = near ? WATCHED.x < x : Math.sin(now * 0.31 + ph) + Math.sin(now * 0.17 + ph * 2.1) * 0.8 > 0;
  const w = Math.sin(now * 0.43 + ph * 1.7);
  let dy = 0;
  if (near) {
    let t0 = greeted.get(name);
    if (t0 === undefined || t0 > now) greeted.set(name, (t0 = now));
    const beat = Math.floor((now - t0) / NOD.beat);
    dy = beat < NOD.dips * 2 && beat % 2 === 0 ? 1 : 0;
  } else greeted.delete(name);
  return { left, shift: w > 0.45 ? 1 : w < -0.45 ? -1 : 0, dy };
}
