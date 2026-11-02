/**
 * Inside the buildings. Every door leads to a small room with its own floor and furniture: in
 * Wickhold (the halls are in halls.ts), people to talk to (the smith and the relic-wright at the forge, the priest, the trainer
 * and his squire, the healer and those she mends, the reeve, a family in every lit house on Rescue
 * Row); out on a job, a cottage or a barn, each different from the next (inside.ts).
 * Walk out at the bottom to come back out of the door.
 */
import type { GameMap } from './arena.js';
import type { WorldState } from './story.js';

import { HOME, b, hall, infirmary, n, room } from './townhalls.js';

/** The families who take the houses on Rescue Row, in the order the houses are lit. */
export const FAMILIES = [
  { name: 'THE ASHBYS', adult: 'MERRIT ASHBY', child: 'PIP' },
  { name: 'THE COOPERS', adult: 'JANNA COOPER', child: 'WILL' },
  { name: 'THE FENNS', adult: 'OLD FENN', child: 'ROSIE' },
  { name: 'THE TULLOCKS', adult: 'BRAN TULLOCK', child: 'NELL' },
  { name: 'THE MARLOWES', adult: 'EDA MARLOWE', child: 'KIT' },
  { name: 'THE THATCHERS', adult: 'GARRET THATCHER', child: 'MAY' },
  { name: 'THE WYLDES', adult: 'SORREL WYLDE', child: 'FINCH' },
  { name: 'THE CARTERS', adult: 'HUGH CARTER', child: 'BESS' },
];
export const PATIENTS = ['AMOS', 'LETTY', 'CORIN'];

/** A Wickhold building's inside, by its door. */
export function townInterior(door: string, w: WorldState): GameMap {
  const h = hall(door);
  if (h) return h;
  if (door === 'infirmary') return infirmary(PATIENTS, Math.min(PATIENTS.length, w.rescued));
  if (door === 'granary') return room('THE GRANARY', 10, 7, { ...HOME, floor: 'dirt' },
    [b('sacks', 0.8, 0.6, 2, 1), b('sacks', 7.2, 0.6, 2, 1), b('sacks', 0.8, 2.2, 1.4, 1)],
    [n('FARMER JOS', 5, 2.2, 'granary', 'farmer')]);
  // A house on Rescue Row: a family, a bed, a hearth.
  const i = Number(door.split(':')[1]) || 0, f = FAMILIES[i % FAMILIES.length];
  return room(f.name, 10, 7, HOME, [b('bed', 0.8, 0.6, 1.2, 2), b('bench', 4.6, 2.6, 2, 0.8)],
    [n(f.adult, 4.2, 1.6, 'home', 'villager', i), n(f.child, 7.4, 3.2, 'home', 'child', i)], { braziers: [{ x: 8.2, y: 1, r: 0.35 }] });
}

/** A cottage or barn on a job (each its own: see inside.ts). */
export { runInterior } from './inside.js';
