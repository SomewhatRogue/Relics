/**
 * The council's week, in real time (Kyle, 2026-11-03): a vote is open to everyone all week and closes
 * at the end of Sunday, midnight Pacific (America/Los_Angeles, so it follows daylight saving). Pure:
 * Intl gives the zone's offset in Node and in the browser alike.
 */

export const COUNCIL = {
  /** Where the week ends: midnight at the end of Sunday, here. */
  tz: 'America/Los_Angeles',
  /** A council opening with less than this left in the week sits through the next one too (ms). */
  minOpen: 24 * 3600_000,
  /** A tie at the close: the council sits this much longer, once; then the reeve breaks it (ms). */
  tieExtra: 24 * 3600_000,
};

const DAY = 24 * 3600_000;
const fmt = new Intl.DateTimeFormat('en-US', { timeZone: COUNCIL.tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });

/** How far the zone's clock is ahead of UTC at instant `t` (ms; negative for Pacific). */
function offset(t: number): number {
  const p = Object.fromEntries(fmt.formatToParts(t).map((x) => [x.type, Number(x.value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
}

/** The zone's calendar day at `t`: a running day number, and the weekday (0 Sunday). */
export function localDay(t: number): { n: number; dow: number } {
  const n = Math.floor((t + offset(t)) / DAY);
  return { n, dow: (n + 4) % 7 };
}

/** The next week's end after `t`: Monday 00:00 in the zone, the moment Sunday is over. */
export function weekEnd(t: number): number {
  const { n, dow } = localDay(t), wall = (n + ((8 - dow) % 7 || 7)) * DAY;
  let u = wall - offset(t);
  for (let i = 0; i < 2; i++) u = wall - offset(u);
  return u;
}

/** When a council opening at `t` closes: this week's end, or next week's if this one's nearly gone. */
export function closeFor(t: number): number {
  const c = weekEnd(t);
  return c - t < COUNCIL.minOpen ? weekEnd(c) : c;
}

export const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
