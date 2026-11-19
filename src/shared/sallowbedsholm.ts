/**
 * THE HOLM (shared/sallowbeds.ts): the island of dry ground the causeway comes up to.
 *
 *   The one dry place for a long way, so the hungry built on it. Their second den stands at its north-east end
 *   inside a yard of osier hurdles, the withies from the beds piled by it, its oil barrel at the corner. The cookpot
 *   is in the middle where they eat. Drying racks on the west side, hung with what they've caught and skinned. By
 *   the den's yard a cage of willow rods, and a woman from Lowfurrow in it. North, across a last strip of black
 *   water, the second sluice; the way on is up its spit.
 */
import { block, claim, patch, type Kit, type P } from './expedkit.js';
import { wooden } from './sitekit.js';
import { markAt, put, sprinkle } from './sallowbedskit.js';

/** The second den (its top-left corner), its oil, the cookpot, the cage, the racks. */
export const DEN2: P = { x: 58.4, y: 14.6 };
export const OIL2: P = { x: 63.4, y: 17.4 };
export const POT: P = { x: 42.6, y: 24 };
export const CAGE: P = { x: 52.2, y: 19.4 };
export const RACKS: P = { x: 34.4, y: 20.4 };

/** The den's yard: the den, its oil, the withies hauled here, the hurdles round it, smoke from its roof. */
function yard(k: Kit): void {
  patch(k, 'mud', DEN2.x - 4.4, DEN2.y - 1.6, 11, 7.6), patch(k, 'straw', DEN2.x - 2, DEN2.y + 2.2, 4, 1.4);
  k.blocks.push(wooden({ kind: 'den', x: DEN2.x, y: DEN2.y, w: 2.6, h: 1.6 })), claim(k, DEN2.x + 1.3, DEN2.y + 0.8, 1.9);
  k.props.push({ kind: 'oil', ...OIL2 }), claim(k, OIL2.x, OIL2.y, 0.6);
  put(k, 'barrels', OIL2.x + 1.2, OIL2.y - 1.2, 0.4, 0, 0.4), markAt(k, 'scorch', OIL2.x - 0.4, OIL2.y + 0.8, 1, 0.5);
  k.rounds.push({ kind: 'smoke', x: DEN2.x + 1.6, y: DEN2.y + 0.2, r: 0.02 });
  // The osier yard: hurdles along its north and west, open to the south where they come and go.
  for (let x = 54.6; x < 64; x += 2.2) block(k, 'hurdle', x, 12.4, 2.2, 0.45);
  block(k, 'hurdle', 54.2, 12.8, 0.45, 2.2), block(k, 'hurdle', 54.2, 15, 0.45, 2.2);
  for (const [x, y, r] of [[56, 19.6, 0.5], [57.2, 20.6, 0.46], [65.6, 14.6, 0.48]] as const) put(k, 'woodpile', x, y, r, 0, 0.4);
  markAt(k, 'debris', 59.6, 18.8, 1.4, 0.5), markAt(k, 'straw', 56.6, 21.6, 1.8, 0.7);
}

/** The cookpot: the fire, what they brought to it, the bones round it. */
function pot(k: Kit): void {
  patch(k, 'ash', POT.x - 2.4, POT.y - 1.6, 4.8, 3.6), patch(k, 'mud', POT.x - 4, POT.y - 2.6, 8, 6);
  k.rounds.push({ kind: 'cookfire', x: POT.x, y: POT.y, r: 0.4 }), claim(k, POT.x, POT.y, 0.9);
  k.rounds.push({ kind: 'smoke', x: POT.x, y: POT.y - 0.4, r: 0.02 });
  put(k, 'sacks', POT.x + 2.8, POT.y - 2.2, 0.38, 0, 0.4), put(k, 'crates', POT.x - 3, POT.y - 2, 0.42, 0, 0.4), put(k, 'washtub', POT.x + 2.4, POT.y + 1.4, 0.36, 0, 0.4);
  for (const [x, y] of [[-1, 1.4], [1.2, 1.6], [0.4, -1.3], [-1.8, 0.4]] as const) markAt(k, 'debris', POT.x + x, POT.y + y, 0.7, 0.3);
  markAt(k, 'blood', POT.x + 1.6, POT.y + 0.4, 0.6, 0.3);
}

/** The cage by the den's yard: willow rods lashed, her blanket, the bowl they push in to her. */
function cage(k: Kit): void {
  k.props.push({ kind: 'cage', ...CAGE }), claim(k, CAGE.x, CAGE.y, 1.2);
  markAt(k, 'straw', CAGE.x, CAGE.y + 0.9, 1.4, 0.6), markAt(k, 'drag', CAGE.x - 2, CAGE.y + 1.4, 2.4, 0.5);
  block(k, 'hurdle', CAGE.x - 3.4, CAGE.y - 2, 2.2, 0.45);
}

/** The racks on the west side: what they've caught hung to dry, the skins pegged out, the fish heads under them. */
function racks(k: Kit): void {
  patch(k, 'earth', RACKS.x - 3, RACKS.y - 1.6, 7, 5);
  for (const [dx, dy] of [[0, 0], [0.4, 2.6], [-3.4, 1.4]] as const) {
    const a = { x: RACKS.x + dx - 1, y: RACKS.y + dy, w: 2, h: 0.4 };
    k.blocks.push(wooden({ kind: 'dryrack', ...a })), claim(k, a.x + 1, a.y + 0.2, 1.2);
    markAt(k, 'debris', a.x + 1, a.y + 0.9, 1.2, 0.3);
  }
  markAt(k, 'pelt', RACKS.x + 3, RACKS.y + 1.2, 1.2, 0.8), put(k, 'chopblock', RACKS.x + 2.8, RACKS.y - 0.6, 0.28, 0, 0.4);
}

/** The holm's own trees and edges: pollards round its shore, reeds in its shallows, the landing trodden. */
function shore(k: Kit): void {
  patch(k, 'grass', 25, 12, 47, 23), patch(k, 'mud', 38, 31.6, 5, 3), patch(k, 'mud', 45.4, 9.6, 5.2, 4);
  for (const [x, y, r] of [[29.4, 25.4, 0.85], [66.6, 21.8, 0.8], [33.4, 30.6, 0.75], [58, 27.6, 0.8], [50.6, 29.4, 0.7], [27.4, 21.2, 0.7], [69, 16.6, 0.75], [37.6, 15.2, 0.7]] as const) put(k, 'tree', x, y, r, 0, 0.6);
  for (const [x, y] of [[31, 28.6], [63, 25], [46, 30.6], [40.6, 16.4], [66.4, 19.2]] as const) put(k, 'bush', x, y, 0.42, 0, 0.6);
  for (let a = 0; a < Math.PI * 2; a += k.rng.range(0.22, 0.4)) put(k, 'reed', 48 + Math.cos(a) * 23.4, 23 + Math.sin(a) * 11.4, 0.26, 1, 0.6);
  sprinkle(k, 'weeds', 14, 28, 14, 68, 32, 1.4, 0.6), sprinkle(k, 'mud', 5, 30, 16, 66, 31, 1.6, 0.8);
  markAt(k, 'planks', 48, 9.8, 3.4, 0.5);
  // Their ways worn across it: the landing to the pot, the pot to the den's yard and to the racks, the yard to the spit.
  for (const [a, b] of [[[40.6, 32.6], [POT.x, POT.y + 1]], [[POT.x + 1, POT.y - 0.6], [DEN2.x, DEN2.y + 3]], [[POT.x - 1, POT.y], [RACKS.x + 1.8, RACKS.y + 1.4]], [[DEN2.x - 1, DEN2.y + 3], [48, 12.2]]] as const) {
    k.soil.push({ mat: 'mud', x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1], line: 0.55 });
  }
  // The withies they dropped coming up from the beds; a gutted pike on the rack's block.
  sprinkle(k, 'straw', 6, 40, 26, 47, 33, 1, 0.4), sprinkle(k, 'debris', 6, 30, 22, 50, 31, 0.8, 0.35);
}

export function layHolm(k: Kit): void {
  yard(k), pot(k), cage(k), racks(k), shore(k);
}
