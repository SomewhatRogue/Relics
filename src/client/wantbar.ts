/**
 * The Want as a bar (docs/design/holy-and-hungry.md section 2; Kyle, 2026-11-08: a bar on the character panel and
 * the pack, banded at 15, 30 and 60), never a number. Under it, what it costs now, in plain words. For the pack's
 * foot (the UI chat's pack.ts, one call, asked) and the character panel.
 */
import './wantbar.css';
import { WANT_BANDS, bandOf, isCorrupt, wornPieces } from '../shared/corrupt';
import { WANTW } from './corruptwords';
import type { Item } from '../shared/tuning';

/** The bar's full width, in Want: past it the bar stays full. */
export const BAR_TOP = 80;

/** What's worn and the Want, from a hero or a profile. */
interface Wanting { weapon: string; arms?: Partial<Record<string, Item>>; armor?: Item | null; legs?: Item | null; rings?: Item[]; want?: number }

/** What the Want costs this hero now, one line a cost. */
export function wantLines(k: Wanting): string[] {
  const b = bandOf(k.want), out: string[] = [];
  if (b.gift && wornPieces(k).some((it) => it.quality === 'hungry')) out.push(WANTW.gift(Math.round(b.gift * 100)));
  if (b.seen) out.push(WANTW.seen);
  if (isCorrupt(k)) out.push(WANTW.corrupt);
  if (b.othersHeal < 1) out.push(WANTW.half);
  return out.length ? out : [WANTW.none];
}

/** The bar and its lines, as HTML. */
export function wantBar(k: Wanting): string {
  const w = Math.max(0, Number(k.want) || 0), fill = Math.min(100, (w / BAR_TOP) * 100);
  const ticks = WANT_BANDS.slice(1).map((b) => `<b style="left:${(b.from / BAR_TOP) * 100}%"></b>`).join('');
  return `<div class="wantbar${isCorrupt(k) ? ' corrupt' : ''}"><h3>${WANTW.head}</h3><div class="wb"><i style="width:${fill.toFixed(1)}%"></i>${ticks}</div>` +
    wantLines(k).map((l) => `<div class="none">${l}</div>`).join('') + '</div>';
}
