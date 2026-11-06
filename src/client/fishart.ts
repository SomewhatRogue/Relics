/**
 * The millpond's fish, drawn in code a pixel at a time (facing right): each kind's shape (how deep the
 * body is along its length, the fork of the tail, where the fins sit) and colours (back, flank, belly,
 * fins, and the perch's bars, the pike's spots, the carp's scales, the tench's red eye). `fishCard` makes
 * a little picture for the catch card.
 */
import type { FishId } from '../shared/fishtune';

interface Look { depth: number; back: string; flank: string; belly: string; fin: string; eye: string; dorsal: [number, number]; mark?: 'bars' | 'spots' | 'scales'; snout?: number }
const LOOKS: Record<FishId, Look> = {
  roach: { depth: 0.3, back: '#4a5a6a', flank: '#b8c4cc', belly: '#e8ece8', fin: '#c8584a', eye: '#d83a2a', dorsal: [0.42, 0.62] },
  rudd: { depth: 0.32, back: '#6a5a2a', flank: '#c8a850', belly: '#ecdca0', fin: '#e0402a', eye: '#e8c040', dorsal: [0.34, 0.5] },
  perch: { depth: 0.3, back: '#3a4a22', flank: '#8a9a40', belly: '#e0d8a8', fin: '#e06a2a', eye: '#e8c040', dorsal: [0.3, 0.78], mark: 'bars' },
  eel: { depth: 0.09, back: '#3a3420', flank: '#6a5a30', belly: '#c8b880', fin: '#4a4024', eye: '#e8e0c0', dorsal: [0.1, 0.7] },
  tench: { depth: 0.28, back: '#2a3a1a', flank: '#5a6a2a', belly: '#a8a060', fin: '#3a4420', eye: '#e03a2a', dorsal: [0.42, 0.6] },
  bream: { depth: 0.42, back: '#4a3a1a', flank: '#a88a4a', belly: '#d8c890', fin: '#3a3020', eye: '#e8e0c0', dorsal: [0.44, 0.58] },
  carp: { depth: 0.34, back: '#5a4218', flank: '#c8922a', belly: '#ecd090', fin: '#8a5a2a', eye: '#e8e0c0', dorsal: [0.3, 0.7], mark: 'scales' },
  pike: { depth: 0.17, back: '#2a3a20', flank: '#5a7a3a', belly: '#d8d8b0', fin: '#6a7a3a', eye: '#e8d860', dorsal: [0.18, 0.3], mark: 'spots', snout: 0.12 },
};

const px = (g: CanvasRenderingContext2D, x: number, y: number, c: string) => ((g.fillStyle = c), g.fillRect(Math.round(x), Math.round(y), 1, 1));

/** One fish, `len` pixels long, its middle at (x, y), facing right (`left`: facing left). */
export function drawFish(g: CanvasRenderingContext2D, sp: FishId, x: number, y: number, len: number, left = false): void {
  const L = LOOKS[sp], n = Math.max(8, Math.round(len)), half = Math.max(1, L.depth * n * 0.5), x0 = x - n / 2, at = (i: number) => (left ? x0 + n - 1 - i : x0 + i);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    // The tail fin (its fork), then the body: deepest a little forward of the middle, a blunt or long snout.
    if (u < 0.14) {
      const k = (0.14 - u) / 0.14, h = Math.round(half * (0.35 + k * 0.9));
      for (let j = -h; j <= h; j++) if (Math.abs(j) > h * 0.35 * k || u > 0.1) px(g, at(i), y + j, L.fin);
      continue;
    }
    const b = (u - 0.14) / 0.86, nose = L.snout ? Math.max(0, (b - (1 - L.snout)) / L.snout) : 0;
    const h = Math.max(1, Math.round(half * Math.pow(Math.sin(Math.PI * Math.min(0.98, 0.18 + b * 0.82)), 0.75) * (1 - nose * 0.45)));
    for (let j = -h; j <= h; j++) {
      const k = (j + h) / (2 * h);
      let c = k < 0.3 ? L.back : k > 0.72 ? L.belly : L.flank;
      if (L.mark === 'bars' && k < 0.7 && Math.floor(b * 9) % 2 === 1 && b > 0.15 && b < 0.8) c = L.back;
      if (L.mark === 'spots' && k > 0.25 && k < 0.7 && (i * 7 + j * 13) % 11 === 0) c = '#d8d8a0';
      if (L.mark === 'scales' && k > 0.2 && k < 0.75 && (i + (j & 1) * 2) % 4 === 0) c = L.back;
      px(g, at(i), y + j, c);
    }
    // The dorsal fin along the back, the lower fins under the belly.
    if (b > L.dorsal[0] && b < L.dorsal[1]) px(g, at(i), y - h - 1, L.fin), sp === 'perch' && b < 0.55 && i % 2 === 0 && px(g, at(i), y - h - 2, L.fin);
    if (sp !== 'eel' && ((b > 0.3 && b < 0.38) || (b > 0.6 && b < 0.66))) px(g, at(i), y + h + 1, L.fin);
    // The eye, a third of the way down near the front, and a mouth line.
    if (Math.abs(b - (L.snout ? 0.86 : 0.9)) < 0.5 / n) px(g, at(i), y - Math.round(h * 0.35), L.eye);
  }
  // The mouth (a carp's barbel hangs from it).
  px(g, at(n - 1), y, '#1a1a14');
  if (sp === 'carp') px(g, at(n - 2), y + 2, L.fin);
}

/** A picture of a landed fish for the card: on a dark ground, a little longer for a heavier one (oz). */
export function fishCard(sp: FishId, oz: number, scale = 4): string {
  const len = Math.round(22 + Math.min(26, Math.sqrt(oz) * 1.4) + (sp === 'eel' || sp === 'pike' ? 8 : 0));
  const w = len + 12, h = Math.round(len * 0.55) + 8, c = document.createElement('canvas');
  c.width = w * scale;
  c.height = h * scale;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.scale(scale, scale);
  drawFish(g, sp, w / 2, h / 2, len);
  return `<img class="fishpic" alt="" src="${c.toDataURL()}" style="width:${w * 2}px">`;
}
