/**
 * The public works in Lantern Square: Foreman Judd standing by the works board (talk to him and the
 * board opens), and his crew about him: one sweeping round the stall, one hauling planks off the cart
 * to the stall, and while the siege rubble still blocks the east lane, one shovelling it into a barrow
 * and tipping it on a heap a few steps back. Each walks a short loop and stops at its corners to work.
 *
 * Paint only: the crew are in the background (`mute`), never block anyone, and walk on Wickhold's
 * wall clock (`clock`), so every screen has them in the same spot. Pure: the same world gives the
 * same people.
 */
import type { Npc } from './arena.js';
import type { WorldState } from './story.js';
import { FOREMAN } from './mendlines.js';
import { workDone } from './works.js';

/** Where Judd stands: just west of the works stall, by its board. */
export const FOREMAN_AT = { x: 29.6, y: 13.7 };

export function publicWorks(w: WorldState): Npc[] {
  const crew = (name: string, look: string, work: Npc['work'], path: [number, number][], stops: number[], speed: number): Npc =>
    ({ name, x: path[0][0], y: path[0][1], talk: 'chat', look, work, path, stops, speed, mute: true, clock: true });
  const npcs: Npc[] = [
    { name: FOREMAN.name, x: FOREMAN_AT.x, y: FOREMAN_AT.y, talk: 'works', look: 'foreman', fx: 1, fy: 0.4 },
    // Sweeping round the front of the stall, a few strokes at each corner.
    crew('A SWEEPER', 'labourer2', 'sweep', [[29.9, 14.3], [33.9, 14.3], [34.1, 15.9], [32.2, 16.2], [29.8, 15.9]], [3, 2.5, 3, 2.5, 2], 0.5),
    // Planks off the cart, up to a stack by the stall, and back for the next.
    crew('A HAULER', 'labourer', 'haul', [[35, 20], [34.9, 16.8], [34.5, 13.9]], [2.5, 0, 2.5], 0.7),
  ];
  // The rubble in the east lane, a barrow at a time, till the Old Quarter is cleared.
  if (!workDone(w, 'oldquarter')) npcs.push(crew('A DIGGER', 'labourer', 'shovel', [[52.55, 19.3], [51.2, 20.6], [50.3, 22.2]], [7, 0, 3], 0.55));
  return npcs;
}
