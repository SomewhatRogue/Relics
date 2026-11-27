// A page's minute on the connection (client/netreport.ts): gaps, stalls and the longest gap between the leader's patches.
import { describe, expect, it } from 'vitest';
import { NETREP, NetReport } from '../src/client/netreport';

describe('the connection report', () => {
  it('counts the gaps and stalls, says nothing before its minute, then starts over', () => {
    const r = new NetReport(0);
    for (const at of [1, 1.05, 1.1, 1.3, 1.35, 1.8, 1.85]) r.patch(at);
    r.waited(0.12), (r.snaps = 2);
    expect(r.due(30, 'guest', 0.125, 0.16)).toBeNull();
    expect(r.due(NETREP.every, 'guest', 0.125, 0.16)).toMatchObject({ as: 'guest', rt: 125, trip: 160, n: 7, gaps: 2, stalls: 1, worst: 450, wait: 120, snaps: 2 });
    expect(r.due(NETREP.every * 2, 'host', 0.02, 0, 1)).toMatchObject({ as: 'host', rt: 20, friends: 1 });
  });
});
