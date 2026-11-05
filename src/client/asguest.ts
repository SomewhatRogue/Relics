/**
 * The leader's word as a friend's game reads it: ids are quoted whole, so the leader's own `me` becomes
 * `@lead` and this friend's id becomes `me` (coop.ts, for the job's end and its board: sim/score.ts).
 */
export const asGuest = <T>(x: T, myId: string): T => JSON.parse(JSON.stringify(x).split('"me"').join('"@lead"').split(`"${myId}"`).join('"me"')) as T;
