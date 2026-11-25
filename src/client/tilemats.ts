/**
 * Materials lying on the land, drawn the tile way (docs/design/materials.md, tile-redraw.md "Making a new asset"): a
 * small pixel picture each, three to five shades, light from the upper left, a clean dark outline, no noise. HIDE is a
 * rolled pelt tied with cord, SILK a pale skein, BROOD SILK a tight bundle of dense white silk, a shade brighter than the skein. `matSprite` is the one
 * picture both views use: the flat view blits it (`drawMat`), the 2.5D view stands it up as a card (three/matcards.ts).
 */
import { blit, shadow, type Ctx } from './draw';
import { makeSprite, type Part, type Sprite } from './sprites';
import type { MatId } from '../shared/materials';

const PALS: Record<string, Record<string, string>> = {
  hide: { H: '#c4965e', h: '#9a6c3c', d: '#6a4628', c: '#e4d6a4' },
  silk: { S: '#f4f2ec', s: '#cbcdd6', d: '#8f93a6' },
  brood: { W: '#ffffff', S: '#eceaf4', s: '#c4c6d8', d: '#8488a2' },
};
const ROWS: Record<string, string[]> = {
  hide: ['..HHHHHHHH.', '.HHHHHhhhhd', 'HHcHHHhchhd', 'HHcHHhhchdd', 'HHcHhhhchdd', '.hhcdhhchd.', '..ddddddd..'],
  silk: ['..SSSSS..', '.SsssssS.', 'SsS...SsS', 'SsS...sdS', '.dsssssd.', '..ddddd..'],
  brood: ['..WWWS..', '.WWSSSsd', 'WWSsSssd', 'WSsSsssd', '.Sssssdd.', '..dddd..'],
};

const made = new Map<MatId, Sprite>();
/** The picture for a material (charcoal, bought not dropped, has none: it reads as a hide). */
export function matSprite(id: MatId): Sprite {
  const k = id === 'charcoal' ? 'hide' : id;
  let s = made.get(id);
  if (!s) {
    const parts: Part[] = [];
    ROWS[k].forEach((r, y) => [...r].forEach((ch, x) => ch !== '.' && parts.push(['p', x, y, PALS[k][ch]])));
    made.set(id, (s = makeSprite(Math.max(...ROWS[k].map((r) => r.length)), ROWS[k].length, parts)));
  }
  return s;
}

/** A material on the floor, flat view: its shadow, and its picture. */
export function drawMat(c: Ctx, id: MatId, x: number, y: number, _id = 0): void {
  shadow(c, x, y, 4);
  blit(c, matSprite(id), x, y + 1);
}
