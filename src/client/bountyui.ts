/** The bounties' panel parts, for the North Gate and the keepers (shared/bounties.ts): the html, and the buttons. */
import { coins } from '../shared/coins';
import { bountyOf, canTake, handIn, held, isDone, postedOn, take, type Bounty } from '../shared/bounties';
import type { Profile } from '../shared/progress';
import { BOUNTYW } from './bountywords';
import { paidToast } from './errandpaid';
import type { Button } from './panels';

type Opts = { posted: boolean; day: number };

const row = (b: Bounty, tail: string) => `<p><b>${BOUNTYW.title[b.id]}</b> ${tail}<br>${BOUNTYW.line[b.id]} ${coins(b.pay)}, ${b.xp} XP</p>`;

/** The section: the day's two (at the gate) and what is held, with its count. */
export function bountyHtml(p: Profile, o: Opts): string {
  const mine = held(p).flatMap((h) => (bountyOf(h.id) ? [{ h, b: bountyOf(h.id)! }] : []));
  const out = (o.posted ? postedOn(o.day).filter((b) => !mine.some((m) => m.b.id === b.id)).map((b) => row(b, '')) : []).concat(mine.map(({ h, b }) => row(b, BOUNTYW.count(h.got, b.n))));
  const said = o.posted ? `<p class="dim">${BOUNTYW.posted.replace(/\*(.+?)\*/g, '<em>$1</em>')}</p>` : '';
  return out.length ? `<h4>${BOUNTYW.heading}</h4>${said}${out.join('')}${o.posted && held(p).length >= 2 ? `<p>${BOUNTYW.full}</p>` : ''}` : '';
}

/** TAKE for each posted (at the gate), HAND IN for each done. `after` redraws the panel. */
export function bountyButtons(p: Profile, o: Opts, after: () => void, saved: () => void): Button[] {
  const takes = o.posted ? postedOn(o.day).filter((b) => !held(p).some((h) => h.id === b.id)).map((b) => ({ label: `${BOUNTYW.take}: ${BOUNTYW.title[b.id]}`, disabled: !canTake(p, b.id), act: () => (take(p, b.id, o.day), saved(), after()) })) : [];
  return [...takes, ...handButtons(p, after, saved)];
}

/** HAND IN for each held bounty that is done: paid, the toast, and the panel drawn again. */
export function handButtons(p: Profile, after: () => void, saved: () => void): Button[] {
  return held(p).filter(isDone).map((h) => ({ label: `${BOUNTYW.handIn}: ${BOUNTYW.title[h.id]}`, act: () => { const r = handIn(p, h.id); if (r) (saved(), paidToast(r.pay), after()); } }));
}

/** The held bounties in a line for the roam banner under the zone's name: "WOLVES 3 OF 5". */
export const bountyBanner = (p: Profile): string =>
  held(p).flatMap((h) => (bountyOf(h.id) ? [`${BOUNTYW.title[h.id].replace('THE ', '')} ${BOUNTYW.count(h.got, bountyOf(h.id)!.n)}`] : [])).join(' | ');
