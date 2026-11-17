/**
 * The townsfolk from behind, walking away (Kyle, 2026-11-16: Sergeant Dunn "walking backwards around town": walking
 * north, up the screen, they showed their front, face and all). The same recipe as their front (npcs.ts `person`)
 * with no face, no apron or buttons: the back of the head in their hair's colour (or the skin, if they've none), the
 * hair kept but for what falls on the face (a beard). Chosen in drawNpc when they walk mostly north.
 */
import type { Look } from './npcs';
import { tallPerson } from './npcside';
import type { makeSprite, Sprite } from './sprites';

type Part = Parameters<typeof makeSprite>[2][number];

/** The back of the head: the colour of the hair that covers the crown, or the skin. */
function crown(l: Look): string {
  const top = l.hair.find((q) => q[0] === 'r' && (q[2] as number) <= 1 && (q[3] as number) >= 4);
  return top ? (top[5] as string) : l.skin;
}

function back(l: Look): Sprite {
  const parts: Part[] = [
    ['r', 3, 11, 2, 5, '#3a3036'], ['r', 7, 11, 2, 5, '#3a3036'], ['r', 3, 15, 2, 1, '#1a1410'], ['r', 7, 15, 2, 1, '#1a1410'],
    ['r', 2, 6, 8, 7, l.body], ['r', 2, 6, 8, 1, l.trim], ['r', 1, 7, 2, 4, l.body], ['r', 9, 7, 2, 4, l.body],
    ['p', 1, 11, l.skin], ['p', 10, 11, l.skin],
    // A belt across the back, cuffs, the heels of the boots; an apron's ties if they wear one.
    ['r', 2, 10, 8, 1, '#2a2018'], ['r', 1, 10, 2, 1, l.trim], ['r', 9, 10, 2, 1, l.trim], ['r', 3, 14, 2, 1, '#2a2024'], ['r', 7, 14, 2, 1, '#2a2024'],
  ];
  if (l.apron) parts.push(['r', 5, 9, 2, 1, l.apron]);
  // The head from behind: the neck in skin, the crown over it, then the hair (not what falls on the face).
  parts.push(['e', 6, 3.5, 3.4, 3.4, l.skin], ['e', 6, 3.2, 3.4, 3.1, crown(l)], ...l.hair.filter((q) => (q[2] as number) < 5));
  return tallPerson(parts);
}

const made: Record<string, Sprite> = {};
/** Someone from behind (made the first time, then kept). */
export const backPerson = (key: string, l: Look): Sprite => (made[key] ??= back(l));
