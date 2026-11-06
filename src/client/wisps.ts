/**
 * Small living details on what heroes carry (Kyle, 2026-11-05): motes of the element drifting up off a
 * Mage's focus, and smoke off a Cleric's censer. The motes are light (glow layer); the smoke is matter
 * (lit layer). Only draws.
 */
import type { Ctx } from './draw';

/** Motes of the element rising off a focus's tip at (x, y) and fading as they go. */
export function focusMotes(c: Ctx, x: number, y: number, el: string): void {
  for (let i = 0; i < 3; i++) {
    const f = (c.now * 0.7 + i / 3) % 1;
    c.glow.globalAlpha = 0.85 * (1 - f);
    c.glow.fillStyle = i === 1 ? '#ffffff' : el;
    c.glow.fillRect(Math.round(x + Math.sin(f * 5 + i * 2.1) * 1.5), Math.round(y - 1 - f * 7), 1, 1);
  }
  c.glow.globalAlpha = 1;
}

/** Smoke curling up off a censer at (x, y): pale grey wisps drifting with a lean, thinning out. */
export function censerSmoke(c: Ctx, x: number, y: number): void {
  for (let i = 0; i < 4; i++) {
    const f = (c.now * 0.5 + i / 4) % 1, w = f > 0.5 ? 2 : 1;
    c.lit.globalAlpha = 0.8 * (1 - f);
    c.lit.fillStyle = i % 2 ? '#8a8690' : '#a8a4ac';
    c.lit.fillRect(Math.round(x + Math.sin(f * 4 + i) * 1.5 + f * 2), Math.round(y - 2 - f * 9), w, 1);
  }
  c.lit.globalAlpha = 1;
}
