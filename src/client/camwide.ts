/**
 * How far out the camera sits, a player's choice (docs/design/lived-in-world.md slice 5, after Riteborn's wide view):
 * WIDE, a whole step out from the old close view, or WIDER, a step further again, in both views (scene.ts and
 * three/view3d.ts read the step from here, so a tile stays a whole number of screen pixels and the two views keep
 * showing the same floor). A button in the options box flips it live; remembered on this device; `?cam=wide` or
 * `?cam=wider` in the address wins. Kyle kept it as an option (2026-11-16), CLOSE the default; WIDE the default on
 * 2026-11-27; then CLOSE gone and WIDER added the same day ("now that wide is primary, get rid of close and add a new
 * wide view that zooms out more"). A page that had chosen CLOSE is WIDE now.
 */
import './camwide.css';

const KEY = 'relic.camera';
/** Screen pixels per low-res pixel squared, roughly: the step the camera sits at (a step back since 2026-11-12). */
const AREA = 118000;

export type CamStep = 'wide' | 'wider';

function start(): CamStep {
  if (typeof location === 'undefined') return 'wide';
  const u = new URLSearchParams(location.search).get('cam');
  if (u === 'wide' || u === 'wider') return u;
  try {
    return localStorage.getItem(KEY) === 'wider' ? 'wider' : 'wide';
  } catch {
    return 'wide';
  }
}

export const CAM = { step: start() as CamStep };

/** How many screen pixels a low-res pixel takes for a W x H screen (device pixels): one fewer for WIDE, two for WIDER. */
export function camScale(W: number, H: number): number {
  const s = Math.max(1, Math.round(Math.sqrt((W * H) / AREA)));
  return Math.max(1, s - (CAM.step === 'wider' ? 2 : 1));
}

/** WIDE or WIDER, live: both views resize on the window's resize. */
export function setStep(step: CamStep): void {
  CAM.step = step;
  try {
    localStorage.setItem(KEY, step);
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
    b.textContent = CAM.step === 'wider' ? 'CAMERA: WIDER' : 'CAMERA: WIDE';
    b.classList.toggle('on', CAM.step === 'wider');
  };
  b.addEventListener('click', () => (setStep(CAM.step === 'wider' ? 'wide' : 'wider'), label()));
  label();
  const after = document.getElementById('brightrow') ?? document.getElementById('viewbtn');
  if (after) after.after(b);
  else box.prepend(b);
}
