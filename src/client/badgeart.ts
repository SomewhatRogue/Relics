/**
 * The tailor's badges, drawn (docs/design/cloak-choice.md, slice 4): each a tiny pixel silhouette, about 6 or 7 pixels
 * across and 6 or 7 down in the hero sprite's own pixels, set between the shoulders of the cloth's back. It is drawn
 * in the cloth's edge metal (a bone colour when the edge is none) with a darker shade of the cloth round it, so it
 * reads on any dye. Nothing churchy: no star, no crown, no rope. Drawing only.
 */
import type { Put } from './cloaklife';
import { HS } from './heroscale';

/** The silhouettes, by the tailor's order (shared/clothlook.ts BADGES, none first): '#' is metal, '.' is cloth. */
export const BADGE_ART: string[][] = [
  [],
  // the gate: an arch, two doors
  ['..###..', '.#####.', '##.#.##', '##.#.##', '##.#.##', '##.#.##', '#######'],
  // the oak: a squat crown, a short trunk
  ['..###..', '.#####.', '#######', '.#####.', '...#...', '...#...', '..###..'],
  // the hound: running, in profile, head to the right
  ['.....#.', '#...###', '.######', '.#####.', '##...##', '#.....#'],
  // the torch: a forked flame over a cup on a handle (the first read like a little tree)
  ['.#..#', '.##.#', '#####', '.###.', '#####', '.###.', '..#..'],
  // the tooth: one long fang, curved
  ['.####', '.###.', '.###.', '..##.', '..##.', '..#..', '..#..'],
  // the cleaver: snapped, a crack running through the blade
  ['#####.', '####.#', '###.##', '##.###', '#.####', '..##..', '..##..'],
  // the ladder: two rails, four rungs
  ['#####', '#...#', '#####', '#...#', '#####', '#...#', '#####'],
  // the boot: one worn boot
  ['###...', '.##...', '.##...', '.###..', '.####.', '######', '#.##.#'],
];

/** A colour at `k` of its brightness. */
const dim = (c: string, k: number): string => '#' + [1, 3, 5].map((i) => Math.round(parseInt(c.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');

/** Where a badge's top-left sits so its middle is the sprite's (between its 18 columns). */
export const badgeX = (badge: number): number => 9 - Math.ceil((BADGE_ART[badge]?.[0].length ?? 0) / 2);

/** The metal pixels of a badge (x, y from its top left), and the ring of cloth pixels round them to shade. */
export function badgeDots(badge: number): { metal: [number, number][]; ring: [number, number][] } {
  const rows = BADGE_ART[badge] ?? [], metal: [number, number][] = [], ring: [number, number][] = [], seen = new Set<string>();
  rows.forEach((r, y) => [...r].forEach((ch, x) => ch === '#' && (metal.push([x, y]), seen.add(x + ',' + y))));
  for (const [x, y] of metal) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const k = x + dx + ',' + (y + dy);
    if (!seen.has(k)) (seen.add(k), ring.push([x + dx, y + dy]));
  }
  return { metal, ring };
}

/** A badge as a small picture for the tailor's button: its pixels as squares, in the metal it would be. */
export function badgeIcon(badge: number, metal: string): string {
  const rows = BADGE_ART[badge] ?? [];
  if (!rows.length) return '';
  const w = Math.max(...rows.map((r) => r.length)), cells = rows.flatMap((r, y) => [...r].map((ch, x) => (ch === '#' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : ''))).join('');
  return `<svg class="cl-badge" viewBox="0 0 ${w} 7" width="${w * 2}" height="14" fill="${metal}" shape-rendering="crispEdges" aria-hidden="true">${cells}</svg>`;
}

/** On the Warrior's cape seen from behind (herolife.ts): `top` is the cape's first row in old body pixels, `sx` the
 *  cape's sway there, `cloth` its colour. Whole sprite pixels, one drawn pixel to one pixel of the hero. */
export function badgeOnCape(put: Put, badge: number, metal: string, cloth: string, top: number, sx: number): void {
  if (!badge) return;
  const { metal: m, ring } = badgeDots(badge), x0 = badgeX(badge), y0 = Math.round((top + 2.4) * HS), shade = dim(cloth, 0.55);
  const px = (x: number, y: number, col: string) => put('front', (x0 + x) / HS + sx, (y0 + y) / HS, 1 / HS, 1 / HS, col, 3);
  for (const [x, y] of ring) px(x, y, shade);
  for (const [x, y] of m) px(x, y, metal);
}
