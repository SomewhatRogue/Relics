/**
 * Small pieces of the job tracker (the banner, main.ts): a diamond for each room of the job with the one you're in gilt, and names in title case for the display face
 * (a blackletter in capitals can't be read).
 */
const SMALL = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'up']);

/** "BACK TO WICKHOLD?" as "Back to Wickhold?"; a name already in mixed case is left alone. */
export function titleCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/[a-z][a-z']*/g, (w, at: number) => (at > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)));
}

/** A diamond a room, the one you're in (`at`, from 0) lit gold. */
export const roomsHtml = (at: number, rooms: number) => (rooms > 1 ? `<em class="rooms">${Array.from({ length: rooms }, (_, i) => `<i class="rm${i === at ? ' on' : i < at ? ' done' : ''}"></i>`).join('')}</em>` : '');

/** The tracker's own words (Kyle's style: prose-notes.md section 4). */
export const TRACKW = {
  /** The folded line on an expedition, until the pinned jobs are done. */
  jobsLeft: (left: number, of: number) => `${left} OF ${of} JOBS LEFT`,
  done: 'DONE',
  town: (day: number) => `WICKHOLD, DAY ${day}`,
};

interface Pinned { kind: string; done: boolean }

/** An expedition's pinned jobs and side jobs as rows, each done or what to do (the tracker opened). */
export function expedRows(x: { goals: Pinned[]; sides: Pinned[] }, words: Record<string, { pin: string; todo: string }>, boss: string): string {
  const row = (g: Pinned) => `<div class="${g.done ? 'ok' : ''}"><b>${words[g.kind].pin}</b><span>${g.done ? TRACKW.done : words[g.kind].todo.split('{boss}').join(boss)}</span></div>`;
  return `<div class="kitrows jobs">${x.goals.map(row).join('')}${x.sides.map(row).join('')}</div>`;
}

/** The folded line: the room diamonds (if any) and one short line. */
export const smallLine = (text: string, rooms = '') => `<span class="ln">${rooms}<em>${text}</em></span>`;
