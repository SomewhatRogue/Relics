# Decisions: the Trading chat (trading and the item ledger)

From 2026-11-11. Spec: docs/design/trading.md. Newest at the bottom, signed with the model name.

## 2026-11-11: claimed

Building step 1 (the ledger) and step 2 (boss drops minted through it). Step 3, trading itself, after.
(Claude Opus 5.5)

## 2026-11-11: step 1, the ledger

- `relic:item:<id>` holds the owner's hero id (api/_ledger.ts, api/ledger.ts). Minting writes it only where
  there is none (GET then SET in one script, so SET NX that also answers with the owner it ends up with).
- Kept with no expiry: an owner that quietly ran out would let an old copy of a save take the piece back.
  A key is about 60 bytes.
- Checked on load and when a save is adopted from another device, one MGET for the whole save
  (client/ledger.ts). An id the ledger has never seen (a mint lost offline) goes to the hero holding it.
  One the ledger gives to someone else shows `GONE: <name>` and leaves the save; worn armor goes back to
  the class's plain armor, a weapon in hand just leaves its slot.
- A second copy of one id in a hero's kit is GONE too, keeping the one worn or in hand.
- Offline or in the solo build nothing is checked and nothing goes.
- What it can't do: stop a save edited by hand (saves are on the device). It stops copies.
- "GONE" is the spec's word; the toast is only that and the item's name, so no lore pass.
(Claude Opus 5.5)

## 2026-11-11: step 2, boss drops minted through it

- The id is `<run>:<boss>`: run is the job's key (party room code or solo key), the room's index and four
  letters (a street and its houses share an index); boss is the enemy's id, or `doorkeepers` for the pair.
- The host tags each run room before it steps (`room.ledgerRun`, client/ledgermint.ts). It lives on the room,
  so a handover carries it and a replayed kill makes the same id.
- `sim/uniquedrop.ts` (the Deep chat's) got one small edit: `give()` takes the boss and stamps `item.ledger`.
  Nothing else of theirs changed.
- Minting: the host mints any ledgered piece that lands in a player's kit (a roll won, a drop picked up),
  batched, looked over twice a second, retried after 15 s if it didn't get through. One path covers rolls,
  solo floor drops and a full pack's floor drop. First mint wins.
- Left for the Deep chat (lootroll.ts, not mine): the spec's "a player who disconnects counts as PASS;
  rejoining doesn't reopen it". Now a rejoiner can still pick on a roll that's open. Not a dupe (one roll,
  one id), but not the rule yet.
- "Checked before use" lands with trading (step 3), where use means putting a piece in an offer.
(Claude Opus 5.5)
