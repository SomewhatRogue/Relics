/**
 * The floating stick as pixel art: a stone ring with a faint inner notch where walking turns to creeping
 * (STEALTH.slow of the way out), and an iron knob. Drawn once and handed to the CSS (--stick-ring, --stick-knob).
 */
import { STEALTH } from '../shared/tuning';
import { paintButton } from './btnart';

/** The ring is 46 art pixels across (92 CSS pixels at --px 2), as far as the knob can travel and its rim. */
const D = 46;

function ring(): string {
  const c = document.createElement('canvas');
  c.width = c.height = D;
  const g = c.getContext('2d')!, r = D / 2, notch = r * STEALTH.slow * 0.98;
  for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
    const dx = x + 0.5 - r, dy = y + 0.5 - r, d = Math.hypot(dx, dy), lit = dx + dy < 0;
    let col = '';
    if (d <= r && d > r - 1) col = '#07080a';
    else if (d <= r - 1 && d > r - 2) col = lit ? '#6a707a' : '#1b1d22';
    else if (d <= r - 2 && d > r - 3) col = lit ? '#3b3f47' : '#26292f';
    else if (d <= r - 3 && d > r - 4) col = '#07080a';
    else if (d < r - 4) col = Math.abs(d - notch) < 0.5 && (x + y) % 2 === 0 ? 'rgba(221,213,196,0.35)' : 'rgba(14,15,18,0.28)';
    if (col) (g.fillStyle = col), g.fillRect(x, y, 1, 1);
  }
  return c.toDataURL();
}

export function stickVars(): void {
  if (typeof document === 'undefined') return;
  const knob = document.createElement('canvas');
  paintButton(knob, { shape: 'round', size: 18, grade: 'iron' });
  const root = document.documentElement.style;
  root.setProperty('--stick-ring', `url(${ring()})`);
  root.setProperty('--stick-knob', `url(${knob.toDataURL()})`);
}
