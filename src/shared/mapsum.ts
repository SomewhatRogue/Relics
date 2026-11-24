/**
 * A fingerprint of a map's ground: what decides where a body can stand and how the ground lies. The leader says it
 * with a whole big room, and a friend that built that room's map from the run (shared/guestmap.ts) checks its own
 * against it: a page on an older build, or a generator that isn't perfectly repeatable, builds another map, and
 * its friends walk through trees and walls (Kyle, 2026-11-24). 32 bits, in array order, numbers to 3 places.
 */
import type { Area, GameMap } from './arena.js';

const n = (v: number | undefined): string => (v === undefined ? '-' : String(Math.round(v * 1000) / 1000));
const area = (a: Area | null | undefined): string => (a ? [a.x, a.y, a.w, a.h].map(n).join(',') : '-');

export function mapSum(map: GameMap): number {
  const parts: string[] = [`m${n(map.w)},${n(map.h)}`, `i${n(map.hero.x)},${n(map.hero.y)}`, `e${area(map.exit)}`];
  for (const r of map.rounds) parts.push(`r${r.kind},${n(r.x)},${n(r.y)},${n(r.r)}`);
  for (const b of map.blocks) parts.push(`b${b.kind},${n(b.x)},${n(b.y)},${n(b.w)},${n(b.h)}`);
  for (const w of map.water ?? []) parts.push(`w${n(w.x)},${n(w.y)},${n(w.w)},${n(w.h)},${w.deep ? 1 : 0}`);
  for (const l of map.ledges ?? []) parts.push(`l${n(l.x)},${n(l.y)},${n(l.w)},${n(l.h)},${n(l.lv)},${l.kind ?? '-'}:${l.ramps.map(area).join(';')}`);
  // FNV-1a over the text, one code unit at a time.
  let h = 0x811c9dc5;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) (h ^= s.charCodeAt(i)), (h = Math.imul(h, 0x01000193));
  return h >>> 0;
}
