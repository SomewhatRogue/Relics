/**
 * The end of a shift on the wall: kills, headshots, best streak, accuracy and score against your best,
 * the pay Brisk counts out (capped a night), and the way down. The best and the night's pay are kept on
 * the hero in the save (shared/watchpay.ts). Nothing goes to any server yet: the town board is slice 4.
 */
import { bestOf, nightOf, settleWatch, watchOpen, type Settled } from '../shared/watchpay';
import type { FieldName } from '../shared/watchtune';
import type { WatchResult } from '../sim/watchscore';
import type { Game } from './game';
import type { Panel } from './panels';
import { labelRows } from './card';
import { townPhase } from './townclock';
import { sfx } from './sfx';
import { WATCHW } from './watchwords';

const p = (s: string) => `<p>${s}</p>`;

/** Keep the shift's score and pay on the hero; what it came to. */
export function bankShift(g: Game, r: WatchResult, field: FieldName, now = Date.now()): Settled & { field: FieldName } {
  const pr = g.profile, out = settleWatch(pr.watch, r.total, nightOf(now), field);
  pr.watch = out.record;
  pr.gold += out.pay;
  g.keep();
  if (out.pay > 0) sfx.gold();
  return { ...out, field };
}

/** The card. `again` starts another shift (offered only while it's still night); `down` goes back to the stair. */
export function showShift(panel: Panel, r: WatchResult, st: Settled & { field: FieldName }, again: () => void, down: () => void): void {
  const W = WATCHW.rows;
  const rows: [string, string][] = [
    [W.kills, String(r.kills)],
    [W.heads, String(r.heads)],
    [W.streak, String(r.bestStreak)],
    [W.accuracy, `${r.accuracy}% (${r.hits} of ${r.shots})`],
    [W.bonus, `+${r.bonus}`],
    [W.score, String(r.total)],
    [st.best ? W.newBest : W.best, String(bestOf(st.record, st.field))],
  ];
  const pay = st.pay > 0 ? WATCHW.pay(st.pay) + (st.capped ? ' ' + WATCHW.capped : '') : st.capped ? WATCHW.paidOut : '';
  const html = labelRows(rows) + (r.lost ? p(WATCHW.lost(r.lost)) : '') + (pay ? p(pay) : '');
  const night = watchOpen(townPhase());
  panel.show(WATCHW.over, html, [...(night ? [{ label: WATCHW.again, primary: true, act: again }] : []), { label: WATCHW.down, primary: !night, act: down }], true);
}
