/**
 * The town's goal line while a hero has errands (shared/errands.ts): the first two as rows, each
 * ticked DONE as it's done, then the trainer's word on a new skill. Off, the line is the town's own.
 */
import { firstErrands, openErrands, type ErrandId } from '../shared/errands';
import type { Profile } from '../shared/progress';
import { ERRANDW } from './errandwords';
import { TRACKW } from './tracker';

export interface ErrandLine { rows: string; small: string; key: string }

export function errandLine(p: Profile): ErrandLine | null {
  const first = firstErrands(p), open = openErrands(p);
  const rows: { id: ErrandId; done: boolean }[] = first.length ? first : open.map((id) => ({ id, done: false }));
  if (!rows.some((r) => !r.done)) return null;
  const row = (r: { id: ErrandId; done: boolean }) => `<div class="${r.done ? 'ok' : ''}"><b>${ERRANDW.pin[r.id]}</b><span>${r.done ? TRACKW.done : ERRANDW.todo(r.id, p.cls)}</span></div>`;
  const next = rows.find((r) => !r.done)!.id;
  return { rows: `<div class="kitrows jobs">${rows.map(row).join('')}</div>`, small: ERRANDW.small(next, p.cls), key: rows.map((r) => r.id + (r.done ? '1' : '0')).join(',') };
}
