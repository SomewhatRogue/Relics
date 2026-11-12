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
- The wood's talk (Hew waking you, Orla on the road) and the first-blow calls are strips that stop nothing; a tap skips one; on a phone under the top bar. Only a lesson's own card, and the relic card, stop the world (Kyle: lines that stop you get in the way). (Claude Opus 5.5)
- Relic moments are cleared when you switch heroes: a brand-new Warrior was shown a LODESTONE in the wood, queued by the hero the game loaded behind the title. Root of the queueing itself not found (not reproduced in a clean browser). (Claude Opus 5.5)
- The wood teaches the Bitter: your first hit (Hew alive) stops the world on his card with one Bitter and the POTION button; drink it and he hands two more in passing. Only the Bitter drops or sells now: the Brandy is dormant, a saved one turns to Bitter, Gannet sells nothing (Kyle). Lines through the lore keeper and line editor; the bible notes Wickhold pays Hew in Bitter. (Claude Opus 5.5)
- Walking: Rangers just under Rogues (longbow 0.98, shortbow 1.04, crossbow 0.96); Mages slower (wand 0.79, staff 0.78, spellblade 0.8; 0.78 is as slow as a kit goes, the kegs are timed to it). The shortbow's dodge is SPRINT: each press runs you 1.55x for 1.6 s for 24 stamina, steered, no dodging through blows. Your own hound never puts up a PET prompt (it covered the view); USE still pets. From Kyle's friend's playtest. (Claude Opus 5.5)
- TRY THE <class> on a class's page (client/trial.ts): a scratch hero of that class in the Training Yard, never saved (store skips a trial save), with its starting skill, a javelin that never runs dry and three Bitters; a bar spawns goblins (3 at most) and a butcher (1 at most), CLEAR, DONE back to the class page. From Kyle's friend; Kyle set the caps. (Claude Opus 5.5)
