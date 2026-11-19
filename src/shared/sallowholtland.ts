/**
 * THE WILLOW HOLT's ground (shared/sallowholt.ts; docs/design/territories.md, "3. Sallow Carr"; heights by
 * docs/design/elevation.md, "Raised areas"): the main bank, the black water of the holt and the dry ground in it,
 * the duckboards, the gate and the two stretches. All fixed by hand. Pure.
 *
 *   Level 0: the holt, a willow wood standing in water nobody has let out for years. Level 1: the main bank, the whole
 *   north of the map from its stone face (y 30, toward the camera) to the top edge, so nothing ever drops away to the
 *   north. Two ways up: a flight where the duckboards come to the bank, and narrow steps at its east end. Along the
 *   face's foot runs a dry strip, the old towpath, cut off from the holt by the water but for the gate on the boards.
 */
import { levelAt, type Area, type Block, type GameMap, type Ledge, type Stretch, type Water } from './arena.js';
import { claim, type Kit } from './expedkit.js';
import { gateIn } from './terrkit.js';

export const HOLT = { w: 96, h: 100 };
/** The main bank: one box a level up, its stone face across the map at y 30. */
export const BANK = { x: 0, y: 0, w: 96, h: 30, lv: 1 };
export const FACE = BANK.y + BANK.h;
/** The flight where the boards meet the bank (six wide, three deep), and the narrow steps at its east end. */
export const FLIGHT: Area = { x: 42, y: 28.5, w: 6, h: 3 };
export const STEPS: Area = { x: 86, y: 28.5, w: 2.5, h: 3 };
/** The hurdle gate across the boards where they come out of the water onto the towpath. */
export const GATE: Area = { x: 43, y: 37.2, w: 4, h: 0.8 };
/** The way out: the top edge at the bank's west end, far from the hoard. */
export const OUT: Area = { x: 5, y: 0, w: 4, h: 0.9 };

type R = [number, number, number, number];
/** The duckboards, leg by leg from the drained cut up to the gate (x0, y0, x1, y1): they twist, never cut across. */
export const BOARDWALK: R[] = [
  [47, 79.6, 49, 88.4], [38, 79.6, 49, 81.6], [38, 70.4, 40, 81.6], [37, 62, 54, 64], [52, 49.6, 54, 64], [44, 49.6, 54, 51.6], [44, 37.6, 46, 51.6],
];
/** The side boards east off the long leg to the web pocket: a dead end. */
export const SIDEWALK: R = [54, 56.6, 68.2, 58.4];
/** Dry ground in the water (cx, cy, rx, ry): the camp's hummock, the bend's, the web pocket's, and a few nobody reaches. */
export const CAMP = { x: 33.6, y: 66.6, rx: 7.2, ry: 4.8 };
export const BEND = { x: 56, y: 50.6, rx: 3.6, ry: 2.6 };
export const POCKET = { x: 73, y: 57.6, rx: 5.8, ry: 4.2 };
const ISLES: [number, number, number, number][] = [
  [CAMP.x, CAMP.y, CAMP.rx, CAMP.ry], [BEND.x, BEND.y, BEND.rx, BEND.ry], [POCKET.x, POCKET.y, POCKET.rx, POCKET.ry],
  [14, 80, 3.4, 2.2], [76, 82, 3, 2], [20, 52, 3.8, 2.4], [84, 44, 3, 2], [64, 70, 2.4, 1.6], [10, 62, 2.6, 1.8],
];
/** The drained cut you come up: a hard bottom between the old ditch banks. */
export const CUT = { x: 41, y: 87.4, w: 14, h: 12.6 };

const G = 0.5, DRY = 0, SHALLOW = 1, DEEP = 2;
const inR = (r: R, x: number, y: number) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
const inOval = (o: [number, number, number, number], x: number, y: number, grow = 0) => ((x - o[0]) / (o[2] + grow)) ** 2 + ((y - o[1]) / (o[3] + grow)) ** 2 <= 1;
/** Where the towpath's foot meets the water (it wanders, but is straight across the gate). */
const footY = (x: number) => (Math.abs(x - 45) < 6 ? 38 : 38 + 0.9 * Math.sin(x / 4.3) + 0.4 * Math.sin(x / 1.7));
/** Where the cut's top meets the water (a bay, so the cut opens into the holt without a straight edge). */
const cutTop = (x: number) => CUT.y + 0.06 * (x - 48) ** 2;

/** What lies at (x, y): 0 dry, 1 shallow, 2 deep (the boards count dry). Pure, for laying things on it. */
export function groundAt(x: number, y: number): number {
  if (y < footY(x)) return DRY;
  if (BOARDWALK.some((r) => inR(r, x, y)) || inR(SIDEWALK, x, y)) return DRY;
  if (x >= CUT.x && x < CUT.x + CUT.w && y >= cutTop(x)) return DRY;
  for (const o of ISLES) if (inOval(o, x, y)) return DRY;
  for (const o of ISLES) if (inOval(o, x, y, 0.9)) return SHALLOW;
  if (y < footY(x) + 0.9) return SHALLOW;
  return DEEP;
}

/** The water as boxes, painted on a half-tile grid and joined row to row: every edge an oval in bands, never a tank. */
export function waterOf(): Water[] {
  const cols = HOLT.w / G, rows = HOLT.h / G, water: Water[] = [];
  let open = new Map<string, Water>();
  for (let j = 0; j < rows; j++) {
    const next = new Map<string, Water>();
    for (let i = 0; i < cols;) {
      const v = groundAt((i + 0.5) * G, (j + 0.5) * G);
      let e = i + 1;
      while (e < cols && groundAt((e + 0.5) * G, (j + 0.5) * G) === v) e++;
      if (v !== DRY) {
        const key = `${i}.${e}.${v}`, up = open.get(key);
        if (up) (up.h += G), next.set(key, up);
        else {
          const w: Water = { x: i * G, y: j * G, w: (e - i) * G, h: G, ...(v === DEEP ? { deep: true } : {}) };
          water.push(w), next.set(key, w);
        }
      }
      i = e;
    }
    open = next;
  }
  return water;
}

/** The boards as decks (never collided with), a hand over each bank so they read as laid across. */
export function boardsOf(): Block[] {
  return [...BOARDWALK, SIDEWALK].map(([x0, y0, x1, y1]): Block => ({ kind: 'boards', deck: true, x: x0 - 0.1, y: y0 - 0.1, w: x1 - x0 + 0.2, h: y1 - y0 + 0.2 }));
}

/** What the places need from the ground. */
export interface HoltLand { ledges: Ledge[]; lv: (x: number, y: number) => number; stretches: Stretch[] }

export function layLand(k: Kit): HoltLand {
  const ledges: Ledge[] = [{ ...BANK, ramps: [{ ...FLIGHT }, { ...STEPS }], kind: 'crag' }];
  const lv = (x: number, y: number) => levelAt({ ledges } as unknown as GameMap, x, y);
  k.water.push(...waterOf()), k.blocks.push(...boardsOf());
  // Kept clear: the way in, the boards (a tile either side), the flight's foot and head, the steps', the way out.
  for (const [x0, y0, x1, y1] of [...BOARDWALK, SIDEWALK]) for (let x = x0; x <= x1; x += 1) for (let y = y0; y <= y1; y += 1) claim(k, x, y, 1.2);
  for (const [x, y, r] of [[48, 96.5, 2.6], [45, 34, 2.6], [45, 26, 2.4], [87.2, 34, 1.8], [87.2, 26.4, 1.8], [7, 1.8, 2.2]] as const) claim(k, x, y, r);
  // The gate keeps the holt's pack; you gather on the boards before it and get up again on the towpath behind it.
  const s0 = gateIn(k, GATE, 'THE WILLOW HOLT', [420], { x: 44, y: GATE.y + GATE.h, w: 2, h: 2.6 }, { x: 45, y: 34.6 });
  const s1: Stretch = { name: 'THE SLUICE HOUSE', keep: [], packs: [421, 422, 423, 424] };
  return { ledges, lv, stretches: [s0, s1] };
}
