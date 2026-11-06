/**
 * A test hook for look sheets (scripts/heroes-look.cjs): one hero drawn by the game's own drawHero
 * onto a small canvas, lit and glow layers laid together, with no world, light or shadow. Only draws.
 */
import { currentSwing, newHero } from '../sim/hero';
import type { Hero } from '../sim/types';
import { CLASS_KITS, type HeroClass } from '../shared/tuning';
import { BARE } from './draw';
import { drawHero } from './actors';

export interface ArtSpec { cls: HeroClass; look?: number; now?: number; t?: number; hero?: Partial<Hero> & { dial?: number }; swing?: number }

/** The hero as a PNG data URL, `w` by `h` scene pixels, feet at (w/2, h - 8). */
export function heroArt(s: ArtSpec, w = 40, h = 40): string {
  const lit = document.createElement('canvas'), glow = document.createElement('canvas'), out = document.createElement('canvas');
  for (const c of [lit, glow, out]) (c.width = w), (c.height = h);
  const hero = newHero('art-' + s.cls + (s.look ?? 0), 5, 5);
  Object.assign(hero, { weapon: CLASS_KITS[s.cls][0], look: s.look ?? 0 }, s.hero ?? {});
  // `swing`: a share of the way through the blow's active part (the swing at its widest).
  if (s.swing !== undefined) (hero.act = 'attack'), (hero.actT = currentSwing(hero).windup + currentSwing(hero).active * s.swing);
  const g = { lit: lit.getContext('2d')!, glow: glow.getContext('2d')!, now: s.now ?? 1 };
  for (const k of [g.lit, g.glow]) k.imageSmoothingEnabled = false;
  BARE.on = true;
  try {
    drawHero(g, hero, Math.round(w / 2), h - 8, 'bare', s.t ?? 1);
  } finally {
    BARE.on = false;
  }
  const o = out.getContext('2d')!;
  o.drawImage(lit, 0, 0);
  o.drawImage(glow, 0, 0);
  return out.toDataURL();
}
