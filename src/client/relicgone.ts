/**
 * The one-time word to a hero whose relics went at the save step (shared/relicreset.ts, docs/design/relics.md
 * section 4): the first time they're in Wickhold after it, a card says so plainly, once.
 */
import type { Profile } from '../shared/progress';
import { tellGone } from '../shared/relicreset';
import { RELICW } from './relicwords';
import { line } from './speech';

/** The card, if this hero hasn't been told yet (telling marks it, so save after). */
export function relicsGoneNews(p: Profile): { title: string; html: string } | null {
  const n = tellGone(p);
  if (!n) return null;
  const jav = p.relics.some((r) => r.kind === 'javelin');
  return { title: RELICW.goneTitle, html: `<p>${RELICW.goneLine(jav)}</p><p><b>Mother Isolde:</b> ${line(`"${RELICW.goneIsolde}"`, 'MOTHER ISOLDE')}</p>` };
}
