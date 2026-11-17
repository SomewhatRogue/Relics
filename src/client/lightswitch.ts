/**
 * How light is laid on the picture (docs/design/graphics-overhaul.md, slice 1): SMOOTH, pools of light with no
 * bands and no dither over the same crisp art (Kyle, 2026-11-17: the banded light's checker was the grain on a
 * PC), or BANDS, the stepped and dithered light as it was. A button in the options box flips it live; remembered
 * on this device; `?light=smooth` or `?light=bands` in the address wins. Both views read it each frame.
 */
import './lightswitch.css';

const KEY = 'relic.light';

function start(): boolean {
  if (typeof location === 'undefined') return true;
  const u = new URLSearchParams(location.search).get('light');
  if (u === 'smooth' || u === 'bands') return u === 'smooth';
  try {
    return localStorage.getItem(KEY) !== 'bands';
  } catch {
    return true;
  }
}

export const LIGHT = { smooth: start() };

/** SMOOTH or BANDS, live: both views resize on the window's resize (the flat view's canvas changes size with it). */
export function setSmooth(on: boolean): void {
  LIGHT.smooth = on;
  try {
    localStorage.setItem(KEY, on ? 'smooth' : 'bands');
  } catch {
    /* this session only */
  }
  dispatchEvent(new Event('resize'));
}

/** The LIGHT button, under CAMERA (camwide.ts) in the options box. */
export function lightButton(): void {
  const box = document.getElementById('options');
  if (!box) return;
  const b = document.createElement('button');
  b.id = 'lightbtn';
  b.setAttribute('aria-label', 'Smooth light, or light in bands as it was');
  const label = () => {
    b.textContent = LIGHT.smooth ? 'LIGHT: SMOOTH' : 'LIGHT: BANDS';
    b.classList.toggle('on', LIGHT.smooth);
  };
  b.addEventListener('click', () => (setSmooth(!LIGHT.smooth), label()));
  label();
  const after = document.getElementById('camerabtn') ?? document.getElementById('brightrow') ?? document.getElementById('viewbtn');
  if (after) after.after(b);
  else box.prepend(b);
}
