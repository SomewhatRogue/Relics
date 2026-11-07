/** What the prologue's running order (wood.ts) and Hew's death (woodcut.ts) both use: you, Hew, his words on screen, a goblin put in the wood. */
import type { Foe } from '../shared/terrain';
import { newEnemy } from './enemies';
import { VARIANTS } from '../shared/tuning';
import type { ArenaRoom } from './room';
import type { Enemy } from './types';
import type { WoodState } from './wood';

export const HERO_ID = 'me';
export const hew = (room: ArenaRoom) => room.map.npcs?.find((n) => n.talk === 'hew');
/** A caption, up long enough to read (about a third of a second a word, never less than asked). */
export const say = (w: WoodState, room: ArenaRoom, who: string, text: string, s = 5) => (w.caption = { who, text, until: room.time + Math.max(s, 1.2 + text.split(' ').length * 0.32) });

export function spawn(room: ArenaRoom, f: Foe & { variant?: Enemy['variant'] }): Enemy {
  const e = newEnemy(Math.max(0, ...room.enemies.map((o) => o.id)) + 1, f.kind, f.x, f.y);
  if (f.variant === 'looter' || f.variant === 'lunger' || f.variant === 'heavy' || f.variant === 'stoker') e.hp = e.maxHp = VARIANTS[f.variant].hp;
  if (f.variant === 'soaked' || f.variant === 'aproned' || f.variant === 'kilnhot') e.hp = e.maxHp = VARIANTS[f.variant].hp;
  // Every goblin in the wood but the Stoker is drilled: slower wind-ups, one at a time.
  Object.assign(e, { respawns: false, name: f.name, bow: f.bow, variant: f.variant, alert: f.awake ?? false, drill: f.variant !== 'stoker' });
  room.enemies.push(e);
  return e;
}
