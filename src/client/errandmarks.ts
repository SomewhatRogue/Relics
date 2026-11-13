/**
 * Quest marks in town (docs/design/town-quests.md section 2): the gold diamond goes only over someone
 * with an errand or a quest for you (shared/errands.ts), never over everyone you could talk to. Out in
 * the street their hall's door is marked; inside, the person. The edge point toward the nearest when
 * none is in sight comes with the marks (questmarks.ts, and the 2.5D view's overlay).
 */
import { doorAt, npcAt, type GameMap } from '../shared/arena';
import { errandWho, openErrands } from '../shared/errands';
import type { Profile } from '../shared/progress';
import type { Target } from '../sim/targets';

export function errandTargets(p: Profile, map: GameMap, t: number): Target[] {
  const out: Target[] = [], seen = new Set<string>();
  const add = (x: Target) => {
    const k = x.kind + Math.round(x.x * 4) + ',' + Math.round(x.y * 4);
    if (!seen.has(k)) seen.add(k), out.push(x);
  };
  for (const id of openErrands(p)) {
    const who = errandWho(p, id);
    const n = map.npcs?.find((x) => x.talk === who.talk && (who.arg === undefined || x.arg === who.arg) && !x.mute);
    if (n) {
      const at = npcAt(n, t);
      add({ kind: 'folk', x: at.x, y: at.y });
      continue;
    }
    const b = map.blocks.find((x) => x.door === who.door && !x.locked);
    if (b) add({ kind: 'hall', ...doorAt(b) });
  }
  return out;
}
