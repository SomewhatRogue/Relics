/**
 * The camera to try (docs/design/lived-in-world.md slice 5, after Riteborn's small heroes in a wide view):
 * CLOSE, as it is, or WIDE, one whole step further out in both views (scene.ts and three/view3d.ts read the
 * step from here, so a tile stays a whole number of screen pixels and the two views keep showing the same
 * floor). A button in the options box flips it live; remembered on this device; `?cam=wide` or `?cam=close`
 * in the address wins. Kyle decides which stays.
 */
import './camwide.css';

const KEY = 'relic.camera';
/** Screen pixels per low-res pixel squared, roughly: the step the camera sits at (a step back since 2026-11-12). */
const AREA = 118000;

function start(): boolean {
  if (typeof location === 'undefined') return false;
  const u = new URLSearchParams(location.search).get('cam');
  if (u === 'wide' || u === 'close') return u === 'wide';
  try {
    return localStorage.getItem(KEY) === 'wide';
  } catch {
    return false;
  }
}

export const CAM = { wide: start() };

/** How many screen pixels a low-res pixel takes for a W x H screen (device pixels): one fewer when WIDE. */
export function camScale(W: number, H: number): number {
  const s = Math.max(1, Math.round(Math.sqrt((W * H) / AREA)));
  return CAM.wide ? Math.max(1, s - 1) : s;
}

/** WIDE or CLOSE, live: both views resize on the window's resize. */
export function setWide(on: boolean): void {
  CAM.wide = on;
  try {
    localStorage.setItem(KEY, on ? 'wide' : 'close');
  } catch {
    /* this session only */
  }
  dispatchEvent(new Event('resize'));
}

/** The CAMERA button, under the view's own (three/switch.ts puts VIEW, QUALITY and BRIGHT first). */
export function camButton(): void {
  const box = document.getElementById('options');
  if (!box) return;
  const b = document.createElement('button');
  b.id = 'camerabtn';
  b.setAttribute('aria-label', 'How far out the camera sits');
  const label = () => {
    b.textContent = CAM.wide ? 'CAMERA: WIDE' : 'CAMERA: CLOSE';
    b.classList.toggle('on', CAM.wide);
  };
  b.addEventListener('click', () => (setWide(!CAM.wide), label()));
  label();
  const after = document.getElementById('brightrow') ?? document.getElementById('viewbtn');
  if (after) after.after(b);
  else box.prepend(b);
}
