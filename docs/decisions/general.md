# Decisions: the general chat (playtest fixes, tuning, specs)

From 2026-11-11. Earlier decisions are in docs/DECISIONS.md (the archive). Newest at the bottom. Sign each
entry with the model name.

## 2026-11-11 (Claude Opus 5.5)

- Per-chat logs and docs/BOARD.md set up (Kyle: "a pub sub, like a bus"). This chat writes here only.
- Relics come only from great bosses' first kills, each hero once; every hero starts with the javelin;
  five uses each (docs/design/holy-and-hungry.md section 4).
- Trading spec with an item ledger against duplicates; hungry gear and relics can't be traded
  (docs/design/trading.md). Instance spec with Rakehead's bosses and pools (docs/design/instances.md).
- UI look picked: iron and ember, everywhere (Kyle: parchment "not on theme at all"). Style guide in
  docs/design/ui-look.md; waiting on the board for a UI chat. Art pass waits on the size pick. (Claude Opus 5.5)
- Body size picked: **1.5x** (Kyle: "PERFECT"). Props people stand by scale with them; the map, footprints and telegraphs don't. (Claude Opus 5.5)
- Art pass spec: bodies redrawn at 1.5x with whole pixels, props grow, buildings taller on the same footprint, telegraphs unchanged; bosses get shapes and moves (docs/design/art-pass.md). (Claude Opus 5.5)
- Camera stays as it is: 1.5x bodies at today's zoom (12 tiles across on a phone), no tilt (Kyle). (Claude Opus 5.5)
- The wood's block lesson: 3 blocks, not 5 (Healer 3, not 4) (Kyle: "just blocking 3 is absolutely fine"). A fresh hero gets no relics until the Stoker falls, checked in a fresh browser; Kyle's flood not reproduced yet. (Claude Opus 5.5)
