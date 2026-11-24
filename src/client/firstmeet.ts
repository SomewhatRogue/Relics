/**
 * A hero's first meeting with their own trainer (Kyle, 2026-11-24: "they should say stuff, then give you another
 * quest that's on the job board, and say you need to do work and build up reputation"). Two beats: what they'll
 * teach you in time, then go and get known off the board in the square; under the second, the quest they've just
 * handed over (shared/errands.ts talkedTo takes it), shown plainly and in a toast. The words: errandwords.ts.
 */
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { questHeld } from '../shared/heroquests';
import { ERRANDW } from './errandwords';
import { QUESTW } from './questwords';
import { toast } from './partytoast';

export function firstMeeting(g: Game, panel: Panel, head: string, say: (s: string) => string, pre: string, training: Button): void {
  const cls = g.profile.cls;
  const second = () => {
    const h = questHeld(g.profile);
    const fresh = h ? `<p><b style="color: var(--kc, #d4a537)">${ERRANDW.fresh}:</b> ${QUESTW.goal(h.q, h.n)}</p>` : '';
    panel.show(head, say(ERRANDW.firstWork[cls]) + fresh + `<p class="dim">${ERRANDW.firstNote}</p>`, [training]);
    if (h) toast(`${ERRANDW.fresh}: ${QUESTW.small(h.q, h.n)}`, { kind: 'quest' });
  };
  panel.show(head, pre + say(ERRANDW.firstVisit[cls]), [{ label: 'GO ON', act: second, primary: true }]);
}
