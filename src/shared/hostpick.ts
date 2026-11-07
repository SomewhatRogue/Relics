/**
 * Who runs a party's room, and when a host hands it on (Kyle, 2026-11-06). Pure, so it's tested in Node
 * (tests/hostpick.test.ts); client/parties.ts picks at setting out, client/hidehost.ts hands on.
 *
 * Every player's traffic goes through the one relay in sfo1, so a friend's delay to the host is about
 * half the host's trip to the relay plus half their own. The best host is the one with the shortest trip
 * (RelaySocket.rtt, the heartbeat's own measure), with a small lean toward a page that keeps a healthy
 * frame time (a laptop over a phone at the same trip). The party leader keeps hosting unless someone
 * else is better by MARGIN or more, so a near tie never moves the room. Only who runs the room changes:
 * the leader still leads the party (invites, the card, the job). The host is picked once, at setting
 * out, and kept for the job unless they leave or their page goes out of sight.
 */

export const HOSTPICK = {
  /** Someone else hosts only if the leader's score is this much worse (ms). */
  margin: 25,
  /** A frame time at or under this (ms) costs nothing. */
  frameOk: 20,
  /** Each ms of frame time over frameOk counts as this many ms of trip... */
  frameWeight: 0.5,
  /** ...up to this much (ms): a tie-break, never the main thing. */
  frameMost: 10,
  /** A member's report older than this (s) isn't trusted. */
  stale: 90,
  /** A member says their link again when the trip has moved this much (ms)... */
  moved: 10,
  /** ...or the frame time this much (ms)... */
  movedFrame: 8,
  /** ...or this long has gone by (s); never more often than every `gap` s. */
  every: 60,
  gap: 5,
};

/** How hiding a host's page hands the room on. */
export const HIDE = {
  /**
   * A desktop page out of sight this long (s) hands the room to a friend. It was 2.5: on 2026-11-06 the
   * host looked at another tab about 14 s, the room went to the friend, both reloaded the job, and the host
   * came back a guest. Out of sight, a desktop runs its room from a worker's timer at full pace (main.ts),
   * so waiting costs the friends nothing.
   */
  desk: 15,
};

/** A player's link, as they measure it: the trip to the relay and back (ms), and their average frame time (ms). */
export interface Link { r: number; f: number }

/** A link worth comparing: a trip measured (0 is not yet), both numbers sane. */
export const known = (l: Link | undefined): l is Link => !!l && l.r > 0 && l.r < 5000 && l.f >= 0 && l.f < 1000;

/** Lower is better: the trip, plus a little for a struggling page. */
export function linkScore(l: Link): number {
  return l.r + Math.min(HOSTPICK.frameMost, Math.max(0, (l.f - HOSTPICK.frameOk) * HOSTPICK.frameWeight));
}

/**
 * The host for a party setting out. `order`: the members, the leader first; `links`: what each has
 * reported (the leader's own included). The leader unless someone with a known link scores MARGIN
 * better; among near equals, the first in `order`.
 */
export function pickHost(order: string[], links: Record<string, Link | undefined>): string {
  const lead = order[0], mine = links[lead];
  if (!known(mine)) return lead;
  let best = lead, score = linkScore(mine);
  for (const id of order.slice(1)) {
    const l = links[id];
    if (known(l) && linkScore(l) < score) (best = id), (score = linkScore(l));
  }
  return best !== lead && linkScore(mine) - score >= HOSTPICK.margin ? best : lead;
}

/** Should a member say their link again now? (`said`: what they last said, and when; `now` in s.) */
export function sayAgain(cur: Link, said: { l: Link; at: number } | null, now: number): boolean {
  if (!known(cur)) return false;
  if (!said) return true;
  if (now - said.at < HOSTPICK.gap) return false;
  return !known(said.l) || Math.abs(cur.r - said.l.r) >= HOSTPICK.moved || Math.abs(cur.f - said.l.f) >= HOSTPICK.movedFrame || now - said.at >= HOSTPICK.every;
}

/**
 * Hand the room on now? Only a host with a friend still in the job. A page going away (`pagehide`)
 * hands on at once; out of sight, a phone or touch device at once (it freezes timers), a desktop after
 * HIDE.desk seconds (`hiddenFor`, or -1 while in sight).
 */
export function handNow(s: { hosting: boolean; friends: number; touch: boolean; hiddenFor: number; gone?: boolean }): boolean {
  if (!s.hosting || s.friends < 1) return false;
  if (s.gone) return true;
  if (s.hiddenFor < 0) return false;
  return s.touch || s.hiddenFor >= HIDE.desk;
}
