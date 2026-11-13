/**
 * The Deep skill's button (shared/deepskill.ts) in the cluster (cluster.ts calls `showDeep`): there only once
 * the hero has been taught it, its long wait as a sweep and the seconds, its name over it. Its place on a phone
 * and its order in a laptop's bar: deepskill.css. Its pixel icon here too (the trainer's tile uses it: `d:` keys).
 */
import { DEEP_SKILL_NAME } from '../shared/deepskillwords';
import type { DeepSkillId } from '../shared/deepskill';
import { deepLeft, deepWait } from '../sim/deepskill';
import type { Hero } from '../sim/types';
import { gridCanvas, type Grid } from './pixgrid';
import type { Face } from './btnart';
import './deepskill.css';

const ICONS: Partial<Record<DeepSkillId, Grid>> = {
  // The long cut: a long blade drawn across, its gold guard and dark grip at the foot.
  cut: ['...........W', '..........Wg', '.........Wg.', '........Wg..', '.......Wg...', '......Wg....', '.....Wg.....', '...yyy......', '...yB.......', '..B.........', '.B..........', 'B...........'],
};

/** The icon, or null (not drawn yet). */
export const deepIcon = (id: DeepSkillId | undefined) => (id && ICONS[id] ? gridCanvas('d-' + id, ICONS[id]!) : null);

interface Shown { show(f: Face | null, secs?: string, label?: string, aria?: string): void }

/** Draw the button for `me` (none if they haven't been taught it). */
export function showDeep(b: Shown, me: Hero, now: number, flash: (left: number) => boolean): void {
  const id = me.deepSkill;
  if (!id) return b.show(null);
  const left = deepLeft(me, now), name = DEEP_SKILL_NAME[id];
  b.show({ shape: 'round', size: 26, grade: 'gilt', icon: deepIcon(id), cd: left / deepWait(me), flash: flash(left) }, left > 0 ? String(Math.ceil(left)) : '', name, name);
}
