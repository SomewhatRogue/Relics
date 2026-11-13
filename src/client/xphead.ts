/** Level, a bar to the next, and gold: the top of the trainer's screen and the knacks tree. */
import { LEVEL_CAP, xpFor, type Profile } from '../shared/progress';
import { coinsHtml } from '../shared/coins';

export function xpHead(p: Profile): string {
  const top = p.level >= LEVEL_CAP, from = xpFor(p.level), to = xpFor(p.level + 1);
  const fill = top ? 100 : Math.max(0, Math.min(100, Math.round(((p.xp - from) / (to - from)) * 100)));
  return `<div class="tr-head"><div class="tr-top"><b>LEVEL ${p.level}</b><em>${coinsHtml(p.gold)}</em></div>` +
    `<div class="tr-bar"><i style="width:${fill}%"></i></div><div class="tr-xp">${top ? 'FULL' : `${p.xp} / ${to} XP`}</div></div>`;
}
