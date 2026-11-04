/**
 * The squares gear sits in (the pack, the vault, Tobin's buyback, the forge), and the side-by-side
 * card: a piece next to what you wear in that slot now, with every number the room uses for both and
 * the difference, green better, red worse. Shared by the pack (pack.ts) and the town stores (stores.ts).
 */
import { CLASS_KITS, TIERS, WEAPONS, itemName, slotOf, type Item } from '../shared/tuning';
import type { Hero } from '../sim/types';
import { card, fmt, sheet, shown, wearing, worn, type Row } from './card';
import { itemIcon } from './itemicons';
import './cells.css';

const esc = (s: string) => s.replace(/"/g, '&quot;');

/** One square: a piece's picture in its tier's colour, its level, or an empty place. `src` makes it pickable. */
export function cell(it: Item | null, src: string | null, opts: { dst?: string; sel?: string | null; label?: string; icon?: string; col?: string; dim?: boolean; tag?: string } = {}): string {
  const col = opts.col ?? (it ? TIERS[it.quality].col : '#3a3546');
  const cls = `tile${it || opts.icon ? '' : ' empty'}${src && src === opts.sel ? ' sel' : ''}${opts.dim ? ' dim' : ''}`;
  const icon = opts.icon ?? (it ? itemIcon(it) : '');
  const name = it ? itemName(it) : opts.label ?? '';
  return `<div class="${cls}" style="--t:${col}" title="${esc(name)}"${src && (it || opts.icon) ? ` data-src="${src}"` : ''}${opts.dst ? ` data-dst="${opts.dst}"` : ''}>` +
    (icon ? `<img src="${icon}" alt="">` : '') + (it?.level ? `<b>+${it.level}</b>` : '') + (opts.tag ? `<em>${opts.tag}</em>` : '') +
    (opts.label ? `<i>${opts.label}</i>` : '') + '</div>';
}

/** A grid of `size` squares, filled from `items` in order; `prefix:i` is each one's pick. */
export function grid(items: Item[], size: number, prefix: string, sel: string | null, dst?: string, tags?: (it: Item, i: number) => string): string {
  const n = Math.max(size, items.length);
  return `<div class="cells"${dst ? ` data-dst="${dst}"` : ''}>` +
    Array.from({ length: n }, (_, i) => cell(items[i] ?? null, items[i] ? `${prefix}:${i}` : null, { sel, dst, tag: items[i] && tags ? tags(items[i], i) : undefined })).join('') + '</div>';
}

/** What `it` would take the place of: the weapon in hand, the armor worn, the older ring once both are on. */
export function wornFor(h: Hero, it: Item): Item | null {
  const s = slotOf(it);
  if (s === 'weapon') return h.arms[h.weapon] ?? null;
  if (s === 'armor') return h.armor;
  return h.rings.length >= 2 ? h.rings[0] : null;
}

const delta = (r: Row, d: number) => (r.unit === 's' ? (d > 0 ? '+' : '') + d.toFixed(2) + ' s' : r.unit === '%' ? (d > 0 ? '+' : '') + Math.round(d * 100) + '%' : (d > 0 ? '+' : '') + Math.round(d * 10) / 10);

/** Every number, now and with `it` on instead, and the change. */
export function numbers(h: Hero, it: Item): string {
  const a = sheet(worn(h)), b = sheet(wearing(h, it));
  return '<div class="nums"><div class="nh"><span></span><i>NOW</i><i>WITH IT</i><i></i></div>' + a.map((r, i) => {
    if (!shown(r, h.weapon)) return '';
    const n = b[i], d = n.v - r.v, same = Math.abs(d) < 1e-3, good = r.low ? d < 0 : d > 0;
    return `<div class="${same ? 'same' : good ? 'up' : 'down'}"><span>${r.label}</span><i>${fmt(r)}</i><b>${fmt(n)}</b><em>${same ? '' : delta(r, d)}</em></div>`;
  }).join('') + '</div>';
}

/** Two cards side by side (what's worn there, and this), then the numbers. A piece for another class: just its card. */
export function sideBySide(h: Hero, it: Item, wornNow = false, mid = ''): string {
  const fits = !it.kit || WEAPONS[it.kit].cls === WEAPONS[h.weapon].cls;
  if (!fits) return `<div class="pair one"><div class="side">${card(it, h)}</div></div><div class="cmp none">Not for your class.</div>` + mid;
  if (wornNow) return `<div class="pair one"><div class="side"><div class="was">WORN</div>${card(it, h)}</div></div>` + mid;
  const on = wornFor(h, it), plain = slotOf(it) === 'weapon' && !on ? `<b>${WEAPONS[h.weapon].name}</b><div class="tr">Plain. No modifiers.</div>` : '';
  const left = on ? card(on, h) : plain || `<div class="tr">Nothing worn there.</div>`;
  return `<div class="pair"><div class="side"><div class="was">WORN NOW</div>${left}</div><div class="side"><div class="was">THIS</div>${card(it, h)}</div></div>` + mid + numbers(h, it);
}

/** The plain kit a class starts with (in hand when nothing better is). */
export const plainKit = (h: Hero) => CLASS_KITS[WEAPONS[h.weapon].cls][0];
