/**
 * Relics re-earned (docs/design/relics.md section 4, Kyle: "re-earn"): a hero saved before relics were
 * earned keeps the Relic Javelin only, and every other relic they held is gone, once. `relicsV` on the
 * hero marks it done, so it never runs twice; a new hero starts with it set. How many went is kept as
 * `relicsGone` until the hero has been told (client/relicgone.ts), then cleared.
 */
import type { RelicItem } from './relicitems.js';

export const RELICS_VERSION = 1;

/** What this step reads and writes on a hero. */
export interface RelicHolder { relics: RelicItem[]; relic: string; relicNew?: string[]; relicsV?: number; relicsGone?: number }

/** The javelin a hero keeps: the one carried, else a plain one, else the first. */
function keptJavelin(p: Pick<RelicHolder, 'relics' | 'relic'>): RelicItem | undefined {
  const javs = p.relics.filter((r) => r.kind === 'javelin');
  return javs.find((r) => r.id === p.relic) ?? javs.find((r) => !r.el) ?? javs[0];
}

/** Clear `out`'s relics to the javelin if the hero as saved (`saved`) predates earned relics. */
export function fitEarned(out: RelicHolder, saved: { relicsV?: number }): void {
  if ((saved.relicsV ?? 0) < RELICS_VERSION) {
    const jav = keptJavelin(out), gone = out.relics.length - (jav ? 1 : 0);
    out.relics = jav ? [jav] : [];
    // Carried the javelin if anything was carried; nothing carried stays nothing.
    out.relic = out.relic ? jav?.id ?? '' : '';
    if (out.relicNew) out.relicNew = out.relicNew.filter((id) => id === jav?.id);
    if (gone > 0) out.relicsGone = (out.relicsGone ?? 0) + gone;
  }
  out.relicsV = RELICS_VERSION;
}

/** How many relics went at the step, if the hero hasn't been told yet; telling clears it. */
export function tellGone(p: RelicHolder): number {
  const n = p.relicsGone ?? 0;
  delete p.relicsGone;
  return n;
}
