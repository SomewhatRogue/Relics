/**
 * Named body pieces on the floor (lootart.ts's armour rows, 9 by 7) and in the bag (itemicons.ts's tunic, 12 by
 * 12), as namedarmour.ts draws them on the hero: each its own cloth or metal (`main`, `dark`) and a few marks
 * (rivets, lacing, teeth, coins, blood). three/loot3d.ts takes `main` for a piece lying in 2.5D. Drawing only.
 */
type Mark = [number, number, string];
export interface ArmourArt { main: string; dark: string; floor: Mark[]; bag: Mark[] }

const each = (pts: number[][], col: string): Mark[] => pts.map(([x, y]) => [x, y, col]);

export const NAMED_ARMOUR_ART: Record<string, ArmourArt> = {
  // Riveted iron plate, dented all over.
  smeltplate: { main: '#6a6e74', dark: '#4e5258', floor: [...each([[1, 1], [4, 1], [7, 1], [2, 3], [6, 3], [4, 5]], '#b8bcc2'), ...each([[5, 4], [3, 2]], '#34373c')], bag: [...each([[3, 2], [8, 2], [3, 5], [8, 5], [4, 9], [7, 9]], '#b8bcc2'), ...each([[6, 6], [3, 8]], '#34373c')] },
  // Iron plates laced together.
  ironscales: { main: '#545860', dark: '#3a3e44', floor: each([[2, 1], [2, 3], [2, 5], [4, 2], [4, 4], [6, 1], [6, 3], [6, 5]], '#7a5434'), bag: each([[3, 4], [3, 6], [3, 8], [5, 5], [5, 9], [7, 4], [7, 6], [7, 8], [8, 5], [8, 9]], '#7a5434') },
  // Steel mail gone dark with cave water.
  dampmail: { main: '#46505a', dark: '#2e343c', floor: each([[3, 1], [6, 2], [2, 4], [5, 5]], '#8aa4b4'), bag: each([[3, 3], [8, 4], [4, 7], [7, 8], [2, 6]], '#8aa4b4') },
  // A belt hung with teeth.
  mawlbelt: { main: '#5a4028', dark: '#3a2818', floor: [...each([[1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5]], '#2a1c10'), ...each([[1, 6], [3, 6], [5, 6], [7, 6]], '#e8dcb8')], bag: [...each([[2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8]], '#2a1c10'), ...each([[2, 9], [4, 10], [6, 9], [8, 10]], '#e8dcb8')] },
  // Raw hide, scarred, never cured.
  skarnhide: { main: '#7a5644', dark: '#5a3c30', floor: each([[2, 2], [3, 3], [4, 4], [6, 1], [7, 2]], '#c8a890'), bag: each([[3, 3], [4, 4], [5, 5], [7, 3], [8, 4], [6, 8], [7, 9]], '#c8a890') },
  // Leather stiff with old cooking.
  spoonapron: { main: '#7a5a3a', dark: '#5e4430', floor: each([[3, 2], [5, 4], [2, 5], [6, 3]], '#3a2818'), bag: each([[4, 4], [7, 5], [3, 7], [6, 8], [8, 9]], '#3a2818') },
  // Leather the fen turned black, waxed at the seams.
  fenhide: { main: '#221e22', dark: '#16141a', floor: each([[4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [1, 2], [7, 2]], '#5a5048'), bag: each([[5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9], [2, 4], [9, 4]], '#5a5048') },
  // The Butcher's Apron: pale, bloodied.
  apron: { main: '#b8ac98', dark: '#8a7c68', floor: each([[3, 2], [5, 3], [2, 4], [6, 5], [4, 5]], '#7a1e1e'), bag: each([[4, 4], [7, 5], [3, 7], [6, 8], [8, 9], [5, 6]], '#7a1e1e') },
  // The Ransom Coat: dark, coins sewn on.
  ransom: { main: '#3a2a3a', dark: '#2a1e2a', floor: each([[2, 1], [6, 1], [3, 3], [5, 3], [2, 5], [6, 5], [4, 4]], '#e8c050'), bag: each([[3, 3], [8, 3], [4, 6], [7, 6], [3, 9], [8, 9], [5, 8]], '#e8c050') },
};
