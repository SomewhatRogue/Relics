/**
 * The look, iron and ember (docs/design/ui-look.md): loads ironui.css and wires the MOTION switch in the
 * gear box. Off, the glints, pulses, sparks and torch flicker stand still (`data-still` on <html>). The
 * choice is remembered on this device; with none made, a device that asks for less motion starts still.
 */
import './ironui.css';
import './ironhome.css';

const KEY = 'relic.motion';

/** Whether the UI's light moves: the stored choice, else the device's wish. */
export function motionWanted(stored: string | null, reduce: boolean): boolean {
  return stored === '1' ? true : stored === '0' ? false : !reduce;
}

function setMotion(on: boolean, save: boolean): void {
  document.documentElement.toggleAttribute('data-still', !on);
  document.getElementById('motion')?.classList.toggle('off', !on);
  if (!save) return;
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* no storage: this session only */
  }
}

export function ironUi(): void {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(KEY);
  } catch {
    /* no storage */
  }
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  setMotion(motionWanted(stored, reduce), false);
  document.getElementById('motion')?.addEventListener('click', () => setMotion(document.documentElement.hasAttribute('data-still'), true));
}
