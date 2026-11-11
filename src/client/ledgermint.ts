/**
 * Minting on the room's host (docs/design/trading.md, step 2). Each frame, before the rooms step: a run's room
 * with no run tag gets one (shared/ledger.ts runTag; kept on the room, so a new host after a handover goes on
 * with the same one), and every ledgered piece that has landed in a player's kit (a roll won, a drop picked up)
 * is minted to that player, batched. The ledger writes an id only once, so the first mint is the one that
 * counts; a piece the ledger gives to someone else shows GONE the next time its save is checked (ledger.ts).
 * Drawing and the fight are untouched: the tag is a string on the room, and the sim stamps it (sim/uniquedrop.ts).
 */
import { HERO_ID, LEDGER_MAX, ledgered, runTag } from '../shared/ledger';
import type { ArenaRoom } from '../sim/room';
import { players } from '../sim/lootroll';
import { LEDGER, ledgerCall } from './ledger';

/** How often the kits are looked over, and how long to wait after a mint didn't get through, s. */
const LOOK = 0.5, RETRY = 15;

export class LedgerMint {
  private sent = new Set<string>();
  private queue = new Map<string, string>();
  private lookedAt = -Infinity;
  private waitUntil = 0;
  private busy = false;

  /** `job`: the job's key (Game.jobKey); `index`: the run's room; `now`: seconds. */
  watch(rooms: Iterable<ArenaRoom>, job: string, index: number, now: number): void {
    if (!job) return;
    const look = now - this.lookedAt >= LOOK;
    for (const r of rooms) {
      if (!r.ledgerRun) r.ledgerRun = runTag(job, index, Math.random);
      if (!look || !LEDGER) continue;
      for (const h of players(r.heroes)) {
        if (!HERO_ID.test(h.id)) continue;
        for (const it of ledgered(h)) if (!this.sent.has(it.ledger!)) this.sent.add(it.ledger!), this.queue.set(it.ledger!, h.id);
      }
    }
    if (look) this.lookedAt = now;
    if (this.queue.size && !this.busy && now >= this.waitUntil) void this.flush(now);
  }

  private async flush(now: number): Promise<void> {
    const pairs = [...this.queue].slice(0, LEDGER_MAX);
    for (const [id] of pairs) this.queue.delete(id);
    this.busy = true;
    const r = await ledgerCall({ mint: pairs });
    this.busy = false;
    // Not through (offline, the keeper out of reach): back in line, tried again a little later.
    if (!r) {
      for (const [id, hero] of pairs) if (!this.queue.has(id)) this.queue.set(id, hero);
      this.waitUntil = now + RETRY;
    }
  }
}
