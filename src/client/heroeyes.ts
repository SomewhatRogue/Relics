/**
 * The eye dial (PLAN.md "red eyes and gold eyes"; Kyle, 2026-11-05): one value per hero, `dial`, from
 * -1 (red, the hunger taking them) to +1 (gold). At the middle the eyes are plain and dark, as every
 * hero's are today. Near it, a faint tint. Toward red: the eyes burn, smoke curls off them at the far
 * end, a red under-glow and ash and embers rise, and the cape or hood darkens and frays (herolife.ts).
 * Toward gold: a warm glow in the eyes, then a gold rim of light, a halo's glint and motes of light.
 * Light goes on the glow layer; smoke and ash are matter, on the lit layer. Only draws: what moves the
 * dial is its own job. Pure (no DOM), so tests can draw it into a fake context.
 */
type G = Pick<CanvasRenderingContext2D, 'fillRect' | 'fillStyle' | 'globalAlpha'>;
export interface DialCtx { lit: G; glow: G; now: number }

export const RED = '#ff3a2a', GOLD = '#ffd27a';

/** What the dial shows at `d`: the eyes' colour and strength, and from where the far-end touches start. */
export interface DialLook { side: 0 | -1 | 1; a: number; eye: string; eyeAlpha: number; smoke: number; aura: number; motes: number; halo: number; rim: number }

export function dialLook(d: number | undefined): DialLook {
  const v = Math.max(-1, Math.min(1, d ?? 0)), a = Math.abs(v), side = a < 0.08 ? 0 : v < 0 ? -1 : 1;
  const far = (from: number) => Math.max(0, (a - from) / (1 - from));
  return {
    side, a,
    eye: side < 0 ? mix('#a04030', RED, a) : mix('#c0a060', GOLD, a),
    eyeAlpha: side ? Math.min(1, 0.25 + a * 1.1) : 0,
    smoke: side < 0 ? far(0.7) : 0,
    aura: side ? far(0.45) : 0,
    motes: side ? Math.round(far(0.45) * 5) : 0,
    halo: side > 0 ? far(0.7) : 0,
    rim: side > 0 ? far(0.45) : 0,
  };
}

/** The eyes (facing you), at scene pixels (lx, y) and (rx, y). */
export function drawDialEyes(c: DialCtx, L: DialLook, lx: number, rx: number, y: number, ph: number): void {
  if (!L.side) return;
  const flick = L.side < 0 && L.a > 0.6 ? 0.85 + 0.15 * Math.sin(c.now * 9 + ph) : 1;
  c.glow.globalAlpha = L.eyeAlpha * flick;
  c.glow.fillStyle = L.eye;
  c.glow.fillRect(lx, y, 1, 1);
  c.glow.fillRect(rx, y, 1, 1);
  // At the far end the glow spills a pixel past each eye.
  if (L.a > 0.85) {
    c.glow.globalAlpha = 0.35 * flick;
    c.glow.fillRect(lx - 1, y, 1, 1);
    c.glow.fillRect(rx + 1, y, 1, 1);
  }
  c.glow.globalAlpha = 1;
  // Smoke curling up off red eyes: grey wisps, rising and fading.
  for (let i = 0; i < 3 && L.smoke > 0; i++) {
    const f = (c.now * 0.9 + i / 3 + ph) % 1, x = (i % 2 ? rx : lx) + Math.round(Math.sin(f * 5 + i) * 1.2);
    c.lit.globalAlpha = L.smoke * 0.75 * (1 - f);
    c.lit.fillStyle = i % 2 ? '#4a4448' : '#5e585c';
    c.lit.fillRect(x, Math.round(y - 1 - f * 6), 1, 1);
  }
  c.lit.globalAlpha = 1;
}

/** Around the body, feet at (x, y), the head's top at `top`: the under-glow, the halo, the motes. */
export function drawDialAura(c: DialCtx, L: DialLook, x: number, y: number, top: number, ph: number): void {
  if (!L.side || !L.aura) return;
  const col = L.side < 0 ? '#c02a1a' : GOLD;
  // Light pooled at the feet (red from below), faint and breathing.
  c.glow.globalAlpha = L.aura * (0.25 + 0.1 * Math.sin(c.now * 2 + ph));
  c.glow.fillStyle = col;
  c.glow.fillRect(x - 4, y, 9, 1);
  c.glow.fillRect(x - 2, y + 1, 5, 1);
  // A halo's glint over the head, catching the light now and then.
  if (L.halo > 0) {
    c.glow.globalAlpha = L.halo * (0.45 + 0.35 * Math.max(0, Math.sin(c.now * 1.7 + ph)));
    c.glow.fillStyle = '#ffe9a8';
    c.glow.fillRect(x - 2, top - 3, 5, 1);
    c.glow.fillRect(x - 3, top - 2, 1, 1);
    c.glow.fillRect(x + 3, top - 2, 1, 1);
  }
  // Motes rising past the body: embers and ash toward red, light toward gold.
  for (let i = 0; i < L.motes; i++) {
    const f = (c.now * 0.45 + i / L.motes + ph) % 1, mx = x - 5 + ((i * 7 + Math.floor(ph * 10)) % 11) + Math.round(Math.sin(f * 6 + i) * 1);
    const my = Math.round(y - 2 - f * (y - top + 6)), g = L.side < 0 && i % 2 ? c.lit : c.glow;
    g.globalAlpha = (L.side < 0 && i % 2 ? 0.8 : 0.9) * Math.sin(f * Math.PI);
    g.fillStyle = L.side < 0 ? (i % 2 ? '#2a2426' : '#ff7a3a') : i % 2 ? '#ffffff' : GOLD;
    g.fillRect(mx, my, 1, 1);
    g.globalAlpha = 1;
  }
  c.glow.globalAlpha = 1;
}

/** `a` toward `b` by `k` (hex colours). */
export function mix(a: string, b: string, k: number): string {
  const p = (s: string, i: number) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16), q = Math.max(0, Math.min(1, k));
  return '#' + [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * q).toString(16).padStart(2, '0')).join('');
}
