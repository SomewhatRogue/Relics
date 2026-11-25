/**
 * The butcher in profile, facing east (mirrored for west), for one going mostly across the screen (Kyle,
 * 2026-11-25: goblins side on, "all gobbos"). The same 27 by 33 canvas and BUTCHER_CUT as the front
 * (butcherparts.ts): the head above row 14, the legs from 25, the far leg in the left half and darker, the near one
 * in the right, so the side stride walks it; the near arm reaching forward to the hand the cleaver is drawn at
 * (x 21 on: the weapon arm's box). Every build (heavy, hunched, lean), tone, trophy, the Stoker's soot and the
 * Hempen Man's sacking, from the same look. Pure data.
 */
import { APRONS, BONE, DARK, EYE, FOOT, HIDES, KNOT, ROPE, SACK, STITCH, type ButcherLook } from './butcherparts';
import type { Part } from './sprites';

export function butcherSideParts(l: ButcherLook): Part[] {
  const lean = l.build === 'lean', hunch = l.build === 'hunch', [SKIN, SHADE, LEG] = HIDES[l.tone ?? 0];
  const apron = l.soot ? '#3a3430' : APRONS[l.tone ?? 0][0], strap = l.soot ? '#24201e' : APRONS[l.tone ?? 0][1];
  // The belly's depth front to back, the head's height and how far forward it's carried, the leg's length.
  const rx = lean ? 5.5 : hunch ? 7.5 : 8.2, hy = hunch ? 10 : lean ? 5 : 7, hx = hunch ? 17.5 : lean ? 15 : 16, legY = lean ? 22 : 25;
  const p: Part[] = [
    // The far leg (left half), a shade darker, a stride behind; its foot pointing forward, claws on the toes.
    ['r', 9, legY, 4, 31 - legY, SHADE], ['r', 9, 31, 5, 2, FOOT], ['p', 13, 32, BONE], ['r', 9, 27, 4, 1, '#3e3020'],
    // The far arm, just showing behind the back.
    ['r', 4, 16, 3, 7, SHADE], ['r', 4, 22, 3, 2, LEG],
    // The belly, carried forward, and the back behind it; a hunch's hump over its shoulders, a lean one's long neck.
    ['e', 14.5, 19.5, rx, 9.8, SKIN], ['r', 8, 26, 13, 1, SHADE], ['p', 8, 17, SHADE], ['p', 9, 22, SHADE],
    ...(hunch ? ([['e', 11, 12.5, 6.5, 4.5, SKIN], ['r', 7, 10, 7, 1, SHADE]] as Part[]) : lean ? ([['r', 12, 8, 4, 5, SKIN]] as Part[]) : []),
    // The apron hanging down its front, its strap over the shoulder; blood (or soot) on it.
    ['r', 18 - (lean ? 1 : 0), 15, 4, 12, apron], ['r', 18 - (lean ? 1 : 0), 15, 4, 1, strap], ['r', 14, 12, 2, 3, strap], ['r', 12, 15, 2, 9, strap],
    ...(l.soot ? ([['p', 19, 18, '#1a1614'], ['p', 20, 22, '#1a1614'], ['p', 19, 25, '#ff8a3a']] as Part[])
      : ([['r', 19, 19, 2, 1, '#6b1a1a'], ['p', 20, 21, '#7a1d1d'], ['p', 19, 24, '#6b1a1a']] as Part[])),
    // The near leg (right half): thick, rag-wrapped, a clawed foot forward.
    ['r', 14, legY, 5, 31 - legY, LEG], ['r', 14, 27, 5, 1, '#4a3a28'], ['r', 14, 29, 5, 1, '#3e3020'], ['r', 14, 31, 7, 2, FOOT], ['p', 20, 32, BONE], ['p', 19, 32, BONE],
    // The near arm from the shoulder, thick, a bracer with a rivet, down and forward to the big hand (x 21 on).
    ['r', 14, 14, 4, 6, SKIN], ['r', 16, 18, 5, 4, SKIN], ['r', 17, 19, 4, 1, '#4a3a28'], ['p', 18, 19, '#9a96a4'], ['r', 21, 20, 4, 4, SKIN], ['r', 21, 23, 4, 1, SHADE], ['p', 25, 22, BONE], ['p', 25, 23, BONE],
  ];
  // The head in profile: the skull, the heavy jaw and tusks out in front, the broad nose with its ring, one eye under the
  // brow, the ear swept back with a ring in it, an old scar.
  p.push(
    ['e', hx, hy + 0.5, 5.5, 5.5, SKIN], ['r', hx + 2, hy + 1, 5, 4, SKIN], ['r', hx + 4, hy - 1, 3, 2, SKIN], ['p', hx + 7, hy, SKIN],
    ['r', hx + 1, hy - 3, 5, 1, SHADE], ['p', hx + 4, hy - 2, EYE], ['p', hx + 6, hy + 1, DARK],
    ['r', hx + 3, hy + 4, 5, 1, DARK], ['p', hx + 7, hy + 3, BONE], ['p', hx + 7, hy + 2, BONE], ['r', hx + 2, hy + 5, 4, 1, SHADE],
    ['r', hx - 7, hy - 2, 4, 1, SKIN], ['p', hx - 8, hy - 3, SKIN], ['r', hx - 6, hy - 1, 2, 1, SHADE],
  );
  if (!l.hempen) p.push(['p', hx + 6, hy + 2, '#b8b0a0'], ['p', hx - 5, hy, '#c0a050'], ['r', hx, hy - 4, 1, 3, '#3a4a1a']);
  if (l.soot) p.push(['r', hx, hy - 3, 6, 1, '#2a2622'], ['p', hx + 3, hy + 1, '#2a2622']);
  if (l.hempen) {
    // The Hempen Man: a sacking hood over the head, tied at the neck, an eye hole with the eye in it; rope across him, a noose at the belt.
    p.push(['e', hx, hy + 0.5, 6, 6.2, SACK], ['r', hx + 2, hy + 1, 5, 4, SACK], ['r', hx - 4, hy - 3, 9, 1, STITCH], ['r', hx - 5, hy + 5, 10, 1, ROPE], ['p', hx - 6, hy + 6, KNOT],
      ['r', hx + 3, hy - 2, 2, 2, '#1a1410'], ['p', hx + 4, hy - 2, '#ff4a3a'], ['r', 17, 15, 4, 12, SACK], ['r', 17, 20, 4, 1, STITCH]);
    for (let i = 0; i < 10; i++) p.push(['p', 12 + Math.round(i * 0.6), 14 + i, i % 3 ? ROPE : KNOT]);
    p.push(['e', 20.5, 28.5, 1.6, 2, ROPE], ['p', 20, 28, '#2a2420']);
    if (l.hempen === 2) p.push(['r', hx + 1, hy - 3, 4, 3, '#5b6b2a'], ['r', hx + 3, hy - 1, 2, 1, '#ff4a3a'], ['p', hx + 5, hy - 2, '#7a1d1d']);
  }
  // Its trophy, as it hangs from the side: a skull at the hip, a string of ears or of teeth at the throat, a helm on.
  if (l.trophy === 'skulls') p.push(['r', 19, 23, 1, 3, '#5a4a30'], ['e', 19.5, 27.5, 2.5, 2.3, BONE], ['p', 20, 27, DARK], ['p', 21, 28, DARK]);
  if (l.trophy === 'ears') for (let i = 0; i < 3; i++) p.push(['r', 17 + i * 2, 13 + i, 2, 2, '#a07858'], ['p', 18 + i * 2, 14 + i, '#5a3a2a']);
  if (l.trophy === 'teeth') for (let i = 0; i < 4; i++) p.push(['r', 17 + i * 2, 13 + i, 1, 2, BONE]);
  if (l.trophy === 'helm') p.push(['r', hx - 5, hy - 7, 10, 4, '#9aa2ac'], ['r', hx - 6, hy - 4, 12, 1, '#6a727c'], ['r', hx - 3, hy - 7, 3, 1, '#d4dce4'], ['p', hx + 3, hy - 5, '#4a525c'], ['r', hx - 1, hy - 9, 2, 2, '#c0392b']);
  return p;
}
