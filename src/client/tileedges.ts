/**
 * The living world, L1 (docs/design/living-world.md): edges where the ground's materials meet, on the tile redraw's
 * floor (three/redrawfloor.ts), drawn after the soil on the same 20 by 12 grid. The soil (soil.ts) decides a material
 * per 2 by 2 block on this grid and frays its shapes with noise; here each block is compared with the ones above, below, left and
 * right of it, and where they differ the edge is drawn as tile art draws it, lit from the upper left:
 * - grass over anything else: a shadowed lip along grass's foot (the turf hangs over), and a lit fringe along its top
 *   edge, with the odd blade standing proud;
 * - soil against the floor's own stone or earth ('cobble' to the soil): a dark rim on the soil's lower and right sides,
 *   a pale one on its upper and left, so a patch sits in the ground rather than painted on it;
 * - mud against firmer ground: a wet dark rim all round.
 * Every mark is whole pixels on the grid; colours are the soil's own family, so the grade lands them as it does it.
 */
import type { GameMap, Soil } from '../shared/arena';
import { soilAt } from './soil';
import type { Rect } from './tilekit';

/** The soil's block on the redraw's grid (soil.ts, calm): an edge is judged a 2 by 2 at a time. */
const B = 2;
const LIP = '#1d2818', FRINGE = '#46582f', BLADE = '#56683a', RIM_D = '#1e1a16', RIM_L = '#4e4740', MUD_RIM = '#16120e';

export function softEdges(m: GameMap, rect: Rect, sx: number, sy: number): void {
  if (!m.soil?.length) return;
  const cw = Math.ceil((m.w * sx) / B), ch = Math.ceil((m.h * sy) / B), mats: Soil['mat'][] = new Array(cw * ch);
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) mats[j * cw + i] = soilAt(m, (i * B + B / 2) / sx, (j * B + B / 2) / sy);
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= cw || j >= ch ? null : mats[j * cw + i]);
  const soft = (a: Soil['mat'] | null) => a === 'shade' || a === null;
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const me = mats[j * cw + i], x = i * B, y = j * B;
    if (me === 'shade') continue;
    const up = at(i, j - 1), dn = at(i, j + 1), lf = at(i - 1, j), rt = at(i + 1, j);
    if (me === 'grass') {
      if (dn !== 'grass' && !soft(dn)) rect(x, y + B - 1, B, 1, LIP);
      if (up !== 'grass' && !soft(up)) {
        rect(x, y, B, 1, FRINGE);
        if (((i * 7 + j * 13) & 15) === 0) rect(x, y - 1, 1, 1, BLADE);
      }
      continue;
    }
    if (me === 'mud') {
      if (dn !== 'mud' && !soft(dn)) rect(x, y + B - 1, B, 1, MUD_RIM);
      if (up !== 'mud' && !soft(up)) rect(x, y, B, 1, MUD_RIM);
      if (lf !== 'mud' && !soft(lf)) rect(x, y, 1, B, MUD_RIM);
      if (rt !== 'mud' && !soft(rt)) rect(x + B - 1, y, 1, B, MUD_RIM);
      continue;
    }
    if (me === 'cobble') continue;
    // A patch of earth, swept ground, crop or the like against the floor's own: set into it.
    if (dn === 'cobble') rect(x, y + B - 1, B, 1, RIM_D);
    if (rt === 'cobble') rect(x + B - 1, y, 1, B, RIM_D);
    if (up === 'cobble') rect(x, y, B, 1, RIM_L);
    if (lf === 'cobble') rect(x, y, 1, B, RIM_L);
  }
}
