/**
 * Every hero in the party side by side at a job's end (Kyle, 2026-11-05: "show them a recap of how they
 * and all players did in that mission"): a column each, name and class at the top and their callout
 * under it, then six rows a phone can read at a glance; the rest behind MORE. A number gilt where that
 * hero led the party at it (recapcalls.ts). The counts are the room's own (sim/score.ts).
 */
import { CLASS_COL } from './doormarks';
import { CLASS_NAME } from '../shared/classes';
import type { Count } from '../sim/score';
import { leads, type CallId } from './recapcalls';
import { RECAPW } from './recapwords';
import type { PartyLine } from './recaptally';

/** The rows shown; the rest open under MORE. */
export const SHOWN: readonly Count[] = ['kills', 'dealt', 'taken', 'dodges', 'parries', 'downs'];
export const MORE: readonly Count[] = ['blocks', 'perfect', 'raised', 'healed', 'best'];
/** Rows where leading is something to light up (not damage taken, not downs). */
const GOOD = new Set<Count>(['kills', 'dealt', 'dodges', 'parries', 'blocks', 'perfect', 'raised', 'healed', 'best']);
const led = (l: PartyLine, all: PartyLine[], k: Count) => GOOD.has(k) && leads(l.s, all.map((o) => o.s), k as CallId);

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
/** Big numbers stay narrow enough for four columns on a phone. */
export const num = (v: number) => (v >= 10000 ? `${(v / 1000).toFixed(v >= 100000 ? 0 : 1)}k` : String(Math.round(v)));

function rows(ks: readonly Count[], party: PartyLine[]): string {
  return ks.map((k) => `<div><b>${RECAPW.stat[k]}</b>${party.map((l) => `<span${led(l, party, k) ? ' class="lead"' : ''}>${num(l.s[k])}</span>`).join('')}</div>`).join('');
}

export function partyTable(party: PartyLine[]): string {
  if (!party.length) return '';
  const who = party.map((l) => {
    const col = l.cls ? CLASS_COL[l.cls] : 'var(--bone)';
    return `<div class="pt-who${l.me ? ' me' : ''}" style="--cls:${col}"><b>${esc(l.name.toUpperCase())}</b><em>${l.cls ? CLASS_NAME[l.cls] : ''}</em>${l.call ? `<i>${RECAPW.call[l.call]}</i>` : ''}</div>`;
  }).join('');
  const grid = (body: string) => `<div class="pt-grid">${body}</div>`;
  return `<div class="party${party.length > 2 ? ' many' : ''}" style="--n:${party.length}">${grid(`<div><span></span>${who}</div>${rows(SHOWN, party)}`)}` +
    `<details class="pt-more"><summary><span class="m">${RECAPW.more}</span><span class="l">${RECAPW.less}</span></summary>${grid(rows(MORE, party))}</details></div>`;
}
