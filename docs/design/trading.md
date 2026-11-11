# Trading, and an item ledger so nothing can be duplicated

Spec, 2026-11-11 (Kyle and Claude Opus 5.5). Not built. Must land with or before the instances' loot rolls.

## The problem

Heroes are saved on the player's device (localStorage), with an optional cloud copy under a recovery code
(`api/_save.ts`). No server knows who owns which item. So a player can copy their save, trade an item away
(or win it in a roll), then restore the copy: the item exists twice. Rolls have their own holes: pass,
disconnect, reconnect and roll again; or a host handover re-rolling a boss's drop.

## The fix: a ledger for what can change hands

Only things that can be traded or won in a party roll are ledgered: instance pieces, cosmetics, and any
gear a player chooses to put up for trade. Everyday drops stay as they are.

- **Minted once.** Each such item gets a server id when it comes into being. A boss drop's id is fixed by
  the run and the boss (`<run>:<boss>`), and the server writes it only if it doesn't exist (Redis SET NX).
  A second mint of the same drop, from a reconnect, a host handover or a replayed message, is refused.
- **Owned on the server.** `relic:item:<id>` holds its owner (a hero id). The hero's save keeps the item as
  now, with its ledger id.
- **Checked on load and before use.** A ledgered item whose owner is no longer this hero (an old save
  restored after trading it away) shows as GONE and drops out of the save. Checked in one batched read.
- **Moved atomically.** A trade is one small server script: both heroes' offers are checked against the
  ledger and swapped in one step, or nothing moves.

## Loot rolls (instances)

- The host's dice decide the winner, as now; the host asks the server to mint the drop to the winner,
  keyed by run and boss. Only that write counts.
- A player who disconnects counts as PASS for that roll; rejoining doesn't reopen it.
- A handover mid-roll: the new host finishes the same roll from the saved state; the mint key stops a
  second item.

## Trading

- **In town:** walk up to another player and TRADE. Each puts in items and gold; both see both sides; both
  press ACCEPT, and any change to an offer clears both accepts. Then the server swaps.
- **On a job or in an instance:** trade with party members the same way (hand a drop to the friend who
  can use it). Deep finds can't be traded until they're banked.
- Gold in a trade is ledgered for that trade only (moved with it, the giver's save checked for enough).
- **What can't be traded** (Kyle, 2026-11-11): hungry gear, never (it goes to the church or Nettle);
  relics, never (one of each per hero). Cosmetics trade freely.

## Costs

A few Redis commands per mint and per trade, and one batched read on load. Nothing per frame.

## Build order

1. The ledger: mint (SET NX), owner, batched check, GONE on a mismatch.
2. Boss drops minted through it (with the Deep chat's roll system).
3. Trading in town, then in a party on a job.

## Open

1. Should a trade be logged where the players can see it (a receipt in the pack)?
