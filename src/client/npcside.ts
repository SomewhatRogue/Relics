/**
 * The townsfolk in profile walking across (docs/design/side-view.md slice 3): the same recipe as their
 * front (npcs.ts: a body colour, trim, skin, hair, an apron) laid out facing east, mirrored for west, in
 * two frames on the walk's bob: contact (the legs apart) and passing (together). Their hair, written for
 * the front, is carried round: hair on top a pixel toward the back, a beard a pixel toward the face, side
 * locks over the face dropped, anything wide (a brim) left as it is.
 */
import { grow, makeSprite, type Sprite } from './sprites';
import type { Look } from './npcs';

type Part = Parameters<typeof makeSprite>[2][number];

/** The heroes' proportions on a 12-wide recipe: the head's rows smaller, the body's longer, then redrawn at 1.5x. */
export function tallPerson(parts: Part[]): Sprite {
  // A tall hat reaches above the head: grow the sprite upward to fit it.
  const lift = Math.max(0, ...parts.map((q) => -(q[2] as number)));
  const neck = lift + 6, Y = (y: number) => (y <= neck ? y * 0.8 : neck * 0.8 + (y - neck) * 1.55);
  const tall = parts.map((q): Part => {
    const y = (q[2] as number) + lift;
    if (q[0] === 'e') return ['e', q[1], Y(y), q[3], (q[4] as number) * 0.8, q[5]] as Part;
    if (q[0] === 'r') return ['r', q[1], Y(y), q[3], Math.max(0.7, Y(y + (q[4] as number)) - Y(y)), q[5]] as Part;
    return ['p', q[1], Math.round(Y(y + 0.5) - 0.5), q[3]] as Part;
  });
  return makeSprite(18, Math.round(Y(16 + lift) * 1.5), grow(tall));
}

const LEG = '#3a3036', FAR = '#26202a', BOOT = '#2a2024', SOLE = '#1a1410';

/**
 * The hair round to the side (see the top of the file). `hat`: deep headwear (a helm, a steel cap, a hood: three rows
 * or more from the crown) sits square on the head and its rim comes forward over the brow. Shifted back like hair it
 * overhung the back of the head and read as a peaked cap worn the wrong way round, so a guard walking east looked
 * as if he faced west (Kyle, 2026-11-17: "guards who are walking to the right seem to be looking left").
 */
function sideHair(q: Part, hat = false): Part | null {
  if (q[0] !== 'r') return q;
  const [, x, y, w, h, col] = q as unknown as [string, number, number, number, number, string];
  if (w >= 7) return q;
  if (hat) return y < 2 ? q : ['r', x + 1, y, w, h, col];
  if (y >= 5) return ['r', x + 1, y, w, h, col];
  if (y >= 2 && x >= 7) return null;
  return ['r', x - 1, y, w, h, col];
}

/** `apart`: the contact frame, the far leg out in front and the near one behind; else passing, the legs together. */
function profile(l: Look, apart: boolean): Sprite {
  const legs: Part[] = apart
    ? [['r', 5, 11, 2, 2, FAR], ['r', 7, 13, 2, 2, FAR], ['r', 7, 15, 3, 1, SOLE], ['r', 5, 11, 2, 2, LEG], ['r', 3, 13, 2, 2, LEG], ['r', 3, 14, 2, 1, BOOT], ['r', 2, 15, 3, 1, SOLE]]
    : [['r', 4, 11, 2, 5, FAR], ['r', 4, 15, 2, 1, SOLE], ['r', 5, 11, 2, 4, LEG], ['r', 5, 14, 3, 1, BOOT], ['r', 5, 15, 3, 1, SOLE]];
  const parts: Part[] = [...legs, ['r', 4, 6, 5, 7, l.body], ['r', 4, 6, 5, 1, l.trim], ['r', 4, 10, 5, 1, '#2a2018'], ['p', 8, 10, '#a89060']];
  if (l.apron) parts.push(['r', 7, 8, 2, 5, l.apron], ['r', 7, 8, 2, 1, '#3a2a20']);
  else parts.push(['p', 8, 7, '#2a2420']);
  // The near arm, swinging back as the near leg goes back.
  parts.push(...((apart ? [['r', 4, 7, 2, 3, l.body], ['r', 3, 10, 2, 1, l.trim], ['p', 3, 11, l.skin]] : [['r', 5, 7, 2, 3, l.body], ['r', 5, 10, 2, 1, l.trim], ['p', 6, 11, l.skin]]) as Part[]));
  // The head facing east: one eye, the nose, the mouth.
  parts.push(['e', 6, 3.5, 3, 3.4, l.skin], ['p', 9, 4, l.skin], ['p', 8, 4, '#141218'], ['p', 8, 5, '#6a3a2a']);
  const hat = l.hair.some((q) => q[0] === 'r' && (q[2] as number) <= 0 && (q[3] as number) >= 6 && (q[4] as number) >= 3);
  for (const q of l.hair) {
    const s = sideHair(q, hat);
    if (s) parts.push(s);
  }
  return tallPerson(parts);
}

const made: Record<string, [Sprite, Sprite]> = {};
/** Someone in profile, `apart` or passing (made the first time, then kept). */
export function sidePerson(key: string, l: Look, apart: boolean): Sprite {
  const pair = (made[key] ??= [profile(l, true), profile(l, false)]);
  return pair[apart ? 0 : 1];
}
