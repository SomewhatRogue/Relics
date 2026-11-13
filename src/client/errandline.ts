/**
 * The town's goal line while a hero has errands (shared/errands.ts): the first two as rows, each
 * ticked DONE as it's done, then the trainer's word on a new skill, a hero quest to be handed over, and
 * the one in hand with its count (shared/heroquests.ts). Off, the line is the town's own.
 */
import { firstErrands, openErrands, type ErrandId } from '../shared/errands';
import { questHeld } from '../shared/heroquests';
import type { Profile } from '../shared/progress';
import { TRAINERS } from '../shared/town';
import { ERRANDW } from './errandwords';
import { QUESTW } from './questwords';
import { TRACKW } from './tracker';

export interface ErrandLine { rows: string; small: string; key: string }

/** A row's pin, what to do, and the folded line, for any errand. */
function words(p: Profile, id: ErrandId): { pin: string; todo: string; small: string } {
  const h = questHeld(p);
  if (id === 'job' && h) return { pin: QUESTW.held, todo: QUESTW.goal(h.q, h.n), small: QUESTW.small(h.q, h.n) };
  if (id === 'back') return { pin: ERRANDW.pin.trainer, todo: ERRANDW.todo('trainer', p.cls), small: ERRANDW.small('trainer', p.cls) };
  if (id === 'quest') return { pin: QUESTW.due, todo: ERRANDW.todo('trainer', p.cls), small: `${QUESTW.due}: SEE ${TRAINERS[p.cls].name}` };
  return { pin: ERRANDW.pin[id], todo: ERRANDW.todo(id, p.cls), small: ERRANDW.small(id, p.cls) };
}

export function errandLine(p: Profile): ErrandLine | null {
  const first = firstErrands(p), open = openErrands(p);
  // The first two (ticked as done) while either's open, then whatever else is (the first job handed over at the first meeting among them).
  const rest = open.filter((id) => !first.some((r) => r.id === id)).map((id) => ({ id, done: false }));
  // (Due back at the trainer: that row, not the trainer's ticked one as well.)
  const back = rest.some((r) => r.id === 'back');
  const rows: { id: ErrandId; done: boolean }[] = [...first.filter((r) => !(back && r.id === 'trainer')), ...rest];
  if (!rows.some((r) => !r.done)) return null;
  const row = (r: { id: ErrandId; done: boolean }) => {
    const w = words(p, r.id);
    return `<div class="${r.done ? 'ok' : ''}"><b>${w.pin}</b><span>${r.done ? TRACKW.done : w.todo}</span></div>`;
  };
  const next = rows.find((r) => !r.done)!.id, h = questHeld(p);
  return { rows: `<div class="kitrows jobs">${rows.map(row).join('')}</div>`, small: words(p, next).small, key: rows.map((r) => r.id + (r.done ? '1' : '0')).join(',') + (h ? `:${h.q.id}${h.n}` : '') };
}
