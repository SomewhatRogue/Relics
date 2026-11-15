/**
 * A test hook for townsfolk look sheets (scripts/folk-look.cjs): one person drawn by the game's own
 * drawNpc onto a small canvas, lit and glow layers laid together, with no world or light. Only draws.
 */
import type { Npc } from '../shared/arena';
import { BARE } from './draw';
import { drawNpc } from './npcs';

/** `look` by name (npcs.ts LOOKS), facing `fx` (1 east, -1 west, 0 toward you), walking or standing, at `now`. */
export function npcArt(look: string, fx: number, walking: boolean, now: number, w = 30, h = 44): string {
  const lit = document.createElement('canvas'), glow = document.createElement('canvas'), out = document.createElement('canvas');
  for (const c of [lit, glow, out]) (c.width = w), (c.height = h);
  const g = { lit: lit.getContext('2d')!, glow: glow.getContext('2d')!, now };
  for (const k of [g.lit, g.glow]) k.imageSmoothingEnabled = false;
  BARE.on = true;
  try {
    drawNpc(g, { name: look.toUpperCase(), x: 0, y: 0, look } as Npc, Math.round(w / 2), h - 4, false, fx, walking);
  } finally {
    BARE.on = false;
  }
  const o = out.getContext('2d')!;
  o.drawImage(lit, 0, 0);
  o.drawImage(glow, 0, 0);
  return out.toDataURL();
}
