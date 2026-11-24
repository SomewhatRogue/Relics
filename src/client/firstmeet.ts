/**
 * A hero's first meeting with their own trainer (Kyle, 2026-11-24: "they should say stuff, then give you another
 * quest that's on the job board, and say you need to do work and build up reputation"). Two beats: what they'll
 * teach you in time, then go and get known off the board in the square; under the second, the quest they've just
 * handed over (shared/errands.ts talkedTo takes it), shown plainly and in a toast. The words: errandwords.ts.
 * (Kyle, 2026-11-24: between the two, a plain weapon and the yard; the board's beat is workBeat, on the way back.)
 */
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { questHeld } from '../shared/heroquests';
import { ERRANDW } from './errandwords';
import { QUESTW } from './questwords';
import { toast } from './partytoast';
import { itemName, type Item } from '../shared/loot';
import { giftToast } from './errandpaid';

export function firstMeeting(g: Game, panel: Panel, head: string, say: (s: string) => string, pre: string, training: Button, gift: Item | null = null): void {
  const cls = g.profile.cls, gold = (s: string) => `<b style="color: var(--kc, #d4a537)">${s}:</b>`;
  // (Kyle, 2026-11-24: the second beat is now a plain weapon and the yard, to try it and the javelin; the board's word
  // waits for your return, workBeat below.)
  const second = () => {
    const got = gift ? `<p>${gold(ERRANDW.gift)} ${itemName(gift)}</p>` : '';
    panel.show(head, say(ERRANDW.firstGift[cls]) + got + `<p>${gold(ERRANDW.fresh)} ${ERRANDW.todo('yard', cls)}</p>` + (gift ? `<p class="dim">${ERRANDW.giftNote}</p>` : ''), [training]);
    giftToast(gift);
    toast(`${ERRANDW.fresh}: ${ERRANDW.small('yard', cls)}`, { kind: 'quest' });
  };
  panel.show(head, pre + say(ERRANDW.firstVisit[cls]), [{ label: 'GO ON', act: second, primary: true }]);
}

/** Back from the yard: nobody knows you yet, so work the board in the square, and the quest they've just handed over. */
export function workBeat(g: Game, panel: Panel, head: string, say: (s: string) => string, training: Button): void {
  const h = questHeld(g.profile);
  const fresh = h ? `<p><b style="color: var(--kc, #d4a537)">${ERRANDW.fresh}:</b> ${QUESTW.goal(h.q, h.n)}</p>` : '';
  panel.show(head, say(ERRANDW.firstWork[g.profile.cls]) + fresh + `<p class="dim">${ERRANDW.firstNote}</p>`, [training]);
  if (h) toast(`${ERRANDW.fresh}: ${QUESTW.small(h.q, h.n)}`, { kind: 'quest' });
}
