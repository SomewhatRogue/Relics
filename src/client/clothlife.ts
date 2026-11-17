/**
 * A look's moving cloth in the cloth a hero has chosen (shared/clothlook.ts, docs/design/cloak-choice.md). Slice 1:
 * the Warrior's cape. The dye is the cape's two colours (cloth and its shadow), the edge is its trim, the cut makes
 * it lined (capelined.ts) or ragged. herolife.ts asks for it each frame, so each answer is made once and kept.
 * Drawing only.
 */
import type { ClothLook } from '../shared/clothlook';
import type { Life } from './lookkit';

/** The six dyes, by the tailor's order (entry 0 is the look's own): deep colours, none brighter than the knight's
 *  red, the white a bone white. */
const DYE: ([string, string] | null)[] = [null, ['#641618', '#340a0c'], ['#1e3460', '#101c3a'], ['#22462a', '#122a16'], ['#24212a', '#141218'], ['#a8a49c', '#6e6a64'], ['#7a5e22', '#4a3812']];
/** The three edges: iron, silver, old gold. */
const EDGE: (string | null)[] = [null, '#6e6a78', '#c8ced4', '#c8962e'];

/** A colour at a share of its brightness. */
const dim = (c: string, k: number): string => '#' + [1, 3, 5].map((i) => Math.round(parseInt(c.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
/** A cape's lining: the same cloth, darker (the knight's own is about this far below his red). */
const liningOf = (cape: [string, string]): [string, string] => [dim(cape[0], 0.6), dim(cape[0], 0.36)];

const kept = new WeakMap<Life, Map<number, Life>>();

/** `life` in the cloth `c`; the same object back when nothing is chosen or the look has no cape. */
export function lifeIn(life: Life, c: ClothLook | undefined): Life {
  if (!c || !life.cape || (!c.dye && !c.edge && !c.cut)) return life;
  const key = c.dye * 100 + c.edge * 10 + c.cut;
  let mine = kept.get(life);
  if (!mine) kept.set(life, (mine = new Map()));
  let out = mine.get(key);
  if (!out) {
    const cape = DYE[c.dye] ?? life.cape;
    out = { ...life, cape };
    // Lined: by the cut, or the look's own lining in the new dye. Ragged: by the cut, or the look's own.
    if (c.cut === 1 || (life.lining && c.cut !== 1)) out.lining = c.dye || !life.lining ? liningOf(cape) : life.lining;
    if (c.cut === 1) out.ragged = false;
    if (c.cut === 2) out.ragged = true;
    const trim = EDGE[c.edge];
    if (trim) out.trim = trim;
    mine.set(key, out);
  }
  return out;
}
