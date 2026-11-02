/**
 * Coming back to a town that was raided while you were away: the first time you see it, Sergeant
 * Dunn tells you. Which raid you've been told about is kept on this device (it's yours, not the
 * world's), so a second hero on the same phone isn't told twice.
 */
import { lastRaid, lossText, RAID_FRESH } from '../shared/raids';
import { RAID_NEWS } from '../shared/mendlines';
import type { WorldState } from '../shared/story';
import { line } from './speech';

const KEY = 'relic.raidseen';

let told: number | null = null;
function seen(): number {
  if (told !== null) return told;
  try {
    return (told = Number(localStorage.getItem(KEY)) || 0);
  } catch {
    return (told = 0);
  }
}

/** The panel to show, once, for a raid you haven't been told about; null if there's none. */
export function raidNews(w: WorldState): { title: string; html: string } | null {
  const r = lastRaid(w);
  if (!r || r.day <= seen() || w.day - r.day > RAID_FRESH) return null;
  told = r.day;
  try {
    localStorage.setItem(KEY, String(r.day));
  } catch {
    /* told this once, in this session */
  }
  return {
    title: RAID_NEWS.who,
    html: `<p class="dim">${line(RAID_NEWS.seen(lossText(r)))}</p><p><b>Dunn:</b> ${line(`"${RAID_NEWS.line}"`, 'DUNN')}</p>`,
  };
}
