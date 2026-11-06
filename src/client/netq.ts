/**
 * This page's link, for picking who hosts a party's room (shared/hostpick.ts): the town socket's trip to
 * the relay (RelaySocket.rtt, from the heartbeat) and an average frame time, kept from main.ts's frames.
 * Nothing is sent from here: a member's link rides on the party's own join word (parties.ts).
 */
import type { Link } from '../shared/hostpick';

let frame = 0;

/** Each drawn frame's length (ms). A page out of sight draws none, so it's left as it was. */
export function noteFrame(ms: number): void {
  if (!(ms > 0 && ms < 250)) return;
  frame = frame ? frame * 0.95 + ms * 0.05 : ms;
}

/** The average frame time so far (ms; 0 before any). */
export const frameAvg = (): number => frame;

/** My link as I'd report it: whole ms. `rtt` in seconds (0: not measured yet). */
export const myLink = (rtt: number): Link => ({ r: Math.round(rtt * 1000), f: Math.round(frame) });
