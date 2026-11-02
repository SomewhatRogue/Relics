/** What a drag in the pack does (pack.ts): which square a piece can go to, as a gear change for the room. */
import { WEAPONS, slotOf } from '../shared/tuning';
import { GEAR, full } from '../sim/pack';
import type { Hero } from '../sim/types';

/** A weapon of this hero's class (or not a weapon at all). */
export const fits = (h: Hero, kit?: string) => !kit || WEAPONS[kit as keyof typeof WEAPONS].cls === WEAPONS[h.weapon].cls;

/** What dropping `src` on `dst` does, as a gear change (or nothing). `town`: no dropping on the street. */
export function moveOf(h: Hero, src: string, dst: string, town = false): [number, number] | null {
  const [s, si] = src.split(':'), [d] = dst.split(':'), i = Number(si), room = !full(h);
  if (s === 'bag') {
    const it = h.bag[i];
    if (!it) return null;
    const slot = slotOf(it);
    if (d === 'hand' && slot === 'weapon' && fits(h, it.kit)) return [GEAR.equip, i];
    if ((d === 'armor' && slot === 'armor') || (d === 'ring' && slot === 'ring')) return [GEAR.equip, i];
    if (d === 'drop' && !town && it.quality !== 'hungry') return [GEAR.drop, i];
    return null;
  }
  if (d === 'bag' && room) {
    if (s === 'hand' && h.arms[h.weapon]) return [GEAR.equip, -1];
    if (s === 'armor' && h.armor) return [GEAR.unarm, 0];
    if (s === 'ring' && h.rings[i] && h.rings[i].hungry !== 'wedding') return [GEAR.off, i];
  }
  if (s === 'belt' && d === 'belt' && i > 0) return [GEAR.front, i];
  return null;
}

