/**
 * Effects for each class's own button (shared/signs.ts) and the wood's step for it. Cosmetic only. A
 * Rogue's SHADOW STEP keeps the shadow's own (fxmagic.ts). A Ranger's MARK: a ring and MARKED on the
 * goblin (the mark itself is drawn over it while it lasts: signdraw.ts). A Healer's MEND: a gold line
 * from the Healer to whoever it reached, with motes rising off them. Hew struck by the archer: blood
 * and a jolt. A smoke bomb thrown: a puff from the hand (the cloud lands where it falls: fxmagic.ts).
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { toPx } from './world';

const GOLD = ['#ffe9a8', '#ffd27a', '#ffffff'];

export function signFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'hunted':
      fx.rings.push({ x, y: y - 6, life: 0.4, max: 0.4, col: '#ffcf4a', size: 18 });
      fx.say(x, y - 34, 'MARKED', '#ffcf4a', 1.2);
      return true;
    case 'mended': {
      const [x2, y2] = toPx(ev.x2, ev.y2);
      if (!ev.self) fx.arcs.push({ x, y: y - 10, x2, y2: y2 - 10, life: 0.45, col: '#ffd27a' });
      fx.rings.push({ x: x2, y: y2 - 4, life: 0.45, max: 0.45, col: '#ffe9a8', size: 16 });
      // Motes rising off whoever it reached.
      for (let i = 0; i < 3; i++) fx.burst(x2 + (i - 1) * 4, y2 - 6 - i * 4, 5, GOLD, 30, true, -50);
      fx.flashes.push({ x: x2, y: y2 - 8, r: 50, i: 0.8, c: [1, 0.88, 0.55], life: 0.3, max: 0.3 });
      return true;
    }
    case 'hewshot':
      fx.burst(x, y - 12, 14, ['#7a1010', '#a81c1c', '#5a0808'], 60, false);
      fx.shake = Math.max(fx.shake, 3);
      return true;
    case 'smokebomb':
      fx.burst(x, y - 12, 6, ['#9a94a8', '#c8c4d0'], 30, false, -30);
      return true;
    default:
      return false;
  }
}
