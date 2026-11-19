/**
 * THE STOOKS and THE FAR BANK (shared/lowfurrowfields.ts).
 *
 *   The gleaners had cut this strip and stood the sheaves in rows; the hungry are loading them onto the hay
 *   carts, and the empty places in the rows lead to the near cart, an archer on the bank over it. At the half-built rick a netter keeps the
 *   one they caught here, caged. Then the drain, its bridge planks pulled off and thrown on the bank, and the
 *   trodden way going on up the far bank without you.
 */
import { block, claim, mark, patch, prop, round, type Kit, type P } from './expedkit.js';
import { cast } from './encounter.js';
import { grove, marks, maybe, put, rye, xAt, type FieldsLand } from './lowfurrowfieldskit.js';
import { MOUND, MOUND_STEPS } from './lowfurrowfieldsland.js';
import { wall } from './terrkit.js';

/** The two hay carts and the rick (fixed), the cage by the rick. */
export const HAY = { cart: { x: 37.4, y: 25.2 }, cart2: { x: 55.8, y: 18.4 }, rick: { x: 61.6, y: 19.2, w: 3.4, h: 2.6 } };
export const CAGE = { x: 66, y: 24 };

/** The stook rows: sheaves stood across the strip, gaps where they've been carried off (straw left). */
function stookRows(k: Kit, land: FieldsLand, keep: P[]): void {
  for (const y0 of [15.4, 19.2, 23, 29.6, 33.4]) {
    const tilt = k.rng.range(-0.05, 0.05);
    for (let x = 18.6 + k.rng.range(0, 1.6); x < 78; x += k.rng.range(2.5, 3.7)) {
      const sx = x, sy = y0 + (x - 48) * tilt + k.rng.range(-0.3, 0.3);
      if (Math.abs(sx - xAt(land.road, sy)) < 2.6 || keep.some((p) => Math.hypot(p.x - sx, p.y - sy) < 3)) continue;
      // None on the bank, at its foot or where its steps come down.
      if (sx > MOUND.x - 1.6 && sx < MOUND.x + MOUND.w + 3.4 && sy > MOUND.y - 0.8 && sy < MOUND.y + MOUND.h + 2.4) continue;
      // Near the loading cart, most have gone already: the straw where each stood.
      const gone = Math.hypot(sx - HAY.cart.x, sy - HAY.cart.y) < 9 ? 0.6 : 0.12;
      if (k.rng.next() < gone) {
        mark(k, 'straw', sx - 0.6, sy - 0.3, 1.2, 0.6);
        continue;
      }
      k.rounds.push({ kind: 'hay', x: sx, y: sy, r: 0.48 }), claim(k, sx, sy, 0.48);
      // Some stood in pairs, leaning together.
      if (k.rng.next() < 0.3) k.rounds.push({ kind: 'hay', x: sx + 0.62, y: sy + 0.18, r: 0.38 }), claim(k, sx + 0.62, sy + 0.18, 0.38);
    }
  }
}

export function stooks(k: Kit, land: FieldsLand): void {
  const { cart, cart2, rick } = HAY;
  block(k, 'cart', cart.x, cart.y, 2.6, 1.3), block(k, 'cart', cart2.x, cart2.y, 2.6, 1.3);
  block(k, 'haystack', rick.x, rick.y, rick.w, rick.h);
  // (`look: 1`: drawn as a field rick, tall and coursed, not the barn's low heap: client/pieces.ts.)
  k.blocks[k.blocks.length - 1].look = 1;
  const keep: P[] = [{ x: cart.x + 1.3, y: cart.y + 0.6 }, { x: cart2.x + 1.3, y: cart2.y + 0.6 }, { x: rick.x + 1.7, y: rick.y + 1.3 }, CAGE, { x: 40, y: 27.4 }, { x: 63.6, y: 25.4 }];
  claim(k, CAGE.x, CAGE.y, 1.2);
  // The bank behind the near cart (MOUND): its back hedged, its ways up kept clear.
  wall(k, { x: MOUND.x + 0.4, y: MOUND.y + 0.5 }, { x: MOUND.x + MOUND.w - 0.5, y: MOUND.y + 0.5 }, 0.42);
  for (const q of MOUND_STEPS) claim(k, q.x + q.w / 2, q.y + q.h / 2, 1.6);
  // Pack 103 loading the near cart: an archer up on the bank's lip over it, two carrying sheaves to it, three at it.
  // (The seed still picks which of the two spots behind the cart the bow would have had; the other works the cart.)
  const bow = k.rng.int(2), at = { x: cart.x + 1.3, y: cart.y + 0.65 };
  const back = [{ x: cart.x + 0.6, y: cart.y - 1.2 }, { x: cart.x + 2.4, y: cart.y - 1.3 }];
  cast(put(k, land, back[bow].x + 0.4, MOUND.y + MOUND.h - 1.1, 103), 'archer');
  put(k, land, back[1 - bow].x, back[1 - bow].y, 103, { task: { k: 'busy', x: at.x, y: at.y, what: 'winch' } });
  put(k, land, cart.x + 3.8, cart.y + 0.9, 103, { task: { k: 'busy', x: at.x, y: at.y, what: 'winch' } });
  put(k, land, 32.2, 28.6, 103, { task: { k: 'haul', to: [cart.x - 0.6, cart.y + 2] }, haul: { x: 31.4, y: 28.9, sack: true } });
  put(k, land, 43.8, 29.8, 103, { task: { k: 'haul', to: [cart.x + 3.4, cart.y + 2.2] }, haul: { x: 44.6, y: 30.1, sack: true } });
  round(k, 'hay', cart.x - 1, cart.y + 0.4, 0.44), round(k, 'hay', cart.x + 1.1, cart.y + 2.2, 0.4);
  marks(k, 'straw', cart.x + 1.3, cart.y + 1.6, 5, 3, 2, 1.4, 0.7), marks(k, 'trample', cart.x + 1.2, cart.y + 2.8, 3, 4, 1.6, 2, 1);
  // Pack 104 at the rick: the netter that caught her, by the cage; one at the rick, one forking sheaves up, one at the other cart.
  cast(put(k, land, CAGE.x - 1.6, CAGE.y + 1.1, 104), 'netter');
  put(k, land, rick.x + 1.6, rick.y + rick.h + 1.2, 104, { task: { k: 'busy', x: rick.x + 1.7, y: rick.y + 1.3, what: 'winch' } });
  put(k, land, rick.x + rick.w + 1.5, rick.y + 0.4, 104, { task: { k: 'haul', to: [rick.x + rick.w + 0.6, rick.y + 1.4] }, haul: { x: rick.x + rick.w + 2.3, y: rick.y + 0.2, sack: true } });
  put(k, land, cart2.x + 1.2, cart2.y + 2.4, 104, { task: { k: 'busy', x: cart2.x + 1.3, y: cart2.y + 0.6, what: 'winch' } });
  // The half-built rick: sheaves waiting at its foot, a post for the ladder, straw blown about; where she was netted, trodden.
  for (const [dx, dy] of [[-1, 0.6], [-0.9, 1.9], [4.4, 2.6], [1.4, -0.9]]) maybe(k, 'hay', rick.x + dx, rick.y + dy, 0.42, 1);
  round(k, 'post', rick.x + rick.w + 0.3, rick.y - 0.2, 0.18);
  marks(k, 'straw', rick.x + 2, rick.y + 1.4, 7, 4, 2.6, 1.6, 0.8), marks(k, 'trample', CAGE.x - 0.6, CAGE.y + 0.6, 3, 1.8, 1.2, 1.8, 1);
  // Where they rested out of the sun: a big tree, their water cask, a hurdle or two stacked; hurdles for a windbreak by the rick.
  round(k, 'tree', 21.4, 14.2, 1), patch(k, 'shade', 18.4, 12, 6.4, 4.8), round(k, 'barrels', 23.6, 15.6, 0.34), round(k, 'sacks', 19.6, 16.2, 0.32);
  block(k, 'hurdle', 24.4, 17.6, 2.4, 0.4), block(k, 'hurdle', 58.6, 26.6, 2.6, 0.4), block(k, 'hurdle', 68.8, 18.2, 0.4, 2.4);
  for (const [x, y] of [[30, 20.6], [52.6, 32], [72, 30.4]]) prop(k, 'stave', x + k.rng.range(-0.8, 0.8), y + k.rng.range(-0.4, 0.4));
  for (const [x, y] of [[27, 31], [46, 21], [74, 22.4], [33, 17]]) marks(k, 'debris', x, y, 2, 1.2, 0.8, 0.7, 0.35);
  // The way to the bridge, trodden: the line went this way.
  for (let y = 36; y > 11; y -= 3 + k.rng.range(0, 1)) mark(k, 'trample', xAt(land.road, y) - 1.6, y - 0.7, 3.2, 1.4);
  // The carts' track off the road to each cart and the rick, rutted; green coming through the stubble.
  for (const [x0, y0, x1, y1] of [[46.4, 28.6, 40.6, 26.4], [49.6, 24, 58.4, 21.4], [58.4, 21.4, 61, 23.6]]) {
    for (let t = 0; t <= 1; t += 0.2) mark(k, 'ruts', x0 + (x1 - x0) * t - 0.9, y0 + (y1 - y0) * t - 0.4, 1.8, 0.8);
  }
  for (const [x, y, w, h] of [[26, 22, 7, 4], [50, 31, 8, 4], [70, 14.6, 6, 3], [30, 33.4, 5, 2.6], [66, 31, 6, 3.4]]) patch(k, 'grass', x, y, w, h);
  marks(k, 'weeds', 28, 22.6, 3, 2, 1, 1.6, 0.5), marks(k, 'weeds', 70, 31.6, 3, 2, 1, 1.6, 0.5), marks(k, 'flowers', 53, 32, 2, 2, 0.6, 1.4, 0.5);
  stookRows(k, land, keep);
  // Rye still standing at the strip's ends and along its foot.
  rye(k, land, 12, 12.4, 17.6, 40), rye(k, land, 78.4, 12.4, 84, 40), rye(k, land, 17.6, 36.6, 78.4, 40, 0.35);
  for (const [x, y] of [[14, 22], [82, 28], [80, 14]]) grove(k, x, y, 2, 1.4, ['bush'], [0.34, 0.44], 0.8);
  farBank(k, land);
}

/** The drain's banks and the far bank: reeds along the water, the pulled planks, posts at the bridge, the way going on. */
function farBank(k: Kit, land: FieldsLand): void {
  claim(k, 48, 3, 1.6);
  for (let x = 8; x < 88; x += 2.2) for (const y of [6.6, 9.8]) {
    if (Math.abs(x - 48) < 3.4 || k.rng.next() < 0.3) continue;
    k.blocks.push({ kind: 'reeds', soft: true, x: x + k.rng.range(-0.4, 0.4), y: y + k.rng.range(-0.2, 0.2), w: k.rng.range(1.2, 2), h: 0.9, look: k.rng.int(1000) } as never);
  }
  for (const [x, y] of [[45.7, 7.6], [50.3, 7.6], [45.7, 9.9], [50.3, 9.9]]) round(k, 'post', x, y, 0.18);
  prop(k, 'plank', 43, 11.6), prop(k, 'plank', 53.2, 11.2), prop(k, 'plank', 52, 6.4);
  marks(k, 'debris', 44, 11, 2, 1, 0.4, 0.8, 0.3);
  round(k, 'waymark', 51, 2.8, 0.28);
  for (let y = 6; y > 0.6; y -= 1.6) mark(k, 'trample', xAt(land.road, y) - 1.4, y - 0.6, 2.8, 1.2);
  maybe(k, 'sacks', 45.6, 2.6, 0.3, 1.2);
  for (const [x, y, n] of [[14, 2.4, 6], [30, 2, 5], [66, 2.2, 5], [82, 2.6, 6], [40, 5.6, 2], [58, 5.4, 2]]) grove(k, x, y, n, 3.6, ['tree', 'bush', 'bush'], [0.4, 0.8], 1.6);
  for (const [x, y] of [[22, 5.4], [36, 3.4], [62, 3.6], [74, 5.4]]) marks(k, k.rng.next() < 0.6 ? 'flowers' : 'weeds', x, y, 2, 2.4, 0.6, 1.8, 0.5);
}
