/**
 * A test hook for look sheets (scripts/heroes-look.cjs): one hero drawn by the game's own drawHero
 * onto a small canvas, lit and glow layers laid together, with no world, light or shadow. Only draws.
 */
import { currentSwing, newHero } from '../sim/hero';
import type { Hero } from '../sim/types';
import { CLASS_KITS, type HeroClass } from '../shared/tuning';
import { BARE } from './draw';
import { drawHero } from './actors';
import { drawHound } from './hound';
import { houndAt } from './idlehound';
import { showIdle, type IdleId } from './idles';
import { showPet } from './petting';
import { PX } from './world';
import type { Hound } from '../sim/types';

/** `idle`: an idle `t` s in (idles.ts); `pet`: petting their hound `t` s in; `hound`: draw a Ranger's hound at heel. */
export interface ArtSpec { cls: HeroClass; look?: number; now?: number; t?: number; hero?: Partial<Hero> & { dial?: number }; swing?: number; idle?: { id: IdleId; t: number }; pet?: number; hound?: boolean }

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
  const now = g.now, side = hero.fx >= -0.2 ? 1 : -1;
  if (s.idle) showIdle(hero.id, { ...s.idle, side });
  if (s.pet !== undefined) showPet(hero.id, 'own', now - s.pet, hero.x, hero.y);
  BARE.on = true;
  try {
    // A Ranger's hound at heel, playing or petted as the game would draw it (idlehound.ts).
    const dog: Hound = { x: hero.x - side * 1.1, y: hero.y + 0.2, fx: side, fy: 0, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: false };
    if (s.pet !== undefined) dog.x = hero.x + side * 0.9;
    const a = s.hound ? houndAt(hero, dog.x, dog.y, hero.x, hero.y, now) : null, at = a ?? dog;
    const put = (x: number, y: number) => [Math.round(w / 2 + (x - hero.x) * PX), h - 8 + Math.round((y - hero.y) * PX)];
    const [dx, dy] = put(at.x, at.y);
    const drawDog = () => drawHound(g, dog, dx, dy, { ...(a ? { mood: a.mood, fx: a.fx, down: a.down } : {}), look: hero.houndLook });
    if (s.hound && at.y < hero.y) drawDog();
    drawHero(g, hero, Math.round(w / 2), h - 8, 'bare', s.t ?? 1);
    if (s.hound && at.y >= hero.y) drawDog();
  } finally {
    BARE.on = false;
    showIdle(hero.id, null);
    showPet(hero.id, null);
  }
  const o = out.getContext('2d')!;
  o.drawImage(lit, 0, 0);
  o.drawImage(glow, 0, 0);
  return out.toDataURL();
}
