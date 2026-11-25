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
  charcoal: { L: '#4a4650', B: '#2a2830', d: '#0e0d12' },
  fatwood: { O: '#d08a3c', o: '#a4602a', d: '#5a3216', r: '#f0b860' },
  saltpetre: { W: '#f4f4f0', w: '#cfd2d4', g: '#6c7078', d: '#3a3d44' },
  clay: { C: '#8ea4b8', c: '#6a8098', d: '#3e5068', h: '#b4c6d4' },
  mint: { G: '#6fc060', g: '#3e8a40', d: '#1e4a26', s: '#8a6a3a' },
  struck: { P: '#e4d4a4', p: '#b8a474', c: '#201a16', d: '#5a4a32' },
  amber: { A: '#d89a26', a: '#a86c14', d: '#5e3a0c', f: '#fff0a0' },
  // (Black peat and thunderstone: lands still to come; a plain dark lump and a pale stone till they are drawn.)
  peat: { P: '#4a3a2a', p: '#2e2418', d: '#120e0a' },
  thunder: { T: '#9a9eb4', t: '#6a6e88', d: '#363a50', f: '#e8f0ff' },
};
const ROWS: Record<string, string[]> = {
  hide: ['..HHHHHHHH.', '.HHHHHhhhhd', 'HHcHHHhchhd', 'HHcHHhhchdd', 'HHcHhhhchdd', '.hhcdhhchd.', '..ddddddd..'],
  silk: ['..SSSSS..', '.SsssssS.', 'SsS...SsS', 'SsS...sdS', '.dsssssd.', '..ddddd..'],
  brood: ['..WWWS..', '.WWSSSsd', 'WWSsSssd', 'WSsSsssd', '.Sssssdd.', '..dddd..'],
  charcoal: ['..LLd....', '.LLBBd.dd', 'LLBBBdLBd', 'LBBBBdBBd', '.dBBBdddd', '..dddd...'],
  fatwood: ['..........rO', '........rOOo', '......rOOoodd', '....rOOoodd.', '..rOOoodd...', 'rOOoodd.....', '.ddd........'],
  saltpetre: ['..ggggggg..', '.gWWwWWwgg.', 'gWWwWWWwwdg', 'gwWWwwWwddg', '.gddggdgdg.', '..ddddddd..'],
  clay: ['..hhCCC...', '.hCCCCcc..', 'hCCCCCccd.', 'CCCCCccddd', '.cccccdddd', '..dddddd..'],
  mint: ['...GG..GG..', '..GGgGGGgG.', '.GGgGGgGGg.', '..gGGggGg..', '...ggsgg...', '.....s.....', '.....d.....'],
  struck: ['PP....pp.', 'PPP..ppd.', '.PPp.pdc.', '..Ppppdcc', '.ppdppcc.', '..dddccc.'],
  amber: ['..AAAA..', '.AffAAa.', 'AfAAAAad', 'AAAAAaad', '.AAaaadd', '..dddd..'],
  peat: ['..PPPP..', '.PPPPpp.', 'PPPPppdd', 'PPpppddd', '.pppdddd', '..dddd..'],
  thunder: ['..TTT...', '.TfTTtt.', 'TTTTttdd', 'TTtttddd', '.ttdddd.', '..dddd..'],
};

const made = new Map<MatId, Sprite>();
/** The picture for a material. */
export function matSprite(id: MatId): Sprite {
  const k = id;
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
