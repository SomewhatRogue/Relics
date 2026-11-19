/**
 * THE WILLOW HOLT: the wood in the water (shared/sallowholt.ts).
 *
 *   A willow holt once cut every few years for poles, its ditches let go until the whole wood stands in black water.
 *   The pollards have grown out into heavy crowns that roof it over, so it is dark at noon. Somebody laid duckboards
 *   through it long ago; the hungry use them now, and have dragged their kegs along them to the bank. The spiders have
 *   come in from Greyhollow behind them: a web pocket off the boards, and the bones of what they caught.
 */
import { claim, mark, patch, round, type Kit } from './expedkit.js';
import { clump, markAt, sprinkle, willow } from './sallowholtkit.js';
import { BEND, CAMP, CUT, groundAt, HOLT, POCKET } from './sallowholtland.js';

/** Where the web pocket's chest sits, back against the drowned trees. */
export const WEB_CHEST = { x: POCKET.x + 3, y: POCKET.y - 1.4 };
/** The hungry's fire on the camp's hummock. */
export const FIRE = { x: CAMP.x - 1.6, y: CAMP.y + 0.4 };

/** The drained cut you come up: a hard bottom of mud between its old banks, the second sluice shut behind you. */
function cut(k: Kit): void {
  patch(k, 'mud', CUT.x, CUT.y - 1, CUT.w, CUT.h + 2, false), patch(k, 'wet', CUT.x + 2, CUT.y + 2, CUT.w - 4, CUT.h - 3);
  for (const [x, y] of [[44, 94], [52, 91], [47, 89.6]] as const) markAt(k, 'puddle', x, y, 2.2, 0.8);
  // The second sluice, its leaf down behind you: two posts and the boards of the leaf across the cut.
  round(k, 'post', CUT.x + 0.6, 99.2, 0.3), round(k, 'post', CUT.x + CUT.w - 0.6, 99.2, 0.3);
  k.blocks.push({ kind: 'fence', x: CUT.x + 1, y: 99.3, w: CUT.w - 2, h: 0.5 });
  // The cut's banks: reed and sallow scrub along each lip, pollards over it.
  for (let y = 88; y < 99; y += 0.9) for (const x of [CUT.x - 0.4, CUT.x + CUT.w + 0.4]) round(k, k.rng.next() < 0.7 ? 'reed' : 'bush', x, y + k.rng.range(-0.2, 0.2), 0.34);
  for (const [x, y] of [[39.4, 90.6], [57, 92.6], [38.6, 96.4], [57.8, 97.4], [56.6, 88.4]] as const) willow(k, x, y, k.rng.range(1.05, 1.3));
  sprinkle(k, 'mud', 6, CUT.x + 1, CUT.y + 1, CUT.x + CUT.w - 1, 98, 1.8, 0.8);
}

/** The pollards: crowns heavy over the water everywhere but the boards and the camp, the drowned ones grey among them. */
function pollards(k: Kit): void {
  for (let y = 39.6; y < HOLT.h - 1; y += 2.4) for (let x = 1.4 + (Math.round(y) % 2) * 1.2; x < HOLT.w - 1; x += 2.5) {
    const px = x + k.rng.range(-0.8, 0.8), py = y + k.rng.range(-0.6, 0.6);
    if (k.rng.next() < 0.1) continue;
    const dead = groundAt(px, py) === 2 && k.rng.next() < 0.12;
    if (dead && willow(k, px, py, 0.6)) (k.rounds[k.rounds.length - 1].kind = 'deadtree');
    else if (!dead) willow(k, px, py, k.rng.range(0.85, 1.25));
  }
  // The shade under them: dark over the water and the boards alike, a little lighter where the camp has cut them back.
  for (let y = 40; y < 90; y += 7) for (let x = 3; x < 93; x += 9) patch(k, 'shade', x + k.rng.range(-2, 2), y + k.rng.range(-1.5, 1.5), 11, 8);
}

/** The camp's hummock: the hungry's fire, the withies they've cut, a keg broached for the lamps. */
function camp(k: Kit): void {
  patch(k, 'earth', CAMP.x - CAMP.rx + 0.6, CAMP.y - CAMP.ry + 0.6, CAMP.rx * 2 - 1.2, CAMP.ry * 2 - 1.2), patch(k, 'mud', CAMP.x - 4, CAMP.y - 1, 8, 4);
  k.braziers.push({ x: FIRE.x, y: FIRE.y, r: 0.35, wild: true }), claim(k, FIRE.x, FIRE.y, 0.9);
  round(k, 'cookfire', FIRE.x + 0.1, FIRE.y + 0.05, 0.5), round(k, 'smoke', FIRE.x, FIRE.y - 1.2, 0.3);
  round(k, 'woodpile', CAMP.x + 3.8, CAMP.y - 2.2, 0.5), round(k, 'woodpile', CAMP.x - 5.2, CAMP.y - 1.4, 0.5);
  round(k, 'barrels', CAMP.x + 1.8, CAMP.y + 2.6, 0.42), round(k, 'sacks', CAMP.x - 3.8, CAMP.y + 2.4, 0.38), round(k, 'pots', FIRE.x + 1.3, FIRE.y + 1, 0.3);
  markAt(k, 'scorch', FIRE.x, FIRE.y + 0.2, 2, 1), markAt(k, 'debris', CAMP.x + 0.6, CAMP.y + 1.2, 1.6, 0.6), markAt(k, 'blood', CAMP.x - 2.6, CAMP.y - 2, 1.2, 0.5);
  clump(k, ['reed'], CAMP.x + CAMP.rx - 0.4, CAMP.y + 2, 4, 1, [0.26, 0.32], 0), clump(k, ['reed'], CAMP.x - CAMP.rx + 0.6, CAMP.y + 2.6, 3, 1, [0.26, 0.32], 0);
  for (const [x, y] of [[CAMP.x - 5.4, CAMP.y + 2.6], [CAMP.x + 5.2, CAMP.y + 1.6]] as const) willow(k, x, y, 1.15);
}

/** The bend's hummock and the web pocket: webs strung through the drowned trees, the bones of what was caught. */
function webs(k: Kit): void {
  patch(k, 'mud', BEND.x - BEND.rx + 0.4, BEND.y - BEND.ry + 0.4, BEND.rx * 2 - 0.8, BEND.ry * 2 - 0.8);
  round(k, 'deadtree', BEND.x + 2.2, BEND.y - 1.2, 0.5), markAt(k, 'debris', BEND.x + 0.8, BEND.y + 0.6, 1.4, 0.6);
  const P = POCKET;
  patch(k, 'mud', P.x - P.rx + 0.5, P.y - P.ry + 0.5, P.rx * 2 - 1, P.ry * 2 - 1), patch(k, 'ash', P.x - 3, P.y - 2.4, 7, 4.4);
  for (const [x, y] of [[P.x - 3.6, P.y - 2.6], [P.x + 4.6, P.y + 1.4], [P.x - 0.6, P.y + 3.4], [P.x + 5.6, P.y - 2]] as const) round(k, 'deadtree', x, y, 0.5);
  for (const [x, y] of [[P.x - 1.4, P.y + 1.6], [P.x + 2.4, P.y + 2], [P.x - 4, P.y + 0.8]] as const) markAt(k, 'debris', x, y, 1.4, 0.6);
  markAt(k, 'blood', P.x + 1.2, P.y + 0.6, 1.4, 0.6), round(k, 'moths', P.x + 0.4, P.y - 1.6, 0.05), round(k, 'moths', P.x - 2, P.y + 1, 0.05);
  k.chests.push({ ...WEB_CHEST }), claim(k, WEB_CHEST.x, WEB_CHEST.y, 0.9);
}

/** Along the boards: drag marks where the kegs were hauled, a plank gone and laid back, a keg dropped in the water. */
function traces(k: Kit): void {
  for (const [x, y, w, h] of [[48, 84, 0.5, 4], [43, 80.6, 4, 0.5], [39, 75, 0.5, 4], [46, 63, 5, 0.5], [53, 57, 0.5, 4], [49, 50.6, 3.4, 0.5], [45, 44, 0.5, 4]] as const) {
    mark(k, 'drag', x - w / 2, y - h / 2, w, h);
  }
  markAt(k, 'planks', 53, 60.4, 1.6, 1), markAt(k, 'planks', 39, 77.6, 1.4, 1);
  round(k, 'barrels', 50.6, 66, 0.42), markAt(k, 'scorch', 45.4, 46, 1, 0.6);
}

export function layHolt(k: Kit): void {
  // Under it all the mud of the carr (the water draws over it), the bank's grass a level up.
  patch(k, 'mud', -1, 37, HOLT.w + 2, HOLT.h - 36, false), patch(k, 'wet', 2, 40, HOLT.w - 4, 48);
  cut(k), camp(k), webs(k), traces(k);
}

/** The wood itself, laid last round everything that stands in it. */
export const layWood = pollards;
