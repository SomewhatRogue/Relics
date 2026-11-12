/**
 * The butcher at 1.5x (art pass, docs/design/art-pass.md): 27 by 33, drawn again, and every named one
 * its own: a build, a trophy and a weapon picked steadily from its name (the same butcher looks the same
 * every time, for everyone). THE STOKER has his own: soot to the eyes and a poker. Pure data: sprites.ts
 * and foes.ts make the sprites. Looks only: the swing, its reach and its telegraph are the room's.
 */
import type { Part } from './sprites';

export type Build = 'heavy' | 'hunch' | 'lean';
export type Trophy = 'none' | 'skulls' | 'ears' | 'helm' | 'teeth';
export type Arms = 'cleaver' | 'hook' | 'maul' | 'poker';
/** `hempen`: the Hempen Man (1), torn open in his second phase (2). */
/** `tone`: which of three sickly greens its hide is, and which of three aprons it wears. */
export interface ButcherLook { build: Build; trophy: Trophy; arms: Arms; soot: boolean; hempen?: 1 | 2; tone?: number }

export const PLAIN_BUTCHER: ButcherLook = { build: 'heavy', trophy: 'none', arms: 'cleaver', soot: false };
const BUILDS: Build[] = ['heavy', 'hunch', 'lean'], TROPHIES: Trophy[] = ['skulls', 'ears', 'helm', 'teeth'], ARMS: Arms[] = ['cleaver', 'hook', 'maul'];

/** A named butcher's look, from its name (a plain one, unnamed, is the heavy build with a cleaver). */
export function butcherLook(name: string | undefined, variant?: string, hempen?: 1 | 2): ButcherLook {
  // The Hempen Man (docs/design/art-pass.md): rope and sacking, the gallows lean, a hook.
  if (hempen) return { build: 'lean', trophy: 'none', arms: 'hook', soot: false, hempen };
  if (variant === 'stoker') return { build: 'heavy', trophy: 'none', arms: 'poker', soot: true };
  if (!name) return PLAIN_BUTCHER;
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  h >>>= 0;
  return { build: BUILDS[h % 3], trophy: TROPHIES[(h >>> 4) % 4], arms: ARMS[(h >>> 8) % 3], soot: false, tone: (h >>> 12) % 3 };
}

const FOOT = '#2a3418', BONE = '#e8e0cc', DARK = '#2a1a14', EYE = '#ff4a3a';
/** Hide (skin, shade, leg) and apron (cloth, strap) by tone: the plain green and leather, a yellower green and hide, a grey-green and blood-brown. */
const HIDES = [['#5b6b2a', '#4a5a22', '#3a4a1f'], ['#6e7a2a', '#5a6622', '#454e1c'], ['#4e6236', '#3e5028', '#33421f']];
const APRONS = [['#8a7a66', '#6a5a48'], ['#9a8a5a', '#6a5a38'], ['#6a4a40', '#4a3028']];
let SKIN = HIDES[0][0], SHADE = HIDES[0][1], LEG = HIDES[0][2];

/** The body in parts, facing you or walking away (`up`). */
export function butcherParts(l: ButcherLook, up: boolean): Part[] {
  const lean = l.build === 'lean', hunch = l.build === 'hunch', t = l.tone ?? 0;
  [SKIN, SHADE, LEG] = HIDES[t];
  const apron = l.soot ? '#3a3430' : APRONS[t][0], strap = l.soot ? '#24201e' : APRONS[t][1];
  // How wide the belly, how low the head sits (a hunch carries it forward and down), how long the leg.
  // (`hy` a whole row: the head's ellipse is centred half a pixel under it.)
  const rx = lean ? 8 : 11.2, hy = hunch ? 10 : lean ? 5 : 7, legY = lean ? 22 : 25;
  const p: Part[] = [
    ['r', 7, legY, 5, 33 - legY - 2, LEG], ['r', 15, legY, 5, 33 - legY - 2, LEG], ['r', 6, 31, 6, 2, FOOT], ['r', 15, 31, 6, 2, FOOT],
    // Detail (the art pass): rag wraps round the legs, claws on the toes.
    ['r', 7, 27, 5, 1, '#4a3a28'], ['r', 15, 27, 5, 1, '#4a3a28'], ['r', 7, 29, 5, 1, '#3e3020'], ['r', 15, 29, 5, 1, '#3e3020'],
    ['p', 6, 32, BONE], ['p', 11, 32, BONE], ['p', 15, 32, BONE], ['p', 20, 32, BONE],
    ['e', 13.5, 19.5, rx, 9.8, SKIN], ['r', 5, 26, 17, 1, SHADE],
    // A hunch: the back humped up over the head; a lean one's neck long and thin.
    ...(hunch ? ([['e', 13.5, 12, 9, 4.5, SKIN], ['r', 7, 9, 13, 1, SHADE]] as Part[]) : lean ? ([['r', 11, 9, 5, 4, SKIN]] as Part[]) : []),
    // Arms hanging thick at its sides, the hands big.
    ['r', lean ? 2 : 1, 15, 4, 9, SKIN], ['r', lean ? 21 : 22, 15, 4, 9, SKIN], ['r', lean ? 2 : 1, 23, 4, 3, SHADE], ['r', lean ? 21 : 22, 23, 4, 3, SHADE],
  ];
  if (!up) p.push(
    ['r', 8, 15, 11, 13, apron], ['r', 9, 12, 2, 4, strap], ['r', 16, 12, 2, 4, strap],
    ...(l.soot ? ([['p', 10, 18, '#1a1614'], ['r', 13, 20, 3, 1, '#1a1614'], ['p', 16, 24, '#1a1614'], ['p', 12, 26, '#ff8a3a']] as Part[])
      : ([['r', 10, 19, 2, 1, '#6b1a1a'], ['p', 12, 20, '#6b1a1a'], ['r', 15, 18, 1, 2, '#7a1d1d'], ['r', 11, 24, 3, 1, '#6b1a1a'], ['p', 16, 25, '#7a1d1d']] as Part[])),
  );
  else p.push(['r', 9, 15, 2, 12, strap], ['r', 16, 15, 2, 12, strap], ['r', 9, 21, 9, 2, strap]);
  // The head, the ears out to the sides.
  p.push(['e', 13.5, hy + 0.5, 6, 6, SKIN], ['r', 4, hy - 2, 4, 1, SKIN], ['p', 5, hy - 3, SKIN], ['r', 19, hy - 2, 4, 1, SKIN], ['p', 21, hy - 3, SKIN]);
  if (up) p.push(['r', 10, hy + 3, 7, 3, SHADE], ['r', 10, hy - 3, 7, 1, SHADE]);
  else {
    p.push(['e', 13.5, hy + 3.5, 5, 2.6, SHADE], ['r', 9, hy - 2, 4, 1, SHADE], ['r', 14, hy - 2, 4, 1, SHADE], ['p', 11, hy - 1, EYE], ['p', 16, hy - 1, EYE], ['r', 13, hy, 2, 2, SHADE]);
    p.push(['r', 11, hy + 3, 6, 1, DARK], ['p', 10, hy + 3, BONE], ['p', 17, hy + 3, BONE], ['p', 10, hy + 2, BONE], ['p', 17, hy + 2, BONE]);
    if (l.soot) p.push(['r', 9, hy - 3, 10, 1, '#2a2622'], ['p', 12, hy + 1, '#2a2622'], ['p', 15, hy, '#2a2622']);
    // A ring through the nose, an old scar across the brow.
    if (!l.hempen) p.push(['p', 13, hy + 2, '#b8b0a0'], ['p', 14, hy + 2, '#8a8478'], ['r', 16, hy - 4, 1, 3, '#3a4a1a'], ['p', 17, hy - 2, '#3a4a1a']);
  }
  if (l.hempen) p.push(...hempenParts(l.hempen, up, hy));
  // Its trophy.
  if (l.trophy === 'skulls') for (const sx of up ? [] : [7, 18]) p.push(['r', sx + 1, 24, 1, 3, '#5a4a30'], ['e', sx + 1.5, 28.5, 2.5, 2.3, BONE], ['p', sx, 28, DARK], ['p', sx + 2, 28, DARK], ['p', sx + 1, 30, DARK]);
  if (l.trophy === 'ears' && !up) for (let i = 0; i < 5; i++) p.push(['r', 8 + i * 2, 14 + (i % 2), 2, 2, '#a07858'], ['p', 9 + i * 2, 15 + (i % 2), '#5a3a2a']), p.push(['r', 8, 14, 11, 1, '#6a5a48']);
  if (l.trophy === 'helm') p.push(['r', 8, hy - 7, 11, 4, '#9aa2ac'], ['r', 7, hy - 4, 13, 1, '#6a727c'], ['r', 10, hy - 7, 3, 1, '#d4dce4'], ['p', 15, hy - 6, '#4a525c'], ['p', 16, hy - 5, '#4a525c'], ['r', 13, hy - 9, 2, 2, '#c0392b']);
  if (l.trophy === 'teeth' && !up) for (let i = 0; i < 7; i++) p.push(['r', 7 + i * 2, 13 + Math.round(Math.abs(i - 3) * -0.6 + 2), 1, 2, BONE]);
  return p;
}

const ROPE = '#a89a72', KNOT = '#7a6e50', SACK = '#8a7a5a', STITCH = '#6a5a40';
/** The Hempen Man over the lean body: sacking for an apron and a hood, rope coiled across him, nooses at the belt. */
function hempenParts(phase: 1 | 2, up: boolean, hy: number): Part[] {
  const p: Part[] = [['r', 8, 15, 11, 13, SACK], ['r', 8, 19, 11, 1, STITCH], ['r', 8, 24, 11, 1, STITCH]];
  // The rope from the shoulder across to the hip, a coil of it at the side.
  for (let i = 0; i < 11; i++) p.push(['p', up ? 18 - i : 8 + i, 13 + i, i % 3 ? ROPE : KNOT]);
  p.push(['e', 6, 24, 2, 2.5, ROPE], ['p', 6, 24, KNOT]);
  // Two nooses hung off the belt.
  if (!up) for (const nx of [10, 17]) p.push(['e', nx + 0.5, 29.5, 1.6, 2, ROPE], ['p', nx, 29, '#2a2420'], ['r', nx, 26, 1, 2, ROPE]);
  // The hood: sacking over the whole head, stitched, tied at the neck.
  p.push(['e', 13.5, hy + 0.5, 6.4, 6.6, SACK], ['r', 9, hy - 3, 10, 1, STITCH], ['p', 13, hy - 5, STITCH], ['r', 8, hy + 5, 11, 1, ROPE], ['p', 18, hy + 6, ROPE], ['p', 19, hy + 7, KNOT]);
  if (!up) {
    // Eye holes cut rough, the eyes burning in them.
    p.push(['r', 10, hy - 1, 2, 2, '#1a1410'], ['r', 15, hy - 1, 2, 2, '#1a1410'], ['p', 11, hy - 1, '#ff4a3a'], ['p', 16, hy - 1, '#ff4a3a'], ['r', 12, hy + 2, 3, 1, STITCH]);
    // Torn open (his second phase): the green under it, the eye wide, red at the rip.
    if (phase === 2) p.push(['r', 14, hy - 3, 4, 3, '#5b6b2a'], ['r', 15, hy - 1, 2, 1, '#ff4a3a'], ['p', 18, hy - 2, '#7a1d1d'], ['p', 13, hy - 3, '#7a1d1d'], ['p', 17, hy + 1, '#7a1d1d']);
  }
  return p;
}

/** Bodies left behind: without a head (a red stump), or burned black, from the plain build. */
export function headlessParts(): Part[] {
  return [...butcherParts(PLAIN_BUTCHER, false).filter((q) => (q[2] as number) >= 12), ['r', 10, 11, 8, 3, '#7a1d1d'], ['r', 12, 10, 4, 1, '#9a2a2a']];
}
