/**
 * Mother Isolde's relic quests (docs/design/relics.md section 1, Kyle 2026-11-15: "few and far between, not
 * always available"). At most one open at a time; a new one is offered only now and then: each fifth level
 * reached, or a long stretch of days after the last one ended. She sends you for a relic you don't have whose
 * great boss gives it now (shared/relichomes.ts `live`; the rest wait for their bosses). Winning that relic ends it. Pure:
 * the reliquary (client/churchrelics.ts) offers it, the game ends it, the tests read it.
 */
import { RELIC_HOMES } from './relichomes.js';
import type { RelicId } from './magic.js';
import type { RelicItem } from './relicitems.js';

/** A quest offered at each LEVEL_STEP levels, or after DAYS days with none (the spacing to tune). */
export const RELIC_QUEST = { levelStep: 5, days: 20 };


/** What a hero keeps: the quest open (its relic), and when the last was taken up or ended. */
export interface RelicQuests { open?: RelicId; lastLevel?: number; lastDay?: number }
export interface QuestHolder { level: number; relics: RelicItem[]; rq?: RelicQuests }

/** The relic she'd send this hero for: the first findable one they lack (none: nothing to send them for). */
export function questKind(p: Pick<QuestHolder, 'relics'>): RelicId | undefined {
  // Only a great boss whose first kill gives it now (`live`: the Haulier's once the Instances chat wires it).
  return RELIC_HOMES.find((h) => h.live && !p.relics.some((r) => r.kind === h.kind))?.kind;
}

/** Whether she has one for this hero now (`day`: the world's day). */
export function questOffered(p: QuestHolder, day: number): RelicId | undefined {
  const q = p.rq ?? {}, kind = questKind(p);
  if (q.open || !kind) return undefined;
  const step = RELIC_QUEST.levelStep, levelDue = Math.floor(p.level / step) > Math.floor((q.lastLevel ?? 0) / step);
  const dayDue = q.lastDay !== undefined && day - q.lastDay >= RELIC_QUEST.days;
  return levelDue || dayDue ? kind : undefined;
}

/** Taken up: open, and the spacing counts from here. */
export function takeQuest(p: QuestHolder, day: number): RelicId | undefined {
  const kind = questOffered(p, day);
  if (kind) p.rq = { open: kind, lastLevel: p.level, lastDay: day };
  return kind;
}

/** The quest's relic won (or held some other way): it ends, and the next is a long way off. True if it ended. */
export function endQuest(p: QuestHolder, day: number): boolean {
  const open = p.rq?.open;
  if (!open || !p.relics.some((r) => r.kind === open)) return false;
  p.rq = { lastLevel: p.rq!.lastLevel, lastDay: day };
  return true;
}
