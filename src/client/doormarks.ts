/**
 * Out in the street on a job: over each house door with a friend inside, their name in their class's
 * colour, just above the door (one over another if there are more, under the quest mark's diamond),
 * so whoever's outside can see where they went. Drawing only: who's where is the leader's game's
 * (jobrooms.ts).
 */
import type { HeroClass } from '../shared/tuning';
import type { Ctx } from './draw';
import type { DoorMark } from './jobrooms';
import type { Light } from './light';
import { drawText, textWidth } from './pixfont';
import { OX, OY, PX } from './world';

const CLASS_COL: Record<HeroClass, string> = { WARRIOR: '#f0b070', RANGER: '#9ee07a', ROGUE: '#d8d0e8', MAGE: '#c0a4ff', HEALER: '#fff09a' };
/** Screen pixels above the door's foot to the first name's top, and from one name to the next. */
const LIFT = 30, LINE = 7;

/** The names over each door in `marks`, the camera at (cx, cy). Returns a faint warm light at each. */
export function drawDoorMarks(c: Ctx, marks: DoorMark[], cx: number, cy: number): Light[] {
  const g = c.glow, lights: Light[] = [];
  for (const m of marks) {
    const x = Math.round(OX + m.x * PX - cx), y = Math.round(OY + m.y * PX - cy) - LIFT;
    m.who.forEach((w, i) => drawText(g, w.name, x - Math.floor(textWidth(w.name) / 2), y - i * LINE, CLASS_COL[w.cls] ?? '#ffffff'));
    lights.push({ x, y: y + 12, r: 22, i: 0.35, c: [1, 0.8, 0.5] });
  }
  return lights;
}
