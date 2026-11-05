/**
 * Online play's two plain lines (words waiting on the lore keeper and line editor): the month's Redis
 * meter in the settings box (`/api/room?meter=1`, api/room.ts), and the note when the month's budget is
 * used up and the game goes on alone (relay.ts onFull).
 */
import { FULL, ONLINE } from './relay';
import { toast } from './partytoast';

export const NETW = {
  full: "Online play is used up for this month. You're playing alone for now.",
  meter: (used: number, limit: number) => `Online use this month: ${used.toLocaleString('en-US')} of ${limit.toLocaleString('en-US')}`,
};

/** The note, once, as online play goes off. */
export function sayFull(): void {
  toast(NETW.full, { kind: 'net' });
  void fillMeter();
}

/** The settings box's meter line: filled each time the box opens (one request, one Redis GET). */
export async function fillMeter(): Promise<void> {
  const el = document.getElementById('netmeter');
  if (!el) return;
  if (FULL) return void ((el.textContent = NETW.full), (el.hidden = false));
  if (!ONLINE) return void (el.hidden = true);
  try {
    const r = await fetch('/api/room?meter=1', { cache: 'no-store' });
    const m = (await r.json()) as { used?: number | null; limit?: number; full?: boolean };
    if (m.full) el.textContent = NETW.full;
    else if (typeof m.used === 'number' && typeof m.limit === 'number') el.textContent = NETW.meter(m.used, m.limit);
    else return void (el.hidden = true);
    el.hidden = false;
  } catch {
    el.hidden = true;
  }
}
