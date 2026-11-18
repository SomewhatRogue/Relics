/**
 * The streak on the hero card (shared/streak.ts): under the bars once it's 3 or more, coloured by its step,
 * a flare as it reaches one; when it breaks, the number it was, struck through in red, for a moment.
 */
import './streak.css';
import type { Hero } from '../sim/types';
import { one, setData, setHidden, setText, toggle } from './domset';

const el = () => one('#hud .streak') as HTMLElement | null;
let last = 0, step = 0, brokeAt = -9;

export function showStreak(me: Hero): void {
  const box = el();
  if (!box) return;
  const n = me.streak ?? 0, s = me.streakStep ?? 0, now = performance.now() / 1000;
  if (n === 0 && last >= 5) (brokeAt = now), (box.dataset.lost = String(last));
  const broken = now - brokeAt < 1.2;
  if (s > step) box.classList.remove('flare'), void box.offsetWidth, box.classList.add('flare');
  [last, step] = [n, s];
  setHidden(box, n < 3 && !broken);
  toggle(box, 'broken', broken && n < 3);
  setData(box, 'step', s);
  const text = broken && n < 3 ? `STREAK ${box.dataset.lost}` : `STREAK ${n}`;
  setText(box.firstElementChild as HTMLElement, text);
}
